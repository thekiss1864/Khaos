<script lang="ts">
  import { onMount } from "svelte";
  import { lcuService } from "$lib/services/lcuService";
  import { notifications } from "$lib/stores/notification";
  import Card from "$lib/components/Card.svelte";

  let isConnected = false;
  let isLoading = false;
  let currentStatus = "online";
  let statusMessage = "";

  // Chat connection flags
  let disconnectingChat = false;
  let reconnectingChat = false;

  // Challenge customization
  let activeTab = "badges";
  let challengePointsText = "";
  let settingChallengePoints = false;
  let settingChallengeBadges = false;

  // Challenge rank
  let rankTiers = [
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
  ];
  let selectedRankTier = "";
  let settingChallengeRank = false;

  // Mastery level
  let masteryLevel = 0;
  let settingMasteryLevel = false;

  // Status options
  const statusOptions = [
    { value: "online", label: "Online", color: "success" },
    { value: "mobile", label: "Mobile", color: "info" },
    { value: "away", label: "Away", color: "warning" },
    { value: "offline", label: "Offline", color: "neutral" },
  ];

  onMount(async () => {
    await checkConnection();
    if (isConnected) {
      await getCurrentStatus();
    }
  });

  async function checkConnection() {
    const response = await lcuService.checkConnection();
    isConnected = response.success;

    if (response.success) {
      // summonerInfo = response.data; // This line is removed
    } else {
      notifications.error(
        "Could not connect to League Client. Make sure it's running."
      );
    }

    return isConnected;
  }

  async function getCurrentStatus() {
    isLoading = true;
    try {
      const response = await lcuService.customRequest("GET", "/lol-chat/v1/me");
      if (response.success && response.data) {
        currentStatus = response.data.availability || "online";
        statusMessage = response.data.statusMessage || "";

        // Get challenge points if available
        if (response.data.lol && response.data.lol.challengePoints) {
          challengePointsText = response.data.lol.challengePoints;
        }
      }
    } catch (error) {
      notifications.error(`Error getting current status: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  async function setStatus(status: string) {
    if (status === currentStatus) return;

    isLoading = true;
    try {
      const response = await lcuService.setAvailabilityStatus(status as any);
      if (response.success) {
        currentStatus = status;
        notifications.success(`Status set to ${status}`);
      } else {
        notifications.error(`Failed to set status: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error setting status: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  async function updateStatusMessage() {
    isLoading = true;
    try {
      const response = await lcuService.setStatusMessage(statusMessage);
      if (response.success) {
        notifications.success("Status message updated successfully");
      } else {
        notifications.error(
          `Failed to update status message: ${response.message}`
        );
      }
    } catch (error) {
      notifications.error(`Error updating status message: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  // Chat connection handlers
  async function handleDisconnectChat() {
    isLoading = true;
    disconnectingChat = true;
    try {
      const response = await lcuService.disconnectChat();
      if (response.success) {
        notifications.success("Disconnected from chat successfully");
      } else {
        notifications.error(
          `Failed to disconnect from chat: ${response.message}`
        );
      }
    } catch (error) {
      notifications.error(`Error disconnecting from chat: ${error}`);
    } finally {
      isLoading = false;
      disconnectingChat = false;
    }
  }

  async function handleReconnectChat() {
    isLoading = true;
    reconnectingChat = true;
    try {
      const response = await lcuService.reconnectChat();
      if (response.success) {
        notifications.success("Reconnected to chat successfully");
      } else {
        notifications.error(`Failed to reconnect to chat: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error reconnecting to chat: ${error}`);
    } finally {
      isLoading = false;
      reconnectingChat = false;
    }
  }

  // Challenge badges handler
  async function handleSetChallengeBadges(badgeType: number) {
    isLoading = true;
    settingChallengeBadges = true;
    try {
      const response = await lcuService.setChallengeBadges(badgeType);
      if (response.success) {
        let message = "";
        if (badgeType === -1) {
          message = "Challenge badges cleared successfully";
        } else if (badgeType === -2) {
          message = "First badge copied to all positions successfully";
        } else {
          message = `Glitched badge ${badgeType} set successfully`;
        }
        notifications.success(message);
      } else {
        notifications.error(
          `Failed to set challenge badges: ${response.message}`
        );
        console.error(`Failed to set challenge badges: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error setting challenge badges: ${error}`);
    } finally {
      isLoading = false;
      settingChallengeBadges = false;
    }
  }

  // Challenge points handler
  async function handleSetChallengePoints() {
    isLoading = true;
    settingChallengePoints = true;
    try {
      const response = await lcuService.setChallengePoints(challengePointsText);
      if (response.success) {
        notifications.success("Challenge points text set successfully");
      } else {
        notifications.error(
          `Failed to set challenge points text: ${response.message}`
        );
      }
    } catch (error) {
      notifications.error(`Error setting challenge points text: ${error}`);
    } finally {
      isLoading = false;
      settingChallengePoints = false;
    }
  }

  // Challenge rank handler
  async function handleSetChallengeRank() {
    if (!selectedRankTier) return;

    isLoading = true;
    settingChallengeRank = true;
    try {
      const response = await lcuService.setChallengeRank(selectedRankTier);
      if (response.success) {
        notifications.success(
          `Challenge rank set to ${selectedRankTier} successfully`
        );
      } else {
        notifications.error(
          `Failed to set challenge rank: ${response.message}`
        );
      }
    } catch (error) {
      notifications.error(`Error setting challenge rank: ${error}`);
    } finally {
      isLoading = false;
      settingChallengeRank = false;
    }
  }

  // Mastery level handler
  async function handleSetMasteryLevel() {
    if (!masteryLevel) return;

    isLoading = true;
    settingMasteryLevel = true;
    try {
      const response = await lcuService.setMasteryLevel(masteryLevel);
      if (response.success) {
        notifications.success(
          `Mastery level set to ${masteryLevel} successfully`
        );
      } else {
        notifications.error(`Failed to set mastery level: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error setting mastery level: ${error}`);
    } finally {
      isLoading = false;
      settingMasteryLevel = false;
    }
  }
</script>

<div class="container mx-auto p-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold mb-4">
      <span class="text-primary">Status</span> Manager
    </h1>
    <p class="text-lg text-base-content/70">
      Manage your online status and status message
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
        <div class="text-xs">League Client is not running or not detected</div>
      </div>
      <button class="btn btn-sm" on:click={checkConnection}>
        Retry Connection
      </button>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <!-- Status Selection -->
    <Card title="Availability Status">
      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          {#each statusOptions as option}
            <button
              class="btn {currentStatus === option.value
                ? 'btn-' + option.color
                : 'btn-outline'} flex-1"
              disabled={!isConnected || isLoading}
              on:click={() => setStatus(option.value)}
            >
              {#if isLoading && currentStatus === option.value}
                <span class="loading loading-spinner"></span>
              {/if}
              {option.label}
            </button>
          {/each}
        </div>

        <div class="divider">Current Status</div>

        <div class="flex items-center justify-center">
          <div class="stats shadow">
            <div class="stat">
              <div class="stat-title">Status</div>
              <div class="stat-value text-lg">
                <span
                  class={`badge badge-${statusOptions.find((o) => o.value === currentStatus)?.color || "neutral"} badge-lg`}
                >
                  {statusOptions.find((o) => o.value === currentStatus)
                    ?.label || "Unknown"}
                </span>
              </div>
              <div class="stat-desc">
                {currentStatus === "offline"
                  ? "You appear offline to friends"
                  : "Visible to friends"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Status Message -->
    <Card title="Status Message">
      <div class="space-y-4">
        <div class="form-control">
          <label class="label" for="status-message-textarea">
            <span class="label-text">Status Message</span>
          </label>
          <textarea
            id="status-message-textarea"
            class="textarea textarea-bordered h-24"
            placeholder="Enter your status message here"
            bind:value={statusMessage}
            disabled={!isConnected || isLoading}
          ></textarea>
        </div>

        <button
          class="btn btn-primary w-full"
          disabled={!isConnected || isLoading}
          on:click={updateStatusMessage}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Update Status Message
        </button>
      </div>
    </Card>
  </div>

  <!-- Chat Connection Controls -->
  <Card title="Chat Connection">
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
          <h3 class="font-bold">Chat Connection</h3>
          <div class="text-xs">
            Disconnect from or reconnect to the League chat service
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-error flex-1"
          disabled={!isConnected || isLoading}
          on:click={handleDisconnectChat}
        >
          {#if isLoading && disconnectingChat}
            <span class="loading loading-spinner"></span>
          {/if}
          Disconnect from Chat
        </button>
        <button
          class="btn btn-success flex-1"
          disabled={!isConnected || isLoading}
          on:click={handleReconnectChat}
        >
          {#if isLoading && reconnectingChat}
            <span class="loading loading-spinner"></span>
          {/if}
          Reconnect to Chat
        </button>
      </div>
    </div>
  </Card>

  <!-- Challenge Customization -->
  <Card title="Challenge Customization">
    <div class="space-y-4">
      <div class="tabs tabs-boxed">
        <button
          class="tab {activeTab === 'badges' ? 'tab-active' : ''}"
          on:click={() => (activeTab = "badges")}
        >
          Challenge Badges
        </button>
        <button
          class="tab {activeTab === 'points' ? 'tab-active' : ''}"
          on:click={() => (activeTab = "points")}
        >
          Challenge Points
        </button>
        <button
          class="tab {activeTab === 'rank' ? 'tab-active' : ''}"
          on:click={() => (activeTab = "rank")}
        >
          Challenge Rank
        </button>
        <button
          class="tab {activeTab === 'mastery' ? 'tab-active' : ''}"
          on:click={() => (activeTab = "mastery")}
        >
          Mastery Level
        </button>
      </div>

      {#if activeTab === "badges"}
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Challenge Badges</h3>
          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-outline flex-1"
              disabled={!isConnected || isLoading}
              on:click={() => handleSetChallengeBadges(-1)}
            >
              Empty
            </button>
            <button
              class="btn btn-outline flex-1"
              disabled={!isConnected || isLoading}
              on:click={() => handleSetChallengeBadges(-2)}
            >
              Copy 1st to All
            </button>
          </div>

          <div>
            <h4 class="text-sm mb-2">Glitched Badges:</h4>
            <div class="flex flex-wrap gap-2">
              {#each Array(6) as _, i}
                <button
                  class="btn btn-sm"
                  disabled={!isConnected || isLoading}
                  on:click={() => handleSetChallengeBadges(i)}
                >
                  {i}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {:else if activeTab === "points"}
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Challenge Points Text</h3>
          <div class="form-control">
            <label class="label" for="challenge-points-input">
              <span class="label-text">Points Text</span>
            </label>
            <input
              id="challenge-points-input"
              type="text"
              class="input input-bordered"
              placeholder="Enter custom challenge points text"
              bind:value={challengePointsText}
              disabled={!isConnected || isLoading}
            />
          </div>
          <button
            class="btn btn-primary w-full"
            disabled={!isConnected || isLoading}
            on:click={handleSetChallengePoints}
          >
            {#if isLoading && settingChallengePoints}
              <span class="loading loading-spinner"></span>
            {/if}
            Set Challenge Points Text
          </button>
        </div>
      {:else if activeTab === "rank"}
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Challenge Rank</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
            {#each rankTiers as tier}
              <button
                class="btn btn-sm {selectedRankTier === tier
                  ? 'btn-primary'
                  : 'btn-outline'}"
                disabled={!isConnected || isLoading}
                on:click={() => (selectedRankTier = tier)}
              >
                {tier}
              </button>
            {/each}
          </div>
          <button
            class="btn btn-primary w-full"
            disabled={!isConnected || isLoading || !selectedRankTier}
            on:click={handleSetChallengeRank}
          >
            {#if isLoading && settingChallengeRank}
              <span class="loading loading-spinner"></span>
            {/if}
            Set Challenge Rank
          </button>
        </div>
      {:else if activeTab === "mastery"}
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Mastery Level</h3>
          <div class="form-control">
            <label class="label" for="mastery-level-input">
              <span class="label-text">Mastery Level</span>
            </label>
            <input
              id="mastery-level-input"
              type="number"
              class="input input-bordered"
              placeholder="Enter mastery level"
              bind:value={masteryLevel}
              min="0"
              max="9999999"
              disabled={!isConnected || isLoading}
            />
          </div>
          <button
            class="btn btn-primary w-full"
            disabled={!isConnected || isLoading || !masteryLevel}
            on:click={handleSetMasteryLevel}
          >
            {#if isLoading && settingMasteryLevel}
              <span class="loading loading-spinner"></span>
            {/if}
            Set Mastery Level
          </button>
        </div>
      {/if}
    </div>
  </Card>
</div>
