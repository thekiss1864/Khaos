<script lang="ts">
  import { onMount } from "svelte";
  import { lcuService } from "$lib/services/lcuService";
  import { notifications } from "$lib/stores/notification";
  import Card from "$lib/components/Card.svelte";

  let isConnected = false;
  let isLoading = false;
  let friends: any[] = [];
  let friendRequests: any[] = [];
  let friendGroups: Map<string, any[]> = new Map();
  let exportedFriends: any = null;
  let importFile: File | null = null;

  // Type-safe event handlers
  function handleImageError(e: Event) {
    const img = e.currentTarget as HTMLImageElement;
    const friend = (e as any).friend;
    if (img && friend) {
      img.src = `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${friend.icon || 29}.png`;
    }
  }

  onMount(async () => {
    await checkConnection();
    if (isConnected) {
      await loadData();
    }
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

  async function loadData() {
    if (!isConnected) {
      await checkConnection();
      if (!isConnected) return;
    }

    isLoading = true;
    try {
      // Load friends
      const friendsResponse = await lcuService.getFriends();
      if (friendsResponse.success && friendsResponse.data) {
        friends = friendsResponse.data;

        // Group friends by folder
        friendGroups = new Map();
        friends.forEach((friend) => {
          const groupName = friend.groupName || "General";
          if (!friendGroups.has(groupName)) {
            friendGroups.set(groupName, []);
          }
          friendGroups.get(groupName)?.push(friend);
        });
      }

      // Load friend requests
      const requestsResponse = await lcuService.getFriendRequests();
      if (requestsResponse.success && requestsResponse.data) {
        friendRequests = requestsResponse.data.filter(
          (request: any) => request.direction === "in",
        );
      }
    } catch (error) {
      notifications.error(`Error loading data: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteFriend(friend: any) {
    if (
      confirm(
        `Are you sure you want to delete ${friend.name || friend.gameName}?`,
      )
    ) {
      isLoading = true;
      try {
        const response = await lcuService.deleteFriend(friend.puuid);
        if (response.success) {
          notifications.success(
            `Successfully deleted ${friend.name || friend.gameName}`,
          );
          await loadData();
        } else {
          notifications.error(`Failed to delete friend: ${response.message}`);
        }
      } catch (error) {
        notifications.error(`Error deleting friend: ${error}`);
      } finally {
        isLoading = false;
      }
    }
  }

  async function handleDeleteAllFriends() {
    if (
      confirm(
        `Are you sure you want to delete ALL ${friends.length} friends? This cannot be undone!`,
      )
    ) {
      isLoading = true;
      try {
        const response = await lcuService.deleteAllFriends();
        if (response.success) {
          notifications.success(response.message);
          await loadData();
        } else {
          notifications.error(`Failed to delete friends: ${response.message}`);
        }
      } catch (error) {
        notifications.error(`Error deleting friends: ${error}`);
      } finally {
        isLoading = false;
      }
    }
  }

  async function handleDeleteFriendsByGroup(groupName: string) {
    const groupFriends = friendGroups.get(groupName) || [];
    if (
      confirm(
        `Are you sure you want to delete all ${groupFriends.length} friends in "${groupName}" folder?`,
      )
    ) {
      isLoading = true;
      try {
        let successCount = 0;
        let failCount = 0;

        for (const friend of groupFriends) {
          const response = await lcuService.deleteFriend(friend.puuid);
          if (response.success) {
            successCount++;
          } else {
            failCount++;
          }
          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        notifications.success(
          `Successfully deleted ${successCount} friends from "${groupName}". Failed: ${failCount}`,
        );
        await loadData();
      } catch (error) {
        notifications.error(`Error deleting friends: ${error}`);
      } finally {
        isLoading = false;
      }
    }
  }

  async function handleAcceptAllRequests() {
    if (friendRequests.length === 0) {
      notifications.info("No friend requests to accept");
      return;
    }

    isLoading = true;
    try {
      const response = await lcuService.acceptAllFriendRequests();
      if (response.success) {
        notifications.success(response.message);
        await loadData();
      } else {
        notifications.error(`Failed to accept requests: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error accepting requests: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  async function handleRejectAllRequests() {
    if (friendRequests.length === 0) {
      notifications.info("No friend requests to reject");
      return;
    }

    isLoading = true;
    try {
      const response = await lcuService.rejectAllFriendRequests();
      if (response.success) {
        notifications.success(response.message);
        await loadData();
      } else {
        notifications.error(`Failed to reject requests: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error rejecting requests: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  async function handleInviteAllToLobby() {
    if (friends.length === 0) {
      notifications.info("No friends to invite");
      return;
    }

    isLoading = true;
    try {
      const response = await lcuService.inviteAllFriendsToLobby();
      if (response.success) {
        notifications.success(response.message);
      } else {
        notifications.error(`Failed to invite friends: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error inviting friends: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  async function handleExportFriends() {
    isLoading = true;
    try {
      const response = await lcuService.exportFriendsList();
      if (response.success && response.data) {
        exportedFriends = response.data;

        // Create and download the file
        const dataStr = JSON.stringify(exportedFriends, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

        const exportFileDefaultName = `league_friends_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, "")}.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();

        notifications.success(
          `Successfully exported ${exportedFriends.length} friends`,
        );
      } else {
        notifications.error(`Failed to export friends: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error exporting friends: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      importFile = input.files[0];
    }
  }

  async function handleImportFriends() {
    if (!importFile) {
      notifications.error("Please select a file to import");
      return;
    }

    isLoading = true;
    try {
      const fileContent = await importFile.text();
      const friendsList = JSON.parse(fileContent);

      if (!Array.isArray(friendsList)) {
        notifications.error("Invalid friends list format");
        return;
      }

      const response = await lcuService.importFriends(friendsList);
      if (response.success) {
        notifications.success(response.message);
        await loadData();
      } else {
        notifications.error(`Failed to import friends: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error importing friends: ${error}`);
    } finally {
      isLoading = false;
      importFile = null;
      // Reset file input
      const fileInput = document.getElementById(
        "import-file",
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
  }
</script>

<div class="container mx-auto p-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold mb-4">
      <span class="text-primary">Friends</span> Manager
    </h1>
    <p class="text-lg text-base-content/70">
      Manage your League of Legends friends list
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
    <!-- Quick Actions -->
    <Card title="Quick Actions">
      <div class="space-y-4">
        <button
          class="btn btn-primary w-full"
          disabled={!isConnected || isLoading}
          on:click={handleInviteAllToLobby}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Invite All Friends to Lobby
        </button>

        <button
          class="btn btn-secondary w-full"
          disabled={!isConnected || isLoading || friendRequests.length === 0}
          on:click={handleAcceptAllRequests}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Accept All Friend Requests ({friendRequests.length})
        </button>

        <button
          class="btn btn-accent w-full"
          disabled={!isConnected || isLoading || friendRequests.length === 0}
          on:click={handleRejectAllRequests}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Reject All Friend Requests ({friendRequests.length})
        </button>

        <div class="divider">Danger Zone</div>

        <button
          class="btn btn-error w-full"
          disabled={!isConnected || isLoading || friends.length === 0}
          on:click={handleDeleteAllFriends}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Delete ALL Friends ({friends.length})
        </button>
      </div>
    </Card>

    <!-- Import/Export -->
    <Card title="Import/Export Friends">
      <div class="space-y-4">
        <button
          class="btn btn-info w-full"
          disabled={!isConnected || isLoading || friends.length === 0}
          on:click={handleExportFriends}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Export Friends List
        </button>

        <div class="divider">Import</div>

        <div class="form-control w-full">
          <input
            type="file"
            id="import-file"
            class="file-input file-input-bordered w-full"
            accept=".json"
            on:change={handleFileChange}
            disabled={!isConnected || isLoading}
          />
        </div>

        <button
          class="btn btn-success w-full"
          disabled={!isConnected || isLoading || !importFile}
          on:click={handleImportFriends}
        >
          {#if isLoading}
            <span class="loading loading-spinner"></span>
          {/if}
          Import Friends
        </button>
      </div>
    </Card>
  </div>

  <!-- Friend Groups -->
  {#if isConnected && !isLoading && friendGroups.size > 0}
    <h2 class="text-2xl font-bold mb-4">Friends by Group</h2>

    <div class="grid grid-cols-1 gap-6 mb-8">
      {#each [...friendGroups.entries()] as [groupName, groupFriends]}
        <Card title={`${groupName} (${groupFriends.length})`}>
          <div class="flex justify-end mb-4">
            <button
              class="btn btn-error btn-sm"
              on:click={() => handleDeleteFriendsByGroup(groupName)}
            >
              Delete All in Group
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each groupFriends as friend}
                  <tr>
                    <td>
                      <div class="flex items-center space-x-3">
                        <div class="avatar">
                          <div class="mask mask-squircle w-12 h-12">
                            {#if friend.icon}
                              <img
                                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${friend.icon}.jpg`}
                                alt="Friend Icon"
                                on:error={(e) => {
                                  // Fallback if icon doesn't load
                                  const target = e.currentTarget;
                                  if (target instanceof HTMLImageElement) {
                                    target.src = `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${friend.icon || 29}.png`;
                                  }
                                }}
                              />
                            {:else}
                              <div
                                class="bg-base-300 w-full h-full flex items-center justify-center"
                              >
                                <span class="text-2xl">👤</span>
                              </div>
                            {/if}
                          </div>
                        </div>
                        <div>
                          <div class="font-bold">
                            {friend.name || friend.gameName}
                          </div>
                          {#if friend.gameName && friend.gameTag}
                            <div class="text-sm opacity-70">
                              {friend.gameName}#{friend.gameTag}
                            </div>
                          {/if}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        class={`badge ${friend.availability === "online" ? "badge-success" : friend.availability === "away" ? "badge-warning" : "badge-neutral"}`}
                      >
                        {friend.availability || "offline"}
                      </span>
                    </td>
                    <td>
                      <button
                        class="btn btn-error btn-xs"
                        on:click={() => handleDeleteFriend(friend)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </Card>
      {/each}
    </div>
  {/if}

  <!-- Friend Requests -->
  {#if isConnected && !isLoading && friendRequests.length > 0}
    <Card title={`Friend Requests (${friendRequests.length})`}>
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each friendRequests as request}
              <tr>
                <td>
                  <div class="font-bold">{request.name}</div>
                </td>
                <td class="flex space-x-2">
                  <button
                    class="btn btn-success btn-xs"
                    on:click={async () => {
                      const response = await lcuService.customRequest(
                        "PUT",
                        `/lol-chat/v1/friend-requests/${request.id}/accept`,
                      );
                      if (response.success) {
                        notifications.success(
                          `Accepted request from ${request.name}`,
                        );
                        await loadData();
                      } else {
                        notifications.error(
                          `Failed to accept request: ${response.message}`,
                        );
                      }
                    }}
                  >
                    Accept
                  </button>
                  <button
                    class="btn btn-error btn-xs"
                    on:click={async () => {
                      const response = await lcuService.customRequest(
                        "DELETE",
                        `/lol-chat/v1/friend-requests/${request.id}`,
                      );
                      if (response.success) {
                        notifications.success(
                          `Rejected request from ${request.name}`,
                        );
                        await loadData();
                      } else {
                        notifications.error(
                          `Failed to reject request: ${response.message}`,
                        );
                      }
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  {/if}

  {#if isConnected && isLoading}
    <div class="flex justify-center my-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {/if}

  {#if isConnected && !isLoading && friends.length === 0}
    <div class="alert alert-info shadow-lg">
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
        <h3 class="font-bold">No Friends Found</h3>
        <div class="text-xs">
          You don't have any friends in your League client
        </div>
      </div>
    </div>
  {/if}

</div>
