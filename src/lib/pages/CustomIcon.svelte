<script lang="ts">
    import { onMount } from "svelte";
    import { lcuService } from "$lib/services/lcuService";
    import { riotApi } from "$lib/services/riotApi";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let icons: Array<{
        id: number;
        url: string;
        title: string;
        keywords: string[];
    }> = [];
    let isLoading = true;
    let searchIconId = "";
    let customIconId = "";
    let selectedIcon: number | null = null;
    let isSettingInvisibleBorder = false;
    let isSettingInvisibleBanner = false;

    // Available local summoner icons
    // const localIcons = [
    //     29, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
    //     67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
    // ];

    onMount(async () => {
        try {
            // Generate icon IDs (popular ranges)
            const iconIds = [];

            // Starter icons (0-50)
            for (let i = 0; i <= 50; i++) {
                iconIds.push(i);
            }

            // Common icon ranges
            for (let i = 500; i <= 600; i++) {
                iconIds.push(i);
            }

            for (let i = 1000; i <= 1100; i++) {
                iconIds.push(i);
            }

            for (let i = 3000; i <= 3100; i++) {
                iconIds.push(i);
            }

            for (let i = 4000; i <= 4100; i++) {
                iconIds.push(i);
            }

            const version = await riotApi.getVersion();
            const summonerIcons = await riotApi.getSummonerIcons();

            icons = iconIds.map((id) => {
                const iconData = summonerIcons.find((icon) => icon.id === id);
                return {
                    id,
                    url: `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${id}.png`,
                    title: iconData?.title || `Icon ${id}`,
                    keywords: iconData?.keywords || [],
                };
            });

            isLoading = false;
        } catch (error) {
            notifications.error("Failed to load icons");
            isLoading = false;
        }
    });

    async function setIcon(iconId: number) {
        const response = await lcuService.setSummonerIcon(iconId);

        if (response.success) {
            notifications.success(`Icon ${iconId} set successfully!`);
            selectedIcon = iconId;
        } else {
            notifications.error(`Failed to set icon: ${response.message}`);
        }
    }

    // function getLocalIconPath(id: number): string {
    //     return `/src/assets/summoner-icons/${id}.png`;
    // }

    async function setCustomIcon() {
        const id = parseInt(customIconId);
        if (isNaN(id) || id < 0) {
            notifications.warning("Please enter a valid icon ID");
            return;
        }

        await setIcon(id);
    }

    async function setInvisibleProfileBorder() {
        isSettingInvisibleBorder = true;
        const response = await lcuService.setInvisibleProfileBorder();
        isSettingInvisibleBorder = false;

        if (response.success) {
            notifications.success("Invisible profile border set successfully!");
        } else {
            notifications.error(
                `Failed to set invisible border: ${response.message}`,
            );
        }
    }

    async function setInvisibleProfileBanner() {
        isSettingInvisibleBanner = true;
        const response = await lcuService.setInvisibleProfileBanner();
        isSettingInvisibleBanner = false;

        if (response.success) {
            notifications.success("Invisible profile banner set successfully!");
        } else {
            notifications.error(
                `Failed to set invisible banner: ${response.message}`,
            );
        }
    }

    function handleImageError(event: Event) {
        const img = event.target as HTMLImageElement;
        img.style.display = "none";
    }

    $: filteredIcons = searchIconId
        ? icons.filter(
              (icon) =>
                  icon.id.toString().includes(searchIconId) ||
                  icon.title
                      .toLowerCase()
                      .includes(searchIconId.toLowerCase()) ||
                  icon.keywords.some((keyword) =>
                      keyword
                          .toLowerCase()
                          .includes(searchIconId.toLowerCase()),
                  ),
          )
        : icons;
