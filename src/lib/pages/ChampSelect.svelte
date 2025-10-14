<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { lcuService } from "$lib/services/lcuService";
    import { riotApi } from "$lib/services/riotApi";
    import { notifications } from "$lib/stores/notification";
    import { champSelectStore } from "$lib/stores/champSelect";
    import Card from "$lib/components/Card.svelte";

    let champions: Array<{
        src: string;
        alt: string;
        id: string;
        numericalId: string;
    }> = [];
    let isLoadingChampions = true;
    let searchText = "";
    let searchBanText = "";
    let searchBackupText = "";

    // Subscribe to store values
    let settings: import("$lib/stores/champSelect").ChampSelectSettings;
    const unsubscribe = champSelectStore.subscribe((value) => {
        settings = value;
    });

    // Auto features (reactive to store)
    $: autoAcceptEnabled = settings?.autoAcceptEnabled ?? false;
    $: instalockEnabled = settings?.instalockEnabled ?? false;
    $: instalockDelay = settings?.instalockDelay ?? 0;
    $: autoBanEnabled = settings?.autoBanEnabled ?? false;
    $: autoBanDelay = settings?.autoBanDelay ?? 0;
    $: backupPickEnabled = settings?.backupPickEnabled ?? false;
    $: dodgeOnBan = settings?.dodgeOnBan ?? false;

    // Champion selections (reactive to store)
    $: selectedChampion = settings?.selectedChampion ?? null;
    $: selectedBanChampion = settings?.selectedBanChampion ?? null;
    $: selectedBackupChampion = settings?.selectedBackupChampion ?? null;

    // Instant message (reactive to store)
    $: instantMessageEnabled = settings?.instantMessageEnabled ?? false;
    $: instantMessageText = settings?.instantMessageText ?? "";
    $: instantMessageTimes = settings?.instantMessageTimes ?? 1;
    $: instantMessageDelay = settings?.instantMessageDelay ?? 0;
    $: instantMessageDelayBetween = settings?.instantMessageDelayBetween ?? 0;

    // Other features (reactive to store)
    $: instantMuteEnabled = settings?.instantMuteEnabled ?? false;
    $: blueSideNotification = settings?.blueSideNotification ?? false;
    $: currentSide = settings?.currentSide ?? "";

    // Role selection (reactive to store)
    $: primaryRole = settings?.primaryRole ?? "UNSELECTED";
    $: secondaryRole = settings?.secondaryRole ?? "UNSELECTED";
    const roles = [
        "UNSELECTED",
        "TOP",
        "JUNGLE",
        "MIDDLE",
        "BOTTOM",
        "UTILITY",
        "FILL",
    ];

    // Multi-search (reactive to store)
    $: multiSearchWebsite = settings?.multiSearchWebsite ?? "opgg";
    const multiSearchWebsites = [
        { value: "opgg", label: "OP.GG" },
        { value: "ugg", label: "U.GG" },
        { value: "porogg", label: "PORO.GG" },
        { value: "porofessor", label: "Porofessor.gg" },
    ];

    // Champ select monitoring
    let champSelectInterval: number | null = null;
    let isInChampSelect = false;

    // Auto accept monitoring
    let autoAcceptInterval: number | null = null;

    function startChampSelectMonitoring() {
        if (champSelectInterval !== null) return;

        champSelectInterval = window.setInterval(async () => {
            try {
                const session = await lcuService.getChampSelectSession();
                if (session.success && !isInChampSelect) {
                    // Just entered champ select
                    isInChampSelect = true;
                    onChampSelectStart();
                } else if (!session.success && isInChampSelect) {
                    // Left champ select
                    isInChampSelect = false;
                    onChampSelectEnd();
                }
            } catch (error) {
                if (isInChampSelect) {
                    isInChampSelect = false;
                    onChampSelectEnd();
                }
            }
        }, 1000);
    }

    function stopChampSelectMonitoring() {
        if (champSelectInterval) {
            clearInterval(champSelectInterval);
            champSelectInterval = null;
        }
        isInChampSelect = false;
    }

    function startAutoAcceptMonitoring() {
        if (autoAcceptInterval !== null) return;

        autoAcceptInterval = window.setInterval(async () => {
            try {
                // Check matchmaking search state first
                const searchStateResponse = await lcuService.customRequest(
                    "GET",
                    "/lol-lobby/v2/lobby/matchmaking/search-state",
                );

                if (searchStateResponse.success && searchStateResponse.data) {
                    const searchState = searchStateResponse.data.searchState;

                    if (searchState === "Found") {
                        // Check if we're in a ready check by trying to get champ select session
                        const sessionResponse =
                            await lcuService.getChampSelectSession();

                        // If champ select fails but search state is "Found", it's a ready check
                        if (
                            !sessionResponse.success &&
                            sessionResponse.message.includes("RPC_ERROR")
                        ) {
                            const response = await lcuService.autoAccept(true);
                            if (response.success) {
                                notifications.success(
                                    "Auto-accepted matchmaking!",
                                );
                            } else if (
                                response.message &&
                                response.message.includes("already accepted")
                            ) {
                                notifications.info("Match already accepted");
                            }
                        }
                    }
                }
            } catch (error) {
                // Silently continue monitoring - don't spam notifications
            }
        }, 100); // Check every 100ms for more responsive auto accepting
    }

    function stopAutoAcceptMonitoring() {
        if (autoAcceptInterval) {
            clearInterval(autoAcceptInterval);
            autoAcceptInterval = null;
        }
    }

    async function onChampSelectStart() {
        notifications.info("Entered champion select");

        // Execute enabled features
        if (blueSideNotification) {
            await checkSide();
        }

        if (instantMuteEnabled) {
            try {
                const response = await lcuService.instantMuteAll();
                if (response.success) {
                    notifications.success("Muted all players");
                }
            } catch (error) {
                notifications.error("Failed to mute players");
            }
        }

        if (instantMessageEnabled && instantMessageText.trim()) {
            setTimeout(async () => {
                try {
                    const response = await lcuService.sendInstantMessage(
                        instantMessageText,
                        instantMessageTimes,
                        instantMessageDelayBetween,
                    );
                    if (response.success) {
                        notifications.success("Sent instant message");
                    }
                } catch (error) {
                    notifications.error("Failed to send instant message");
                }
            }, instantMessageDelay);
        }

        // Auto-accept monitoring is handled separately

        // Instalock monitoring
        if (instalockEnabled && selectedChampion) {
            monitorForPick();
        }

        // Auto-ban monitoring
        if (autoBanEnabled && selectedBanChampion) {
            monitorForBan();
        }
    }

    async function onChampSelectEnd() {
        notifications.info("Left champion select");
    }

    async function monitorForPick() {
        let attempts = 0;
        const maxAttempts = 240; // 2 minutes (240 * 500ms)
        const pickInterval = setInterval(async () => {
            try {
                const sessionResponse =
                    await lcuService.getChampSelectSession();
                if (!sessionResponse.success) {
                    console.log(
                        "Instalock: Failed to get champ select session",
                    );
                    clearInterval(pickInterval);
                    return;
                }

                const session = sessionResponse.data;
                const localPlayerCellId = session.localPlayerCellId;
                const actions = session.actions;

                console.log(
                    `Instalock attempt ${attempts + 1}: Found ${actions.length} action groups`,
                );

                // Check if we're in the pick phase
                let pickPhase = false;
                for (const actionGroup of actions) {
                    for (const action of actionGroup) {
                        if (
                            action.type === "pick" &&
                            action.actorCellId === localPlayerCellId
                        ) {
                            pickPhase = true;
                            console.log(
                                `Instalock: Found pick action for local player, completed: ${action.completed}`,
                            );
                            if (!action.completed) {
                                // Delay before picking
                                console.log(
                                    `Instalock: Waiting ${instalockDelay}ms before picking`,
                                );
                                await new Promise((resolve) =>
                                    setTimeout(resolve, instalockDelay),
                                );

                                // Determine which champion to pick (main or backup)
                                let championToPick = parseInt(
                                    selectedChampion!,
                                );

                                // If backup pick is enabled, check if main champion is available
                                if (
                                    backupPickEnabled &&
                                    selectedBackupChampion
                                ) {
                                    // Check if main champion is banned or picked
                                    const isMainBanned =
                                        Array.isArray(session.bans) &&
                                        session.bans.some(
                                            (ban: any) =>
                                                ban?.championId ===
                                                parseInt(selectedChampion!),
                                        );
                                    const isMainPicked =
                                        Array.isArray(session.actions) &&
                                        session.actions.some(
                                            (actionGroup: any) =>
                                                Array.isArray(actionGroup) &&
                                                actionGroup.some(
                                                    (action: any) =>
                                                        action?.type ===
                                                            "pick" &&
                                                        action?.championId ===
                                                            parseInt(
                                                                selectedChampion!,
                                                            ) &&
                                                        action?.completed,
                                                ),
                                        );

                                    if (isMainBanned || isMainPicked) {
                                        console.log(
                                            "Instalock: Main champion not available, using backup",
                                        );
                                        championToPick = parseInt(
                                            selectedBackupChampion,
                                        );
                                    }
                                }

                                console.log(
                                    `Instalock: Attempting to pick champion ID ${championToPick}`,
                                );

                                const response =
                                    await lcuService.instalock(championToPick);

                                if (response.success) {
                                    notifications.success(
                                        "Champion instalocked!",
                                    );
                                    console.log(
                                        "Instalock: Successfully locked champion",
                                    );
                                    clearInterval(pickInterval);
                                    return;
                                } else {
                                    console.error(
                                        "Instalock: Failed to lock champion:",
                                        response.message,
                                    );
                                    notifications.error(
                                        `Instalock failed: ${response.message}`,
                                    );
                                }
                            }
                        }
                    }
                }

                if (!pickPhase) {
                    console.log(
                        "Instalock: Not in pick phase yet, continuing to monitor",
                    );
                }
            } catch (error) {
                // Periodic logging of failed attempts
                if (attempts % 10 === 0) {
                    console.error(
                        `Instalock attempt ${attempts + 1} failed:`,
                        error,
                    );
                    notifications.warning(`Instalock attempt failed: ${error}`);
                }
            }

            // Stop after max attempts
            attempts++;
            if (attempts >= maxAttempts) {
                console.error("Instalock: Timed out after 2 minutes");
                notifications.error("Instalock timed out");
                clearInterval(pickInterval);
            }
        }, 500);

        // Stop monitoring after 2 minutes
        setTimeout(() => {
            console.log(
                "Instalock: Stopping monitoring after 2 minutes timeout",
            );
            clearInterval(pickInterval);
        }, 120000);
    }

    async function monitorForBan() {
        const banInterval = setInterval(async () => {
            try {
                if (selectedBanChampion) {
                    setTimeout(async () => {
                        const response = await lcuService.autoBan(
                            parseInt(selectedBanChampion!),
                            autoBanDelay,
                        );
                        if (response.success) {
                            notifications.success("Champion auto-banned!");
                        }
                    }, autoBanDelay);
                }
            } catch (error) {
                // Keep trying
            }
        }, 1000);

        // Stop monitoring after 2 minutes
        setTimeout(() => clearInterval(banInterval), 120000);
    }

    onMount(async () => {
        try {
            champions = await riotApi.getChampionIcons();
            isLoadingChampions = false;
        } catch (error) {
            notifications.error("Failed to load champions");
            isLoadingChampions = false;
        }

        // Start monitoring champ select
        startChampSelectMonitoring();

        // Start auto accept monitoring if enabled
        if (autoAcceptEnabled) {
            startAutoAcceptMonitoring();
        }
    });

    onDestroy(() => {
        stopChampSelectMonitoring();
        stopAutoAcceptMonitoring();
        unsubscribe(); // Clean up store subscription
    });

    async function toggleAutoAccept() {
        const newValue = !autoAcceptEnabled;
        champSelectStore.updateSetting("autoAcceptEnabled", newValue);
        if (newValue) {
            startAutoAcceptMonitoring();
            notifications.success("Auto-accept enabled");
        } else {
            stopAutoAcceptMonitoring();
            notifications.info("Auto-accept disabled");
        }
    }

    async function selectInstalockChampion(championId: string) {
        const champion = champions.find((c) => c.id === championId);
        champSelectStore.updateSetting(
            "selectedChampion",
            champion?.numericalId ?? null,
        );
        notifications.success(`Instalock champion set to ${champion?.alt}`);
    }

    async function selectBanChampion(championId: string) {
        const champion = champions.find((c) => c.id === championId);
        champSelectStore.updateSetting(
            "selectedBanChampion",
            champion?.numericalId ?? null,
        );
        notifications.success(`Auto-ban champion set to ${champion?.alt}`);
    }

    async function selectBackupPick(championId: string) {
        const champion = champions.find((c) => c.id === championId);
        champSelectStore.updateSetting(
            "selectedBackupChampion",
            champion?.numericalId ?? null,
        );
        notifications.success(`Backup pick set to ${champion?.alt}`);
    }

    async function dodgeLobby() {
        try {
            const response = await lcuService.dodgeLobby();
            if (response.success) {
                notifications.success("Dodged lobby successfully!");
            } else {
                notifications.error(`Failed to dodge: ${response.message}`);
            }
        } catch (error) {
            notifications.error(`Error dodging: ${error}`);
        }
    }

    async function multiSearch() {
        try {
            const response = await lcuService.multiSearch(multiSearchWebsite);
            if (response.success) {
                notifications.success(
                    `Opened ${multiSearchWebsite.toUpperCase()} multi-search`,
                );
            } else {
                notifications.error(
                    `Failed to open multi-search: ${response.message}`,
                );
            }
        } catch (error) {
            notifications.error(`Error opening multi-search: ${error}`);
        }
    }

    async function importRunes() {
        try {
            const response = await lcuService.autoImportRunes();
            if (response.success) {
                notifications.success(
                    "Imported runes from OP.GG successfully!",
                );
            } else {
                notifications.error(
                    `Failed to import runes: ${response.message}`,
                );
            }
        } catch (error) {
            notifications.error(`Error importing runes: ${error}`);
        }
    }

    async function setRoles() {
        try {
            const response = await lcuService.setRoles(
                primaryRole,
                secondaryRole,
            );
            if (response.success) {
                notifications.success(
                    `Set roles: ${primaryRole} / ${secondaryRole}`,
                );
            } else {
                notifications.error(`Failed to set roles: ${response.message}`);
            }
        } catch (error) {
            notifications.error(`Error setting roles: ${error}`);
        }
    }

    async function checkSide() {
        try {
            const response = await lcuService.getBlueSide();
            if (response.success && response.data) {
                champSelectStore.updateSetting(
                    "currentSide",
                    response.data.side,
                );
                notifications.success(`You are on ${response.data.side} side!`);
            } else {
                notifications.error(
                    `Failed to check side: ${response.message}`,
                );
            }
        } catch (error) {
            notifications.error(`Error checking side: ${error}`);
        }
    }

    async function startQueue() {
        try {
            const response = await lcuService.startQueue();
            if (response.success) {
                notifications.success("Started queue!");
            } else {
                notifications.error(
                    `Failed to start queue: ${response.message}`,
                );
            }
        } catch (error) {
            notifications.error(`Error starting queue: ${error}`);
        }
    }

    $: filteredChampions = champions.filter((champ) =>
        champ.alt.toLowerCase().includes(searchText.toLowerCase()),
    );

    $: filteredBanChampions = champions.filter((champ) =>
        champ.alt.toLowerCase().includes(searchBanText.toLowerCase()),
    );

    $: filteredBackupChampions = champions.filter((champ) =>
        champ.alt.toLowerCase().includes(searchBackupText.toLowerCase()),
    );
