<script lang="ts">
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    const ranks = [
        "IRON",
        "BRONZE",
        "SILVER",
        "GOLD",
        "PLATINUM",
        "DIAMOND",
        "MASTER",
        "GRANDMASTER",
        "CHALLENGER",
    ];

    const divisions = ["I", "II", "III", "IV"];
    const queues = [
        { value: "RANKED_SOLO_5x5", label: "Ranked Solo/Duo" },
        { value: "RANKED_TFT", label: "Ranked TFT" },
    ];

    let selectedQueue = "RANKED_SOLO_5x5";
    let selectedRank = "GOLD";
    let selectedDivision = "IV";
    let isLoading = false;

    async function setChatRank() {
        isLoading = true;
        const response = await lcuService.setChatRank(
            selectedQueue,
            selectedRank,
            selectedDivision,
        );
        isLoading = false;

        if (response.success) {
            notifications.success("Chat rank updated successfully!");
        } else {
            notifications.error(
                `Failed to update chat rank: ${response.message}`,
            );
        }
    }

    function getRankColor(rank: string): string {
        const colors: Record<string, string> = {
            IRON: "text-gray-500",
            BRONZE: "text-orange-700",
            SILVER: "text-gray-400",
            GOLD: "text-yellow-500",
            PLATINUM: "text-cyan-500",
            DIAMOND: "text-blue-500",
            MASTER: "text-purple-500",
            GRANDMASTER: "text-red-500",
            CHALLENGER: "text-amber-400",
        };
        return colors[rank] || "text-base-content";
    }
</script>

<div class="container mx-auto p-8 max-w-3xl">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Chat Rank Display</h1>
        <p class="text-base-content/70">
            Display a custom rank in your chat profile
        </p>
    </div>

    <Card title="Configure Your Chat Rank">
        <div class="space-y-6">
            <!-- Queue Selection -->
            <div class="form-control w-full">
                <label class="label" for="queue-select">
                    <span class="label-text font-semibold">Queue Type</span>
                </label>
                <select
                    id="queue-select"
                    class="select select-bordered select-primary w-full"
                    bind:value={selectedQueue}
                >
                    {#each queues as queue}
                        <option value={queue.value}>{queue.label}</option>
                    {/each}
                </select>
            </div>

            <!-- Rank Selection -->
            <div class="form-control w-full">
                <label class="label" for="rank-select">
                    <span class="label-text font-semibold">Rank</span>
                </label>
                <select
                    id="rank-select"
                    class="select select-bordered select-primary w-full"
                    bind:value={selectedRank}
                >
                    {#each ranks as rank}
                        <option value={rank} class={getRankColor(rank)}
                            >{rank}</option
                        >
                    {/each}
                </select>
            </div>

            <!-- Division Selection -->
            <div class="form-control w-full">
                <label class="label" for="division-select">
                    <span class="label-text font-semibold">Division</span>
                </label>
                <select
                    id="division-select"
                    class="select select-bordered select-primary w-full"
                    bind:value={selectedDivision}
                    disabled={["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
                        selectedRank,
                    )}
                >
                    {#each divisions as division}
                        <option value={division}>{division}</option>
                    {/each}
                </select>
                {#if ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(selectedRank)}
                    <div class="label">
                        <span class="label-text-alt">
                            Master+ ranks don't have divisions
                        </span>
                    </div>
                {/if}
            </div>

            <!-- Preview -->
            <div class="card bg-base-200 shadow-xl">
                <div class="card-body">
                    <h3 class="card-title text-sm">Preview</h3>
                    <div class="text-center py-4">
                        <p
                            class="text-2xl font-bold {getRankColor(
                                selectedRank,
                            )}"
                        >
                            {selectedRank}
                            {#if !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(selectedRank)}
                                {selectedDivision}
                            {/if}
                        </p>
                        <p class="text-sm text-base-content/70 mt-2">
                            {queues.find((q) => q.value === selectedQueue)
                                ?.label}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Apply Button -->
            <button
                class="btn btn-primary w-full"
                class:loading={isLoading}
                disabled={isLoading}
                on:click={setChatRank}
            >
                {isLoading ? "Applying..." : "Apply Chat Rank"}
            </button>
        </div>
    </Card>

    <!-- Tips -->
    <div class="alert alert-info shadow-lg mt-8">
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
                • This changes the rank displayed in your chat profile<br />
                • It doesn't affect your actual game rank or MMR<br />
                • Master, Grandmaster, and Challenger don't have divisions<br />
                • Changes appear immediately in chat
            </div>
        </div>
    </div>

    <div class="flex justify-center mt-8">
        <a href="#/" class="btn btn-ghost">← Back to Home</a>
    </div>
</div>
