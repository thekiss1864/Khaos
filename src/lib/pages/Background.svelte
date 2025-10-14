<script lang="ts">
    import { onMount } from "svelte";
    import { lcuService } from "$lib/services/lcuService";
    import { riotApi } from "$lib/services/riotApi";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let champions: Array<{ src: string; alt: string; id: string }> = [];
    let skins: Array<{ src: string; alt: string; id: string }> = [];
    let isLoadingChampions = true;
    let isLoadingSkins = false;
    let selectedChampion: string | null = null;
    let searchText = "";

    onMount(async () => {
        try {
            champions = await riotApi.getChampionIcons();
            isLoadingChampions = false;
        } catch (error) {
            notifications.error("Failed to load champions");
            isLoadingChampions = false;
        }
    });

    async function selectChampion(championId: string) {
        selectedChampion = championId;
        isLoadingSkins = true;
        skins = [];

        try {
            skins = await riotApi.getSkinImages(championId);
            isLoadingSkins = false;
        } catch (error) {
            notifications.error(`Failed to load skins for ${championId}`);
            isLoadingSkins = false;
        }
    }

    async function setBackground(skinId: string) {
        const id = parseInt(skinId);
        const response = await lcuService.setProfileBackground(id);

        if (response.success) {
            notifications.success("Background updated successfully!");
        } else {
            notifications.error(
                `Failed to update background: ${response.message}`,
            );
        }
    }

    function backToChampions() {
        selectedChampion = null;
        skins = [];
    }

    $: filteredChampions = champions.filter((champ) =>
        champ.alt.toLowerCase().includes(searchText.toLowerCase()),
    );
</script>

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Profile Background</h1>
        <p class="text-base-content/70">
            Change your profile background to any champion skin
        </p>
    </div>

    {#if !selectedChampion}
        <!-- Champion Selection -->
        <div class="max-w-6xl mx-auto">
            <Card title="Select a Champion">
                <div class="form-control mb-4">
                    <input
                        type="text"
                        placeholder="Search champions..."
                        class="input input-bordered input-primary"
                        bind:value={searchText}
                    />
                </div>

                {#if isLoadingChampions}
                    <div class="flex justify-center py-12">
                        <span
                            class="loading loading-spinner loading-lg text-primary"
                        />
                    </div>
                {:else}
                    <div
                        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto"
                    >
                        {#each filteredChampions as champion}
                            <button
                                class="group relative aspect-square overflow-hidden rounded-lg border-2 border-base-300 hover:border-primary transition-all duration-300 hover:scale-110"
                                on:click={() => selectChampion(champion.id)}
                            >
                                <img
                                    src={champion.src}
                                    alt={champion.alt}
                                    class="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div
                                    class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center"
                                >
                                    <span
                                        class="text-white font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-1"
                                    >
                                        {champion.alt}
                                    </span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </Card>
        </div>
    {:else}
        <!-- Skin Selection -->
        <div class="max-w-6xl mx-auto">
            <Card title={`${selectedChampion} Skins`}>
                <button
                    class="btn btn-ghost btn-sm mb-4"
                    on:click={backToChampions}
                >
                    ← Back to Champions
                </button>

                {#if isLoadingSkins}
                    <div class="flex justify-center py-12">
                        <span
                            class="loading loading-spinner loading-lg text-primary"
                        />
                    </div>
                {:else}
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {#each skins as skin}
                            <button
                                class="group relative overflow-hidden rounded-lg border-2 border-base-300 hover:border-primary transition-all duration-300 hover:scale-105"
                                on:click={() => setBackground(skin.id)}
                            >
                                <img
                                    src={skin.src}
                                    alt={skin.alt}
                                    class="w-full h-auto object-cover"
                                    loading="lazy"
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
                                            {skin.alt}
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
                {/if}
            </Card>
        </div>
    {/if}


    <div class="flex justify-center mt-8">
        <a href="#/" class="btn btn-ghost">← Back to Home</a>
    </div>
</div>