</script>

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-4 text-primary">
            Champion Select Automation
        </h1>
        <p class="text-lg text-base-content/70">
            Advanced champion select tools inspired by KBot
        </p>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button class="btn btn-primary" on:click={startQueue}>
            ▶️ Start Queue
        </button>
        <button class="btn btn-warning" on:click={dodgeLobby}>
            🚪 Dodge Lobby
        </button>
        <button class="btn btn-info" on:click={importRunes}>
            📊 Import Runes (OP.GG)
        </button>
        <button class="btn btn-accent" on:click={checkSide}>
            🎯 Check Side
        </button>
    </div>

    {#if currentSide}
        <div
            class="alert {currentSide === 'Blue'
                ? 'alert-info'
                : 'alert-error'} mb-6"
        >
            <span>You are on the <strong>{currentSide}</strong> side!</span>
        </div>
    {/if}

    <!-- Role Selection -->
    <Card title="Role Selection">
        <div class="flex gap-4 items-center">
            <select
                class="select select-bordered"
                value={primaryRole}
                on:change={(e) =>
                    champSelectStore.updateSetting(
                        "primaryRole",
                        e.target.value,
                    )}
            >
                <option disabled>Primary Role</option>
                {#each roles as role}
                    <option value={role}>{role}</option>
                {/each}
            </select>
            <select
                class="select select-bordered"
                value={secondaryRole}
                on:change={(e) =>
                    champSelectStore.updateSetting(
                        "secondaryRole",
                        e.target.value,
                    )}
            >
                <option disabled>Secondary Role</option>
                {#each roles as role}
                    <option value={role}>{role}</option>
                {/each}
            </select>
            <button class="btn btn-primary" on:click={setRoles}
                >Set Roles</button
            >
        </div>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- Auto Accept -->
        <Card title="Auto Accept">
            <div class="flex items-center justify-between">
                <span>Automatically accept matchmaking</span>
                <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    checked={autoAcceptEnabled}
                    on:change={toggleAutoAccept}
                />
            </div>
        </Card>

        <!-- Multi-Search -->
        <Card title="Multi-Search Players">
            <div class="flex gap-2">
                <select
                    class="select select-bordered flex-1"
                    value={multiSearchWebsite}
                    on:change={(e) =>
                        champSelectStore.updateSetting(
                            "multiSearchWebsite",
                            e.target.value,
                        )}
                >
                    {#each multiSearchWebsites as site}
                        <option value={site.value}>{site.label}</option>
                    {/each}
                </select>
                <button class="btn btn-primary" on:click={multiSearch}>
                    Search
                </button>
            </div>
        </Card>

        <!-- Instant Message -->
        <Card title="Instant Message">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span>Enable instant message</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-primary"
                        checked={instantMessageEnabled}
                        on:change={(e) =>
                            champSelectStore.updateSetting(
                                "instantMessageEnabled",
                                e.target.checked,
                            )}
                    />
                </div>
                {#if instantMessageEnabled}
                    <input
                        type="text"
                        placeholder="Message to send..."
                        class="input input-bordered w-full"
                        value={instantMessageText}
                        on:input={(e) =>
                            champSelectStore.updateSetting(
                                "instantMessageText",
                                e.target.value,
                            )}
                    />
                    <div class="grid grid-cols-3 gap-2">
                        <input
                            type="number"
                            placeholder="Times"
                            class="input input-bordered input-sm"
                            value={instantMessageTimes}
                            on:input={(e) =>
                                champSelectStore.updateSetting(
                                    "instantMessageTimes",
                                    parseInt(e.target.value) || 1,
                                )}
                            min="1"
                            max="10"
                        />
                        <input
                            type="number"
                            placeholder="Initial Delay (ms)"
                            class="input input-bordered input-sm"
                            value={instantMessageDelay}
                            on:input={(e) =>
                                champSelectStore.updateSetting(
                                    "instantMessageDelay",
                                    parseInt(e.target.value) || 0,
                                )}
                            min="0"
                        />
                        <input
                            type="number"
                            placeholder="Between (ms)"
                            class="input input-bordered input-sm"
                            value={instantMessageDelayBetween}
                            on:input={(e) =>
                                champSelectStore.updateSetting(
                                    "instantMessageDelayBetween",
                                    parseInt(e.target.value) || 0,
                                )}
                            min="0"
                        />
                    </div>
                {/if}
            </div>
        </Card>

        <!-- Other Features -->
        <Card title="Other Features">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span>Instant Mute All</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-primary"
                        checked={instantMuteEnabled}
                        on:change={(e) =>
                            champSelectStore.updateSetting(
                                "instantMuteEnabled",
                                e.target.checked,
                            )}
                    />
                </div>
                <div class="flex items-center justify-between">
                    <span>Blue/Red Side Notification</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-primary"
                        checked={blueSideNotification}
                        on:change={(e) =>
                            champSelectStore.updateSetting(
                                "blueSideNotification",
                                e.target.checked,
                            )}
                    />
                </div>
                <div class="flex items-center justify-between">
                    <span>Dodge on Ban</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-warning"
                        checked={dodgeOnBan}
                        on:change={(e) =>
                            champSelectStore.updateSetting(
                                "dodgeOnBan",
                                e.target.checked,
                            )}
                    />
                </div>
            </div>
        </Card>
    </div>

    <!-- Instalock Champion -->
    <Card title="Instalock Champion" className="mt-6">
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <span>Instalock Enabled</span>
                <input
                    type="checkbox"
                    class="toggle toggle-success"
                    checked={instalockEnabled}
                    on:change={(e) =>
                        champSelectStore.updateSetting(
                            "instalockEnabled",
                            e.target.checked,
                        )}
                />
            </div>

            {#if instalockEnabled}
                <div class="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search champions..."
                        class="input input-bordered flex-1"
                        bind:value={searchText}
                    />
                    <input
                        type="number"
                        placeholder="Delay (ms)"
                        class="input input-bordered w-32"
                        value={instalockDelay}
                        on:input={(e) =>
                            champSelectStore.updateSetting(
                                "instalockDelay",
                                parseInt(e.target.value) || 0,
                            )}
                        min="0"
                        max="10000"
                    />
                </div>

                {#if selectedChampion}
                    <div class="alert alert-success">
                        Selected: {champions.find(
                            (c) => c.numericalId === selectedChampion,
                        )?.alt}
                    </div>
                {/if}

                <div
                    class="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-base-300 rounded-lg p-2"
                >
                    {#each filteredChampions as champion}
                        <button
                            class="btn btn-ghost btn-sm p-1 aspect-square {selectedChampion ===
                            champion.id
                                ? 'ring-2 ring-success'
                                : ''}"
                            on:click={() =>
                                selectInstalockChampion(champion.id)}
                            title={champion.alt}
                        >
                            <img
                                src={champion.src}
                                alt={champion.alt}
                                class="w-full h-full object-cover rounded"
                            />
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- Auto Ban -->
        <Card title="Auto Ban Champion">
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span>Auto Ban Enabled</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-error"
                        checked={autoBanEnabled}
                        on:change={(e) =>
                            champSelectStore.updateSetting(
                                "autoBanEnabled",
                                e.target.checked,
                            )}
                    />
                </div>

                {#if autoBanEnabled}
                    <div class="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search champions..."
                            class="input input-bordered flex-1"
                            bind:value={searchBanText}
                        />
                        <input
                            type="number"
                            placeholder="Delay (ms)"
                            class="input input-bordered w-32"
                            value={autoBanDelay}
                            on:input={(e) =>
                                champSelectStore.updateSetting(
                                    "autoBanDelay",
                                    parseInt(e.target.value) || 0,
                                )}
                            min="0"
                            max="10000"
                        />
                    </div>

                    {#if selectedBanChampion}
                        <div class="alert alert-error">
                            Will ban: {champions.find(
                                (c) => c.numericalId === selectedBanChampion,
                            )?.alt}
                        </div>
                    {/if}

                    <div
                        class="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-base-300 rounded-lg p-2"
                    >
                        {#each filteredBanChampions as champion}
                            <button
                                class="btn btn-ghost btn-sm p-1 aspect-square"
                                class:ring-2={selectedBanChampion ===
                                    champion.id}
                                class:ring-error={selectedBanChampion ===
                                    champion.id}
                                on:click={() => selectBanChampion(champion.id)}
                                title={champion.alt}
                            >
                                <img
                                    src={champion.src}
                                    alt={champion.alt}
                                    class="w-full h-full object-cover rounded"
                                />
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </Card>

        <!-- Backup Pick -->
        <Card title="Backup Pick Champion">
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span>Backup Pick Enabled</span>
                    <input
                        type="checkbox"
                        class="toggle toggle-warning"
                        checked={backupPickEnabled}
                        on:change={(e) =>
                            champSelectStore.updateSetting(
                                "backupPickEnabled",
                                e.target.checked,
                            )}
                    />
                </div>

                {#if backupPickEnabled}
                    <div class="alert alert-info">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="stroke-current shrink-0 w-6 h-6"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path></svg
                        >
                        <span
                            >Backup pick will be used if your main champion is
                            banned or picked</span
                        >
                    </div>

                    <input
                        type="text"
                        placeholder="Search champions..."
                        class="input input-bordered w-full"
                        bind:value={searchBackupText}
                    />

                    {#if selectedBackupChampion}
                        <div class="alert alert-warning">
                            Backup: {champions.find(
                                (c) => c.numericalId === selectedBackupChampion,
                            )?.alt}
                        </div>
                    {/if}

                    <div
                        class="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-base-300 rounded-lg p-2"
                    >
                        {#each filteredBackupChampions as champion}
                            <button
                                class="btn btn-ghost btn-sm p-1 aspect-square {selectedBackupChampion ===
                                champion.id
                                    ? 'ring-2 ring-warning'
                                    : ''}"
                                on:click={() => selectBackupPick(champion.id)}
                                title={champion.alt}
                            >
                                <img
                                    src={champion.src}
                                    alt={champion.alt}
                                    class="w-full h-full object-cover rounded"
                                />
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </Card>
    </div>
</div>
