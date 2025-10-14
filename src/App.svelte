<script lang="ts">
  import { onMount } from "svelte";
  import Router from "svelte-spa-router";
  import { theme } from "$lib/stores/theme";
  import ThemeSwitcher from "$lib/components/ThemeSwitcher.svelte";
  import Notification from "$lib/components/Notification.svelte";

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

  onMount(() => {
    theme.init();
  });

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
      <ThemeSwitcher />
    </div>
  </header>

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
