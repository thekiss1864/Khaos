<script lang="ts">
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let iconId = "";
    let isLoading = false;
    let selectedIcon: number | null = null;

    async function setChibiIcon() {
        const id = parseInt(iconId);
        if (isNaN(id) || id < 0) {
            notifications.warning("Please enter a valid icon ID");
            return;
        }

        isLoading = true;
        const response = await lcuService.setChibiIcon(id);
        isLoading = false;

        if (response.success) {
            notifications.success(`Chibi icon ${id} set successfully!`);
            selectedIcon = id;
            iconId = "";
        } else {
            notifications.error(
                `Failed to set chibi icon: ${response.message}`,
            );
        }
    }

    // Available summoner icons that can be used as chibis
    const availableIcons = [
        29, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
        67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
    ];

    async function setQuickChibi(id: number) {
        iconId = id.toString();
        await setChibiIcon();
    }

    function getIconPath(id: number): string {
        return `/assets/summoner-icons/${id}.png`;
    }
</script>

<div class="container mx-auto p-8 max-w-6xl">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Chibi Icon</h1>
        <p class="text-base-content/70">Set your chibi icon</p>
    </div>

    <Card title="Set Chibi Icon">
        <div class="form-control w-full">
            <label class="label" for="chibi-input">
                <span class="label-text">Profile Icon ID</span>
            </label>
            <div class="flex gap-2">
                <input
                    id="chibi-input"
                    type="number"
                    placeholder="Enter icon ID (e.g., 29)"
                    class="input input-bordered input-primary flex-1"
                    bind:value={iconId}
                    min="0"
                />
                <button
                    class="btn btn-primary"
                    class:loading={isLoading}
                    disabled={isLoading || !iconId}
                    on:click={setChibiIcon}
                >
                    {isLoading ? "Setting..." : "Set Chibi"}
                </button>
            </div>
            <div class="label">
                <span class="label-text-alt">
                    Use the same IDs as summoner icons
                </span>
            </div>
        </div>
    </Card>

    <!-- Visual Icon Selector -->
    <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Available Chibi Icons</h2>
        <div
            class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4"
        >
            {#each availableIcons as iconNum}
                <button
                    class="group relative overflow-hidden rounded-lg border-2 border-base-300 hover:border-primary transition-all duration-300 hover:scale-105"
                    on:click={() => setQuickChibi(iconNum)}
                    disabled={isLoading}
                    title="Icon {iconNum}"
                >
                    <img
                        src={getIconPath(iconNum)}
                        alt="Icon {iconNum}"
                        class="w-full h-auto object-cover"
                        loading="lazy"
                    />
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                        <div class="absolute bottom-0 left-0 right-0 p-4">
                            <p class="text-white font-semibold text-center">
                                {iconNum}
                            </p>
                            <p class="text-white/70 text-sm text-center mt-1">
                                Click to set
                            </p>
                        </div>
                    </div>
                    {#if selectedIcon === iconNum}
                        <div
                            class="absolute top-1 right-1 bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
                        >
                            ✓
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    </div>

    <div class="flex justify-center mt-8">
        <a href="#/" class="btn btn-ghost">← Back to Home</a>
    </div>
</div>
