<script lang="ts">
    import { onMount } from "svelte";
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";

    let isConnected = false;
    let isLoading = false;
    let clientInstances: any[] = [];
    let launchingClient = false;

    onMount(async () => {
        await checkConnection();
    });

    async function checkConnection() {
        const response = await lcuService.checkConnection();
        isConnected = response.success;

        if (!isConnected) {
            notifications.error(
                "Could not connect to League Client. Make sure it's running.",
            );
        }

        return isConnected;
    }

    async function handleLaunchNewClient() {
        launchingClient = true;
        try {
            const response = await lcuService.launchNewClient();
            if (response.success) {
                notifications.success(
                    "New League client instance launched successfully",
                );
                // Give the client a moment to start up
                setTimeout(async () => {
                    await checkConnection();
                    launchingClient = false;
                }, 5000);
            } else {
                notifications.error(
                    `Failed to launch new client: ${response.message}`,
                );
                launchingClient = false;
            }
        } catch (error) {
            notifications.error(`Error launching client: ${error}`);
            launchingClient = false;
        }
    }
</script>

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-4">
            <span class="text-primary">Client</span> Manager
        </h1>
        <p class="text-lg text-base-content/70">
            Manage multiple League of Legends client instances
        </p>
    </div>

    {#if !isConnected}
        <div class="alert alert-error shadow-lg mb-6">
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
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <div>
                <h3 class="font-bold">Not Connected</h3>
                <div class="text-xs">
                    League Client is not running or not detected
                </div>
            </div>
            <button class="btn btn-sm" on:click={checkConnection}>
                Retry Connection
            </button>
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Client Management -->
        <Card title="Client Management">
            <div class="space-y-4">
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
                        <h3 class="font-bold">Multiple Clients</h3>
                        <div class="text-xs">
                            Launch multiple League clients to login with
                            different accounts simultaneously
                        </div>
                    </div>
                </div>

                <button
                    class="btn btn-primary w-full"
                    disabled={launchingClient}
                    on:click={handleLaunchNewClient}
                >
                    {#if launchingClient}
                        <span class="loading loading-spinner"></span>
                    {/if}
                    Launch New Client Instance
                </button>
            </div>

            <div class="divider">Instructions</div>

            <div class="prose">
                <ul>
                    <li>
                        This feature allows you to run multiple League clients
                        at the same time
                    </li>
                    <li>Each client can be logged into a different account</li>
                    <li>
                        Use this for managing multiple accounts without logging
                        in and out
                    </li>
                    <li>
                        Note: Only one client can be in an active game at a time
                    </li>
                </ul>
            </div>
        </Card>

        <!-- Tips -->
        <Card title="Tips & Information">
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
                    <div>
                        <h3 class="font-bold">Resource Usage</h3>
                        <div class="text-xs">
                            Running multiple clients will use more system
                            resources (RAM, CPU)
                        </div>
                    </div>
                </div>

                <div class="prose">
                    <h3>How it works</h3>
                    <p>
                        The League client normally prevents multiple instances
                        from running. This feature bypasses that restriction by
                        using the <code>--allow-multiple-clients</code>
                        launch parameter.
                    </p>

                    <h3>Common issues</h3>
                    <ul>
                        <li>
                            If a client fails to launch, try restarting Khaos
                        </li>
                        <li>
                            Some antivirus software may block multiple instances
                        </li>
                        <li>
                            Client updates may temporarily break this feature
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
    </div>

    <!--  -->
    <div class="alert alert-warning shadow-lg mt-12">
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
        <div>
            <h3 class="font-bold">Warning</h3>
            <div class="text-xs">
                Use this feature at your own risk. While this is not explicitly
                against Riot's Terms of Service, they may change their policy in
                the future.
            </div>
        </div>
    </div>
</div>
