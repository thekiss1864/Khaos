<script lang="ts">
  import { onMount } from "svelte";
  import { riotApi } from "$lib/services/riotApi";
  import { lcuService } from "$lib/services/lcuService";
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
  const multiSearchWebsites = [
    { value: "opgg", label: "OP.GG" },
    { value: "ugg", label: "U.GG" },
  ];
  // Older saved settings may point at sites that are no longer supported
  $: multiSearchWebsite = multiSearchWebsites.some(
    (s) => s.value === settings?.multiSearchWebsite,
  )
    ? settings.multiSearchWebsite
    : "opgg";

  function handlePrimaryRoleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    champSelectStore.updateSetting("primaryRole", target.value);
  }

  function handleSecondaryRoleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    champSelectStore.updateSetting("secondaryRole", target.value);
  }

  function handleMultiSearchChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    champSelectStore.updateSetting("multiSearchWebsite", target.value);
  }

  // Handler functions for checkboxes and inputs
  function handleInstantMessageEnabledChange(e: Event) {
    const target = e.target as HTMLInputElement;
    champSelectStore.updateSetting("instantMessageEnabled", target.checked);
  }

  function handleInstantMessageTextChange(e: Event) {
    const target = e.target as HTMLInputElement;
    champSelectStore.updateSetting("instantMessageText", target.value);
  }

  function handleInstantMessageTimesChange(e: Event) {
    const target = e.target as HTMLInputElement;
    champSelectStore.updateSetting(
      "instantMessageTimes",
      parseInt(target.value) || 1
    );
  }

  function handleInstantMessageDelayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    champSelectStore.updateSetting(
      "instantMessageDelay",
      parseInt(target.value) || 0
    );
  }

  function handleInstantMessageDelayBetweenChange(e: Event) {
    const target = e.target as HTMLInputElement;
    champSelectStore.updateSetting(
      "instantMessageDelayBetween",
      parseInt(target.value) || 0
    );
  }

  function handleInstantMuteChange(e: Event) {
    const target = e.target as HTMLInputElement;
    console.log("ChampSelect: handleInstantMuteChange", target.checked);
    champSelectStore.updateSetting("instantMuteEnabled", target.checked);
  }

  function handleBlueSideNotificationChange(e: Event) {
    const target = e.target as HTMLInputElement;
    console.log(
      "ChampSelect: handleBlueSideNotificationChange",
      target.checked
    );
    champSelectStore.updateSetting("blueSideNotification", target.checked);
  }

  function handleDodgeOnBanChange(e: Event) {
    const target = e.target as HTMLInputElement;
    console.log("ChampSelect: handleDodgeOnBanChange", target.checked);
    champSelectStore.updateSetting("dodgeOnBan", target.checked);
  }

  function handleInstalockEnabledChange(e: Event) {
    const target = e.target as HTMLInputElement;
    console.log("ChampSelect: handleInstalockEnabledChange", target.checked);
    champSelectStore.updateSetting("instalockEnabled", target.checked);
  }

  function handleInstalockDelayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    console.log("ChampSelect: handleInstalockDelayChange", value);
    champSelectStore.updateSetting("instalockDelay", value);
  }

  function handleAutoBanEnabledChange(e: Event) {
    const target = e.target as HTMLInputElement;
    console.log("ChampSelect: handleAutoBanEnabledChange", target.checked);
    champSelectStore.updateSetting("autoBanEnabled", target.checked);
  }

  function handleAutoBanDelayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    console.log("ChampSelect: handleAutoBanDelayChange", value);
    champSelectStore.updateSetting("autoBanDelay", value);
  }

  function handleBackupPickEnabledChange(e: Event) {
    const target = e.target as HTMLInputElement;
    console.log("ChampSelect: handleBackupPickEnabledChange", target.checked);
    champSelectStore.updateSetting("backupPickEnabled", target.checked);
  }

  onMount(async () => {
    try {
      champions = await riotApi.getChampionIcons();
      isLoadingChampions = false;
    } catch (error) {
      notifications.error("Failed to load champions");
      isLoadingChampions = false;
    }
  });

  function toggleAutoAccept() {
    console.log(
      "ChampSelect: toggleAutoAccept called, current value:",
      autoAcceptEnabled
    );
    const newValue = !autoAcceptEnabled;
    console.log("ChampSelect: setting autoAcceptEnabled to:", newValue);
    champSelectStore.updateSetting("autoAcceptEnabled", newValue);
    notifications.success(
      newValue ? "Auto-accept enabled" : "Auto-accept disabled"
    );
  }

  async function selectInstalockChampion(championId: string) {
    const champion = champions.find((c) => c.id === championId);
    console.log(
      "ChampSelect: selectInstalockChampion",
      championId,
      champion?.numericalId
    );
    champSelectStore.updateSetting(
      "selectedChampion",
      champion?.numericalId ?? null
    );
    notifications.success(`Instalock champion set to ${champion?.alt}`);
  }

  async function selectBanChampion(championId: string) {
    const champion = champions.find((c) => c.id === championId);
    console.log(
      "ChampSelect: selectBanChampion",
      championId,
      champion?.numericalId
    );
    champSelectStore.updateSetting(
      "selectedBanChampion",
      champion?.numericalId ?? null
    );
    notifications.success(`Auto-ban champion set to ${champion?.alt}`);
  }

  async function selectBackupPick(championId: string) {
    const champion = champions.find((c) => c.id === championId);
    console.log(
      "ChampSelect: selectBackupPick",
      championId,
      champion?.numericalId
    );
    champSelectStore.updateSetting(
      "selectedBackupChampion",
      champion?.numericalId ?? null
    );
    notifications.success(`Backup pick set to ${champion?.alt}`);
  }

  async function startQueue() {
    try {
      const response = await lcuService.startQueue();
      if (response.success) {
        notifications.success("Started queue!");
      } else {
        notifications.error(`Failed to start queue: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error starting queue: ${error}`);
    }
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

  async function importRunes() {
    try {
      const response = await lcuService.autoImportRunes();
      if (response.success) {
        notifications.success(response.message);
      } else {
        notifications.error(`Failed to import runes: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error importing runes: ${error}`);
    }
  }

  async function multiSearch() {
    try {
      const response = await lcuService.multiSearch(multiSearchWebsite);
      if (response.success) {
        notifications.success(response.message);
      } else {
        notifications.error(`Failed to open multi-search: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error opening multi-search: ${error}`);
    }
  }

  async function setRoles() {
    try {
      const response = await lcuService.setRoles(primaryRole, secondaryRole);
      if (response.success) {
        notifications.success(`Set roles: ${primaryRole} / ${secondaryRole}`);
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
        champSelectStore.updateSetting("currentSide", response.data.side);
        notifications.success(`You are on ${response.data.side} side!`);
      } else {
        notifications.error(`Failed to check side: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error checking side: ${error}`);
    }
  }

  $: filteredChampions = champions.filter((champ) =>
    champ.alt.toLowerCase().includes(searchText.toLowerCase())
  );

  $: filteredBanChampions = champions.filter((champ) =>
    champ.alt.toLowerCase().includes(searchBanText.toLowerCase())
  );

  $: filteredBackupChampions = champions.filter((champ) =>
    champ.alt.toLowerCase().includes(searchBackupText.toLowerCase())
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
    <button class="btn btn-primary" on:click={startQueue}> Start Queue </button>
    <button class="btn btn-warning" on:click={dodgeLobby}> Dodge Lobby </button>
    <button class="btn btn-info" on:click={importRunes}>
      Import Recommended Runes
    </button>
    <button class="btn btn-accent" on:click={checkSide}> Check Side </button>
  </div>

  {#if currentSide}
    <div
      class="alert {currentSide === 'Blue' ? 'alert-info' : 'alert-error'} mb-6"
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
        on:change={handlePrimaryRoleChange}
      >
        <option disabled>Primary Role</option>
        {#each roles as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
      <select
        class="select select-bordered"
        value={secondaryRole}
        on:change={handleSecondaryRoleChange}
      >
        <option disabled>Secondary Role</option>
        {#each roles as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
      <button class="btn btn-primary" on:click={setRoles}>Set Roles</button>
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
          on:change={handleMultiSearchChange}
        >
          {#each multiSearchWebsites as site}
            <option value={site.value}>{site.label}</option>
          {/each}
        </select>
        <button class="btn btn-primary" on:click={multiSearch}> Search </button>
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
            on:change={handleInstantMessageEnabledChange}
          />
        </div>
        {#if instantMessageEnabled}
          <input
            type="text"
            placeholder="Message to send..."
            class="input input-bordered w-full"
            value={instantMessageText}
            on:input={handleInstantMessageTextChange}
          />
          <div class="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Times"
              class="input input-bordered input-sm"
              value={instantMessageTimes}
              on:input={handleInstantMessageTimesChange}
              min="1"
              max="10"
            />
            <input
              type="number"
              placeholder="Initial Delay (ms)"
              class="input input-bordered input-sm"
              value={instantMessageDelay}
              on:input={handleInstantMessageDelayChange}
              min="0"
            />
            <input
              type="number"
              placeholder="Between (ms)"
              class="input input-bordered input-sm"
              value={instantMessageDelayBetween}
              on:input={handleInstantMessageDelayBetweenChange}
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
            on:change={handleInstantMuteChange}
          />
        </div>
        <div class="flex items-center justify-between">
          <span>Blue/Red Side Notification</span>
          <input
            type="checkbox"
            class="toggle toggle-primary"
            checked={blueSideNotification}
            on:change={handleBlueSideNotificationChange}
          />
        </div>
        <div class="flex items-center justify-between">
          <span>Dodge on Ban</span>
          <input
            type="checkbox"
            class="toggle toggle-warning"
            checked={dodgeOnBan}
            on:change={handleDodgeOnBanChange}
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
          on:change={handleInstalockEnabledChange}
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
            on:input={handleInstalockDelayChange}
            min="0"
            max="10000"
          />
        </div>

        {#if selectedChampion}
          <div class="alert alert-success">
            Selected: {champions.find((c) => c.numericalId === selectedChampion)
              ?.alt}
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
              on:click={() => selectInstalockChampion(champion.id)}
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
            on:change={handleAutoBanEnabledChange}
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
              on:input={handleAutoBanDelayChange}
              min="0"
              max="10000"
            />
          </div>

          {#if selectedBanChampion}
            <div class="alert alert-error">
              Will ban: {champions.find(
                (c) => c.numericalId === selectedBanChampion
              )?.alt}
            </div>
          {/if}

          <div
            class="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-base-300 rounded-lg p-2"
          >
            {#each filteredBanChampions as champion}
              <button
                class="btn btn-ghost btn-sm p-1 aspect-square"
                class:ring-2={selectedBanChampion === champion.id}
                class:ring-error={selectedBanChampion === champion.id}
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
            on:change={handleBackupPickEnabledChange}
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
              >Backup pick will be used if your main champion is banned or
              picked</span
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
                (c) => c.numericalId === selectedBackupChampion
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