</script>

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Summoner Icon</h1>
        <p class="text-base-content/70">
            Set any summoner icon, even ones you don't own
        </p>
    </div>

    <div class="max-w-6xl mx-auto space-y-6">
        <!-- Custom Icon ID Input -->
        <Card title="Set Icon by ID">
            <div class="flex gap-2">
                <input
                    type="number"
                    placeholder="Enter icon ID (e.g., 29)"
                    class="input input-bordered input-primary flex-1"
                    bind:value={customIconId}
                    min="0"
                />
                <button class="btn btn-primary" on:click={setCustomIcon}>
                    Set Icon
                </button>
            </div>
            <p class="text-sm text-base-content/70 mt-2">
                Don't know the icon ID? Browse the gallery below or search for
                it.
            </p>
        </Card>

        <!-- Icon Gallery -->
        <Card title="Icon Gallery">
            <div class="form-control mb-4">
                <input
                    type="text"
                    placeholder="Search by ID or name..."
                    class="input input-bordered input-primary"
                    bind:value={searchIconId}
                />
            </div>

            {#if isLoading}
                <div class="flex justify-center py-12">
                    <span
                        class="loading loading-spinner loading-lg text-primary"
                    />
                </div>
            {:else}
                <div
                    class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 max-h-96 overflow-y-auto p-2"
                >
                    {#each filteredIcons as icon}
                        <button
                            class="group relative overflow-hidden rounded-lg border-2 border-base-300 hover:border-primary transition-all duration-300 hover:scale-105"
                            on:click={() => setIcon(icon.id)}
                            title={icon.title}
                        >
                            <img
                                src={icon.url}
                                alt={icon.title}
                                class="w-full h-auto object-cover"
                                loading="lazy"
                                on:error={handleImageError}
                            />
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                                <div
                                    class="absolute bottom-0 left-0 right-0 p-4"
                                >
                                    <p
                                        class="text-white font-semibold text-center"
                                    >
                                        {icon.id} - {icon.title}
                                    </p>
                                    <p
                                        class="text-white/70 text-sm text-center mt-1"
                                    >
                                        Click to set
                                    </p>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>

                <p class="text-sm text-base-content/70 text-center mt-4">
                    Showing {filteredIcons.length} icons. Some icons may not be available.
                </p>
            {/if}
        </Card>

        <!-- Tips -->
        <div class="alert alert-info shadow-lg">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="stroke-current shrink-0 w-6 h-6"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <div>
                <h3 class="font-bold">Tips</h3>
                <div class="text-xs">
                    • Click any icon to set it immediately<br />
                    • You can use any icon ID, even unreleased ones!<br />
                    • Icon IDs typically range from 0 to 5000+<br />
                    • Some icons may not load if they don't exist
                </div>
            </div>
        </div>

        <!-- Add this section after the existing sections -->
        <Card title="Advanced Profile Customization">
            <div class="space-y-4">
                <div>
                    <h3 class="font-semibold mb-2">Invisible Profile Border</h3>
                    <p class="text-sm text-base-content/70 mb-2">
                        Requires account level 525 or higher. Sets a prestige
                        crest with a blank banner.
                    </p>
                    <button
                        class="btn btn-primary"
                        on:click={setInvisibleProfileBorder}
                        disabled={isSettingInvisibleBorder}
                    >
                        {#if isSettingInvisibleBorder}
                            <span class="loading loading-spinner loading-xs"
                            ></span>
                            Setting...
                        {:else}
                            Set Invisible Border
                        {/if}
                    </button>
                </div>

                <div class="divider"></div>

                <div>
                    <h3 class="font-semibold mb-2">Invisible Profile Banner</h3>
                    <p class="text-sm text-base-content/70 mb-2">
                        Requires last season rank to be unranked. Sets a special
                        banner accent.
                    </p>
                    <button
                        class="btn btn-primary"
                        on:click={setInvisibleProfileBanner}
                        disabled={isSettingInvisibleBanner}
                    >
                        {#if isSettingInvisibleBanner}
                            <span class="loading loading-spinner loading-xs"
                            ></span>
                            Setting...
                        {:else}
                            Set Invisible Banner
                        {/if}
                    </button>
                </div>
            </div>
        </Card>
    </div>

    <div class="flex justify-center mt-8">
        <a href="#/" class="btn btn-ghost">← Back to Home</a>
    </div>
</div>
