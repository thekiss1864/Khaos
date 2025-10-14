<script lang="ts">
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let lootTypes = [
        { value: "CHAMPION_RENTAL", label: "Champion Shards" },
        { value: "CHAMPION", label: "Champion Permanents" },
        { value: "CHAMPION_SKIN_RENTAL", label: "Skin Shards" },
        { value: "CHAMPION_SKIN", label: "Skin Permanents" },
        { value: "STATSTONE_SHARD", label: "Eternals" },
        { value: "WARD_SKIN_RENTAL", label: "Ward Shards" },
        { value: "WARD_SKIN", label: "Ward Permanents" },
        { value: "EMOTE", label: "Emotes" },
        { value: "SUMMONER_ICON", label: "Icons" },
        { value: "COMPANION", label: "Companions" },
    ];

    let selectedLootType = "CHAMPION_RENTAL";
    let isDisenchanting = false;
    let minimapScale = 100;

    async function massDisenchant() {
        if (isDisenchanting) return;

        const confirmed = confirm(
            `Are you sure you want to disenchant all ${lootTypes.find((l) => l.value === selectedLootType)?.label}?`,
        );
        if (!confirmed) return;

        isDisenchanting = true;
        try {
            const response =
                await lcuService.massDisenchantLoot(selectedLootType);
            if (response.success) {
                notifications.success(response.message);
            } else {
                notifications.error(
                    `Failed to disenchant: ${response.message}`,
                );
            }
        } catch (error) {
            notifications.error(`Error disenchanting loot: ${error}`);
        } finally {
            isDisenchanting = false;
        }
    }

    async function updateMinimapScale() {
        try {
            const response = await lcuService.setMinimapScale(minimapScale);
            if (response.success) {
                notifications.success(`Minimap scale set to ${minimapScale}`);
            } else {
                notifications.error(
                    `Failed to set minimap scale: ${response.message}`,
                );
            }
        } catch (error) {
            notifications.error(`Error setting minimap scale: ${error}`);
        }
    }
</script>

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-4 text-primary">
            Loot & Settings Manager
        </h1>
        <p class="text-lg text-base-content/70">
            Mass disenchant loot and customize in-game settings
        </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Mass Disenchant -->
        <Card title="Mass Disenchant Loot">
            <div class="space-y-4">
                <div class="alert alert-warning">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <span
                        >This action cannot be undone! Disenchanted items will
                        be turned into essence/dust.</span
                    >
                </div>

                <select
                    class="select select-bordered w-full"
                    bind:value={selectedLootType}
                    disabled={isDisenchanting}
                >
                    {#each lootTypes as lootType}
                        <option value={lootType.value}>{lootType.label}</option>
                    {/each}
                </select>

                <button
                    class="btn btn-error w-full"
                    on:click={massDisenchant}
                    disabled={isDisenchanting}
                >
                    {#if isDisenchanting}
                        <span class="loading loading-spinner"></span>
                        Disenchanting...
                    {:else}
                        🔥 Disenchant All {lootTypes.find(
                            (l) => l.value === selectedLootType,
                        )?.label}
                    {/if}
                </button>

                <div class="text-sm text-base-content/70">
                    <p><strong>Tips:</strong></p>
                    <ul class="list-disc list-inside space-y-1">
                        <li>Champion shards give Blue Essence</li>
                        <li>Skin shards give Orange Essence</li>
                        <li>Ward shards give Ward Essence</li>
                        <li>Eternals can be disenchanted for OE</li>
                    </ul>
                </div>
            </div>
        </Card>

        <!-- Minimap Scale -->
        <Card title="Minimap Scale">
            <div class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Scale: {minimapScale}%</span>
                        <span class="label-text-alt"
                            >{(minimapScale / 33.33).toFixed(2)}x</span
                        >
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="350"
                        bind:value={minimapScale}
                        class="range range-primary"
                        step="10"
                    />
                    <div class="w-full flex justify-between text-xs px-2 mt-2">
                        <span>0%</span>
                        <span>100%</span>
                        <span>200%</span>
                        <span>350%</span>
                    </div>
                </div>

                <button
                    class="btn btn-primary w-full"
                    on:click={updateMinimapScale}
                >
                    Apply Minimap Scale
                </button>

                <div class="alert alert-info">
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
                        ></path>
                    </svg>
                    <div>
                        <p class="text-sm">Default: 100% (3.0x)</p>
                        <p class="text-sm">
                            Recommended: 150-200% for better visibility
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    </div>

    <!-- Information Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-title">Essence Types</div>
                <div class="stat-value text-lg">BE + OE</div>
                <div class="stat-desc">Blue & Orange Essence</div>
            </div>
        </div>

        <div class="stats shadow">
            <div class="stat">
                <div class="stat-title">Safe to Disenchant</div>
                <div class="stat-value text-lg">Shards</div>
                <div class="stat-desc">Can reroll for permanents</div>
            </div>
        </div>

        <div class="stats shadow">
            <div class="stat">
                <div class="stat-title">Keep Permanents?</div>
                <div class="stat-value text-lg">Yes</div>
                <div class="stat-desc">Unless you need essence</div>
            </div>
        </div>
    </div>
</div>
