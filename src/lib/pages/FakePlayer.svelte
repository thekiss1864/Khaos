<script lang="ts">
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let isConnected = false;
    let currentStatus = "online";

    async function checkConnection() {
        const response = await lcuService.checkConnection();
        isConnected = response.success;

        if (response.success) {
            // Get current availability status
            const statusResponse = await lcuService.customRequest(
                "GET",
                "/lol-chat/v1/me",
            );
            if (statusResponse.success && statusResponse.data?.availability) {
                currentStatus =
                    statusResponse.data.availability === "chat"
                        ? "online"
                        : statusResponse.data.availability;
            }
        }
    }

    async function setStatus(status: "online" | "away" | "offline" | "mobile") {
        if (!isConnected) {
            notifications.warning("Please connect to League Client first");
            return;
        }

        const response = await lcuService.setAvailabilityStatus(status);
        if (response.success) {
            currentStatus = status;
            notifications.success(`Status set to: ${status}`);
        } else {
            notifications.error(`Failed to set status: ${response.message}`);
        }
    }

    // Auto-check connection on mount
    import { onMount } from "svelte";
    onMount(() => {
        checkConnection();
    });
</script>

<div class="container mx-auto p-8 max-w-4xl">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">Status Control</h1>
        <p class="text-base-content/70">
            Control your online status in League of Legends
        </p>
    </div>

    <!-- Connection Status -->
    <Card title="Connection Status">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <div
                        class="w-3 h-3 rounded-full {isConnected
                            ? 'bg-success'
                            : 'bg-error'}"
                    ></div>
                    <span class="font-medium">
                        {isConnected
                            ? "Connected to League Client"
                            : "Not Connected"}
                    </span>
                </div>
                {#if isConnected}
                    <span class="text-sm text-base-content/60">
                        Current status: <span class="font-semibold capitalize"
                            >{currentStatus}</span
                        >
                    </span>
                {/if}
            </div>
            <button class="btn btn-outline btn-sm" on:click={checkConnection}>
                Refresh
            </button>
        </div>
    </Card>

    <!-- Status Control -->
    {#if isConnected}
        <Card title="Status Control">
            <p class="text-sm text-base-content/70 mb-4">
                Change your appearance status. Your friends will see you as the
                selected status.
            </p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    class="btn btn-success"
                    class:btn-outline={currentStatus !== "online"}
                    on:click={() => setStatus("online")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Online
                </button>
                <button
                    class="btn btn-warning"
                    class:btn-outline={currentStatus !== "away"}
                    on:click={() => setStatus("away")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                    Away
                </button>

                <button
                    class="btn btn-error"
                    class:btn-outline={currentStatus !== "offline"}
                    on:click={() => setStatus("offline")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Offline
                </button>
                <button
                    class="btn btn-info"
                    class:btn-outline={currentStatus !== "mobile"}
                    on:click={() => setStatus("mobile")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                    Mobile
                </button>
            </div>
        </Card>
    {/if}
</div>
