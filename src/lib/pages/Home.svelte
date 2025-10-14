<script lang="ts">
    import { onMount } from "svelte";
    import { lcuService } from "$lib/services/lcuService";
    import { notifications } from "$lib/stores/notification";
    import Card from "$lib/components/Card.svelte";
    import khaosLogo from "/src/assets/khaosLogo.png";

    let isConnected = false;
    let connectionStatus = "Checking...";
    let appVersion = "2.0.0";
    let summonerInfo: any = null;

    function handleIconError(event: Event) {
        const img = event.currentTarget as HTMLImageElement;
        if (summonerInfo?.profileIconId) {
            img.src = `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summonerInfo.profileIconId}.png`;
        }
    }

    async function checkConnection() {
        connectionStatus = "Checking...";
        const response = await lcuService.checkConnection();

        if (response.success) {
            isConnected = true;
            connectionStatus = "Connected";
            summonerInfo = response.data;
            notifications.success("Successfully connected to League Client!");
        } else {
            isConnected = false;
            connectionStatus = "Not Connected";
            notifications.error(
                "Could not connect to League Client. Make sure it's running.",
            );
        }
    }

    onMount(() => {
        checkConnection();
    });
</script>

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1
            class="text-5xl font-bold mb-4 flex items-center justify-center gap-4"
        >
            <img src={khaosLogo} alt="KHAOS Logo" class="h-16 w-auto" />
            <span>League Profile Tool</span>
        </h1>
        <p class="text-lg text-base-content/70">
            Customize your League of Legends profile with ease
        </p>
    </div>

    <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
    >
        <!-- Version Info -->
        <Card title="Application Info">
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Version:</span>
                    <span>{appVersion}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Status:</span>
                    <span class={isConnected ? "text-success" : "text-error"}>
                        {connectionStatus}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Creator:</span>
                    <span>bynwkyow</span>
                </div>
            </div>
            <button
                class="btn btn-primary btn-sm mt-4 w-full"
                on:click={checkConnection}
            >
                Refresh Connection
            </button>
        </Card>

        <!-- Summoner Info -->
        {#if isConnected && summonerInfo}
            <Card title="Summoner Info">
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="font-semibold">Name:</span>
                        <span
                            >{summonerInfo.gameName && summonerInfo.tagLine
                                ? `${summonerInfo.gameName} #${summonerInfo.tagLine}`
                                : summonerInfo.displayName ||
                                  summonerInfo.summonerName ||
                                  "Unknown Summoner"}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="font-semibold">Level:</span>
                        <span>{summonerInfo.summonerLevel || "N/A"}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-semibold">ID:</span>
                        <span class="text-xs"
                            >{summonerInfo.summonerId || "N/A"}</span
                        >
                    </div>
                </div>
            </Card>
        {/if}

        <!-- Summoner Icon Display -->
        {#if isConnected && summonerInfo}
            <Card title="Your Summoner Icon">
                <div class="flex flex-col items-center space-y-4">
                    <div class="relative group">
                        <div
                            class="w-24 h-24 rounded-full overflow-hidden shadow-xl ring-4 ring-primary/20 group-hover:ring-primary/50"
                        >
                            {#if summonerInfo.profileIconId}
                                <img
                                    src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summonerInfo.profileIconId}.jpg`}
                                    alt="Summoner Icon"
                                    class="w-full h-full object-cover"
                                    on:error={handleIconError}
                                />
                            {:else}
                                <div
                                    class="w-full h-full bg-base-300 flex items-center justify-center"
                                >
                                    <span class="text-4xl">🖼️</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                    <a
                        href="#/icon"
                        class="btn btn-primary btn-sm w-full group-hover:scale-105"
                    >
                        Change Icon
                    </a>
                </div>
            </Card>
        {/if}
    </div>

    <!-- Feature Grid -->
    <div class="mt-12">
        <h2 class="text-3xl font-bold text-center mb-8">Features</h2>
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
            <a
                href="#/status-manager"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-primary">Status Manager</h3>
                    <p>
                        Set your status (Online, Mobile, Away, Offline) and
                        custom message
                    </p>
                </div>
            </a>

            <a
                href="#/background"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-secondary">
                        Profile Background
                    </h3>
                    <p>Change your profile background to any champion skin</p>
                </div>
            </a>

            <a
                href="#/icon"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-accent">Summoner Icon</h3>
                    <p>Set any summoner icon, even ones you don't own</p>
                </div>
            </a>

            <a
                href="#/chatrank"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-info">Chat Rank</h3>
                    <p>Display a custom rank in your chat profile</p>
                </div>
            </a>

            <a
                href="#/chibi"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-warning">Chibi Icon</h3>
                    <p>Set your chibi icon</p>
                </div>
            </a>

            <a
                href="#/practice"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-success">Practice Tool</h3>
                    <p>Quickly create a practice tool lobby</p>
                </div>
            </a>

            <a
                href="#/friends"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-info">Friends Manager</h3>
                    <p>Manage your friends list and requests</p>
                </div>
            </a>

            <a
                href="#/clients"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-purple-500">Client Manager</h3>
                    <p>Launch multiple League clients</p>
                </div>
            </a>

            <a
                href="#/champ-select"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-error">Champion Select</h3>
                    <p>
                        Auto-accept, instalock, auto-ban, instant message & more
                    </p>
                </div>
            </a>

            <a
                href="#/loot"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            >
                <div class="card-body">
                    <h3 class="card-title text-warning">Loot Manager</h3>
                    <p>Mass disenchant loot & customize minimap scale</p>
                </div>
            </a>

            <a
                href="#/tokens"
                class="card bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                on:click={async () => {
                    if (!isConnected) {
                        notifications.error(
                            "Please connect to League Client first",
                        );
                        return;
                    }

                    try {
                        const response = await lcuService.removeAllTokens();
                        if (response.success) {
                            notifications.success(
                                "Successfully removed all tokens!",
                            );
                        } else {
                            notifications.error(
                                `Failed to remove tokens: ${response.message}`,
                            );
                        }
                    } catch (error) {
                        notifications.error(`Error removing tokens: ${error}`);
                    }
                }}
            >
                <div class="card-body">
                    <h3 class="card-title text-purple-500">Remove Tokens</h3>
                    <p>Remove all tokens from your challenges</p>
                </div>
            </a>
            <button
                class="card bg-base-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                on:click={async () => {
                    if (!isConnected) {
                        notifications.error(
                            "Please connect to League Client first",
                        );
                        return;
                    }

                    try {
                        const response = await lcuService.appearOffline();
                        if (response.success) {
                            notifications.success(
                                "Successfully set status to offline!",
                            );
                        } else {
                            notifications.error(
                                `Failed to set offline status: ${response.message}`,
                            );
                        }
                    } catch (error) {
                        notifications.error(
                            `Error setting offline status: ${error}`,
                        );
                    }
                }}
            >
                <div class="card-body">
                    <h3 class="card-title text-gray-500">Appear Offline</h3>
                    <p>Hide your online status from friends</p>
                </div>
            </button>
        </div>
    </div>
</div>
