<script lang="ts">
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let lobbyName = "";
    let isLoading = false;

    async function createLobby() {
        isLoading = true;
        const response = await lcuService.createPracticeLobby(lobbyName);
        isLoading = false;

        if (response.success) {
            notifications.success("Practice Tool lobby created successfully!");
            lobbyName = "";
        } else {
            notifications.error(`Failed to create lobby: ${response.message}`);
        }
    }
</script>

<div class="container mx-auto p-8 max-w-3xl">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Practice Tool Lobby</h1>
        <p class="text-base-content/70">
            Quickly create a practice tool lobby with custom settings
        </p>
    </div>

    <Card title="Create Practice Lobby">
        <div class="form-control w-full">
            <label class="label" for="lobby-name">
                <span class="label-text">Lobby Name</span>
            </label>
            <input
                id="lobby-name"
                type="text"
                placeholder="Practice Tool (leave empty for default)"
                class="input input-bordered input-primary w-full"
                bind:value={lobbyName}
                maxlength="50"
                aria-label="Lobby Name"
            />
            <div class="label">
                <span class="label-text-alt"
                    >Optional: Give your lobby a custom name</span
                >
                <span class="label-text-alt">{lobbyName.length}/50</span>
            </div>
        </div>

        <button
            class="btn btn-primary w-full mt-4"
            class:loading={isLoading}
            disabled={isLoading}
            on:click={createLobby}
        >
            {isLoading ? "Creating Lobby..." : "Create Practice Lobby"}
        </button>
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
                • Practice Tool is perfect for learning new champions<br />
                • Use it to practice last hitting and combos<br />
                • Test different builds and strategies<br />
                • No pressure, just pure practice!
            </div>
        </div>
    </div>

    <div class="flex justify-center mt-8">
        <a href="#/" class="btn btn-ghost">← Back to Home</a>
    </div>
</div>
