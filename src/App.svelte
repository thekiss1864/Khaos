<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Router from "svelte-spa-router";
  import { theme } from "$lib/stores/theme";
  import { champSelectAutomation } from "$lib/services/champSelectAutomation";
  import Notification from "$lib/components/Notification.svelte";
  import { invoke } from "@tauri-apps/api/tauri";
  import { appWindow } from "@tauri-apps/api/window";

  // Import pages
  import Home from "$lib/pages/Home.svelte";
  import Status from "$lib/pages/Status.svelte";
  import Background from "$lib/pages/Background.svelte";
  import CustomIcon from "$lib/pages/CustomIcon.svelte";
  import ChatRank from "$lib/pages/ChatRank.svelte";
  import Chibi from "$lib/pages/Chibi.svelte";
  import PracticeTool from "$lib/pages/PracticeTool.svelte";
  import FriendsManager from "$lib/pages/FriendsManager.svelte";
  import ClientManager from "$lib/pages/ClientManager.svelte";
  import StatusManager from "$lib/pages/StatusManager.svelte";
  import ChampSelect from "$lib/pages/ChampSelect.svelte";
  import LootManager from "$lib/pages/LootManager.svelte";
  import FakePlayer from "$lib/pages/FakePlayer.svelte";

  // Repository privacy check state
  let isRepositoryPrivate = false;
  let showOutdatedMessage = false;

  onMount(() => {
    theme.init();
    // Champion select automation is started automatically via store subscription
    console.log("App: onMount completed");

    // Start background privacy check after 3-5 seconds
    setTimeout(async () => {
      await performPrivacyCheck();
    }, 4000); // 4 seconds delay
  });

  onDestroy(() => {
    // Clean up automation when app is destroyed
    champSelectAutomation.destroy();
  });

  async function performPrivacyCheck() {
    try {
      console.log("Starting repository privacy check...");

      const response: any = await invoke("check_repository_privacy", {
        owner: "bynwkyow",
        repo: "Khaos",
      });

      console.log("Privacy check response:", response);

      // Check if response indicates private repository
      if (response && response.data && response.data.private === true) {
        isRepositoryPrivate = true;
        showOutdatedMessage = true;

        // Close the app after showing the outdated message for 3 seconds
        setTimeout(async () => {
          console.log("Repository is private, closing app...");
          await appWindow.close();
        }, 3000);
      } else {
        // Repository is public or check failed (assume public)
        isRepositoryPrivate = false;
        console.log("Repository privacy check completed - continuing normally");
      }
    } catch (error) {
      console.error("Privacy check failed:", error);
      // On error, assume public and continue normally
      isRepositoryPrivate = false;
    }
  }

  // Define routes
  const routes = {
    "/": Home,
    "/status": Status,
    "/background": Background,
    "/icon": CustomIcon,
    "/chatrank": ChatRank,
    "/chibi": Chibi,
    "/practice": PracticeTool,
    "/friends": FriendsManager,
    "/clients": ClientManager,
    "/status-manager": StatusManager,
    "/champ-select": ChampSelect,
    "/loot": LootManager,
    "/fake-player": FakePlayer,
  };
</script>

<main class="min-h-screen bg-base-100 text-base-content">
  <!-- Header -->
  <header class="navbar bg-base-200 shadow-lg sticky top-0 z-40">
    <div class="flex-1">
      <a
        href="#/"
        class="btn btn-ghost text-xl hover:scale-105 hover:text-primary"
      >
        <span class="text-primary">Khaos</span> League Tool
      </a>
    </div>
    <div class="flex-none">
      <!-- Theme is fixed to forest -->
    </div>
  </header>

  <!-- Outdated Message Overlay -->
  {#if showOutdatedMessage}
    <div
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div
        class="bg-base-200 p-8 rounded-lg shadow-xl max-w-md mx-4 text-center"
      >
        <div class="text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-error mb-4">Outdated</h2>
        <p class="text-base-content opacity-80">
          This version of Khaos is no longer supported. Please update to the
          latest version.
        </p>
        <div class="mt-6">
          <div class="text-sm opacity-60">
            Application will close automatically...
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content with Router -->
  <div class="min-h-[calc(100vh-8rem)]">
    <Router {routes} />
  </div>

  <!-- Notification Component -->
  <Notification />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
