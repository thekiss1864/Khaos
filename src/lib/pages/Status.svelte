<script lang="ts">
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let statusMessage = "";
    let isLoading = false;

    async function setStatus() {
        if (!statusMessage.trim()) {
            notifications.warning("Please enter a status message");
            return;
        }

        isLoading = true;
        const response = await lcuService.setStatusMessage(statusMessage);
        isLoading = false;

        if (response.success) {
            notifications.success("Status message updated successfully!");
            statusMessage = "";
        } else {
            notifications.error(`Failed to update status: ${response.message}`);
        }
    }
</script>

<div class="container mx-auto p-8 max-w-3xl">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Custom Status Message</h1>
        <p class="text-base-content/70">
            Set a custom status message that appears in your profile
        </p>
    </div>

    <Card title="Set Your Status">
        <div class="form-control w-full">
            <label class="label" for="status-input">
                <span class="label-text">Status Message</span>
                <span class="label-text-alt">{statusMessage.length}/200</span>
            </label>
            <textarea
                id="status-input"
                name="status-input"
                class="textarea textarea-bordered textarea-primary h-24"
                placeholder="Enter your status message..."
                bind:value={statusMessage}
                maxlength="200"
                aria-label="Status Message"
            />
        </div>

        <button
            class="btn btn-primary w-full mt-4"
            class:loading={isLoading}
            disabled={isLoading || !statusMessage.trim()}
            on:click={setStatus}
        >
            {isLoading ? "Setting Status..." : "Set Status"}
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
                • Your status message is visible to friends and in lobbies<br />
                • Emojis are supported! 🎮<br />
                • Keep it appropriate and respectful
            </div>
        </div>
    </div>

    <div class="flex justify-center mt-8">
        <a href="#/" class="btn btn-ghost">← Back to Home</a>
    </div>
</div>
