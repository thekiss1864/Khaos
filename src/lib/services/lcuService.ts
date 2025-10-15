/**
 * LCU Service - Handles communication with the Tauri backend for LCU operations
 */

import { invoke } from "@tauri-apps/api/tauri";

export interface LcuResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ChampMinimal {
  active: boolean;
  alias: string;
  banVoPath?: string;
  baseLoadScreenPath?: string;
  botEnabled: boolean;
  chooseVoPath?: string;
  freeToPlay: boolean;
  id: number;
  name: string;
  freeToPlayReward: boolean;
  owned: number;
  purchased?: string;
  rankedPlayEnabled: boolean;
  roles?: { primary: string; secondary: string };
  squarePortraitPath?: string;
  stingerSfxPath?: string;
  title?: string;
}

export interface ChampMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  formattedChampionPoints: string;
  formattedMasteryGoal: string;
  highestGrade: string;
  lastPlayTime: string;
  playerId: string;
  tokensEarned: number;
}

export interface Skin {
  name: string;
  inventoryType: string;
  itemId: number;
  ownershipType: string;
  isVintage: boolean;
  purchaseDate?: string;
  quantity: number;
  uuid: string;
}

export enum QueueType {
  DraftPick = 400,
  SoloDuo = 420,
  BlindPick = 430,
  Flex = 440,
  ARAM = 450,
  Quickplay = 490,
  Clash = 700,
  IntroBots = 870,
  BeginnerBots = 880,
  IntermediateBots = 890,
  ARURF = 900,
  TFTNormal = 1090,
  TFTRanked = 1100,
  TFTTutorial = 1110,
  TFTHyperRoll = 1130,
  TFTDoubleUp = 1160,
  NexusBlitz = 1300,
  UltimateSpellbook = 1400,
  Tutorial1 = 2000,
  Tutorial2 = 2010,
  Tutorial3 = 2020,
}

class LcuService {
  /**
   * Check if LCU is connected
   */
  async checkConnection(): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("check_lcu_connection");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set custom status message
   */
  async setStatusMessage(message: string): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("set_status_message", { message });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set profile background by skin ID
   */
  async setProfileBackground(skinId: number): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("set_profile_background", { skinId });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set summoner icon
   */
  async setSummonerIcon(iconId: number): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("set_summoner_icon", { iconId });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set chat rank display
   */
  async setChatRank(
    queue: string,
    tier: string,
    division: string
  ): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("set_chat_rank", {
        queue,
        tier,
        division,
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set chibi icon (TFT companion)
   */
  async setChibiIcon(profileIconId: number): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("set_chibi_icon", { profileIconId });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Create practice tool lobby
   */
  async createPracticeLobby(lobbyName: string): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("create_practice_lobby", { lobbyName });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Make a custom LCU API request
   */
  async customRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("custom_lcu_request", {
        method,
        endpoint,
        body,
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set invisible profile border (Prestige Crest)
   * Requires level 525 or higher
   */
  async setInvisibleProfileBorder(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "PUT",
        "/lol-regalia/v2/current-summoner/regalia",
        {
          preferredCrestType: "prestige",
          preferredBannerType: "blank",
          selectedPrestigeCrest: 22,
        }
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set invisible profile banner
   * Requires last season rank to be unranked
   */
  async setInvisibleProfileBanner(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "POST",
        "/lol-challenges/v1/update-player-preferences/",
        {
          bannerAccent: "2",
        }
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Remove all tokens from player challenges
   */
  async removeAllTokens(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "POST",
        "/lol-challenges/v1/update-player-preferences/",
        {
          challengeIds: [-2, -2, -2],
        }
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get player challenge preferences
   */
  async getPlayerChallengePreferences(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "GET",
        "/lol-challenges/v1/summary-player-data/local-player"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set challenge badges
   * @param badgeType -1 for empty, -2 to copy first badge to all, 0-5 for glitched badges
   */
  async setChallengeBadges(badgeType: number): Promise<LcuResponse> {
    try {
      // First get current preferences
      const prefsResponse = await this.getPlayerChallengePreferences();
      if (!prefsResponse.success || !prefsResponse.data) {
        return prefsResponse;
      }

      const data = prefsResponse.data;
      const preferences: any = {
        challengeIds: [],
      };

      // Handle title if it exists and is a valid string
      if (
        data.title &&
        data.title.itemId &&
        typeof data.title.itemId === "string" &&
        data.title.itemId !== "-1"
      ) {
        preferences.title = data.title.itemId;
      }

      // Handle banner if it exists
      if (data.bannerId && typeof data.bannerId === "string") {
        preferences.bannerAccent = data.bannerId;
      }

      // Set challenge badges based on type
      if (badgeType !== -1) {
        for (let i = 0; i < 3; i++) {
          if (
            badgeType === -2 &&
            data.topChallenges &&
            data.topChallenges.length > 0
          ) {
            // Copy first badge to all positions
            const firstBadgeId = data.topChallenges[0].id;
            if (typeof firstBadgeId === "string") {
              preferences.challengeIds.push(firstBadgeId);
            }
          } else if (badgeType >= 0 && badgeType <= 5) {
            // Set glitched badge
            preferences.challengeIds.push(badgeType.toString());
          }
        }
      }

      // Ensure challengeIds is an array of strings
      preferences.challengeIds = preferences.challengeIds.map(String);

      // If no challengeIds, set to empty array
      if (preferences.challengeIds.length === 0) {
        preferences.challengeIds = [];
      }

      // Remove any undefined or null values
      preferences.challengeIds = preferences.challengeIds.filter(Boolean);

      return await this.customRequest(
        "POST",
        "/lol-challenges/v1/update-player-preferences/",
        preferences
      );
    } catch (error) {
      console.error("Challenge Badges Error:", error);
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set challenge points text
   */
  async setChallengePoints(points: string): Promise<LcuResponse> {
    try {
      return await this.customRequest("PUT", "/lol-chat/v1/me", {
        lol: {
          challengePoints: points,
        },
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set challenge crystal level (rank)
   * @param tier The rank tier (IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
   */
  async setChallengeRank(tier: string): Promise<LcuResponse> {
    try {
      return await this.customRequest("PUT", "/lol-chat/v1/me", {
        lol: {
          challengeCrystalLevel: tier,
        },
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set mastery level
   * @param level The mastery level to display
   */
  async setMasteryLevel(level: number): Promise<LcuResponse> {
    try {
      return await this.customRequest("PUT", "/lol-chat/v1/me", {
        lol: {
          masteryScore: level.toString(),
        },
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set availability status
   * @param status The availability status to set
   */
  async setAvailabilityStatus(
    status: "online" | "away" | "offline" | "mobile"
  ): Promise<LcuResponse> {
    try {
      return await this.customRequest("PUT", "/lol-chat/v1/me", {
        availability: status,
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Appear offline (hide online status)
   */
  async appearOffline(): Promise<LcuResponse> {
    return this.setAvailabilityStatus("offline");
  }

  /**
   * Appear online
   */
  async appearOnline(): Promise<LcuResponse> {
    return this.setAvailabilityStatus("online");
  }

  /**
   * Disconnect from chat
   */
  async disconnectChat(): Promise<LcuResponse> {
    try {
      return await this.customRequest("POST", "/chat/v1/suspend", {
        config: "disable",
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Reconnect to chat
   */
  async reconnectChat(): Promise<LcuResponse> {
    try {
      return await this.customRequest("POST", "/chat/v1/resume", {});
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Launch a new League of Legends client instance
   * This allows running multiple clients simultaneously
   */
  async launchNewClient(): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("launch_new_client");
    } catch (error) {
      console.error("Error launching client:", error);
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get all friends
   */
  async getFriends(): Promise<LcuResponse> {
    try {
      return await this.customRequest("GET", "/lol-chat/v1/friends");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get all friend requests
   */
  async getFriendRequests(): Promise<LcuResponse> {
    try {
      return await this.customRequest("GET", "/lol-chat/v1/friend-requests");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Delete a friend by PUUID
   */
  async deleteFriend(puuid: string): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "DELETE",
        `/lol-chat/v1/friends/${puuid}`
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Delete all friends (with optional delay between requests)
   */
  async deleteAllFriends(delayMs: number = 300): Promise<LcuResponse> {
    try {
      const friendsResponse = await this.getFriends();
      if (!friendsResponse.success || !friendsResponse.data) {
        return friendsResponse;
      }

      const friends = friendsResponse.data;
      let successCount = 0;
      let failCount = 0;

      for (const friend of friends) {
        const result = await this.deleteFriend(friend.puuid);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return {
        success: true,
        message: `Successfully deleted ${successCount} friends. Failed: ${failCount}`,
        data: { successCount, failCount },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Accept all friend requests
   */
  async acceptAllFriendRequests(delayMs: number = 300): Promise<LcuResponse> {
    try {
      const requestsResponse = await this.getFriendRequests();
      if (!requestsResponse.success || !requestsResponse.data) {
        return requestsResponse;
      }

      const requests = requestsResponse.data.filter(
        (request: any) => request.direction === "in"
      );
      let successCount = 0;
      let failCount = 0;

      for (const request of requests) {
        const result = await this.customRequest(
          "PUT",
          `/lol-chat/v1/friend-requests/${request.id}/accept`
        );

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return {
        success: true,
        message: `Successfully accepted ${successCount} friend requests. Failed: ${failCount}`,
        data: { successCount, failCount },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Reject all friend requests
   */
  async rejectAllFriendRequests(delayMs: number = 300): Promise<LcuResponse> {
    try {
      const requestsResponse = await this.getFriendRequests();
      if (!requestsResponse.success || !requestsResponse.data) {
        return requestsResponse;
      }

      const requests = requestsResponse.data.filter(
        (request: any) => request.direction === "in"
      );
      let successCount = 0;
      let failCount = 0;

      for (const request of requests) {
        const result = await this.customRequest(
          "DELETE",
          `/lol-chat/v1/friend-requests/${request.id}`
        );

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return {
        success: true,
        message: `Successfully rejected ${successCount} friend requests. Failed: ${failCount}`,
        data: { successCount, failCount },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Mass invite all friends to lobby
   */
  async inviteAllFriendsToLobby(delayMs: number = 300): Promise<LcuResponse> {
    try {
      const friendsResponse = await this.getFriends();
      if (!friendsResponse.success || !friendsResponse.data) {
        return friendsResponse;
      }

      const friends = friendsResponse.data;
      let successCount = 0;
      let failCount = 0;

      for (const friend of friends) {
        // Skip offline friends
        if (friend.availability !== "offline") {
          const result = await this.customRequest(
            "POST",
            "/lol-lobby/v2/lobby/invitations",
            [
              {
                toSummonerId: friend.summonerId,
                toSummonerName: friend.name || friend.gameName,
              },
            ]
          );

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }

          // Add delay to avoid rate limiting
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      return {
        success: true,
        message: `Successfully invited ${successCount} friends to lobby. Failed: ${failCount}`,
        data: { successCount, failCount },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Export friends list to JSON
   */
  async exportFriendsList(): Promise<LcuResponse> {
    try {
      const friendsResponse = await this.getFriends();
      if (!friendsResponse.success || !friendsResponse.data) {
        return friendsResponse;
      }

      // Simplify the data to include only essential information
      const simplifiedFriends = friendsResponse.data.map((friend: any) => ({
        name: friend.name || friend.gameName,
        gameName: friend.gameName,
        gameTag: friend.gameTag,
        puuid: friend.puuid,
        summonerId: friend.summonerId,
        groupId: friend.groupId,
        groupName: friend.groupName,
      }));

      return {
        success: true,
        message: `Successfully exported ${simplifiedFriends.length} friends`,
        data: simplifiedFriends,
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(name: string): Promise<LcuResponse> {
    try {
      return await this.customRequest("POST", "/lol-chat/v1/friend-requests", {
        name,
        direction: "out",
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Import friends from a list using the same method as Amumus Friends
   * Checks current summoner data to ensure names are up-to-date
   */
  async importFriends(
    friendsList: any[],
    delayMs: number = 300
  ): Promise<LcuResponse> {
    try {
      let successCount = 0;
      let failCount = 0;

      for (const friend of friendsList) {
        try {
          // Use PUUID to get current summoner data (same as Amumus Friends)
          if (friend.puuid) {
            const summonerResponse = await this.customRequest(
              "GET",
              `/lol-summoner/v1/summoners-by-puuid-cached/${friend.puuid}`
            );
            if (summonerResponse.success && summonerResponse.data) {
              const currentName =
                summonerResponse.data.internalName ||
                summonerResponse.data.name;

              // Send friend request with current name
              const result = await this.sendFriendRequest(currentName);
              if (result.success) {
                successCount++;
              } else {
                failCount++;
              }
            } else {
              // Fallback to stored name if PUUID lookup fails
              const name = friend.name || friend.gameName;
              if (name) {
                const result = await this.sendFriendRequest(name);
                if (result.success) {
                  successCount++;
                } else {
                  failCount++;
                }
              } else {
                failCount++;
              }
            }
          } else {
            // Fallback for old export format without PUUID
            const name = friend.name || friend.gameName;
            if (name) {
              const result = await this.sendFriendRequest(name);
              if (result.success) {
                successCount++;
              } else {
                failCount++;
              }
            } else {
              failCount++;
            }
          }

          // Add delay to avoid rate limiting
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } catch (error) {
          // If individual friend import fails, continue with others
          failCount++;
          console.error(
            `Failed to import friend ${friend.name || friend.gameName}:`,
            error
          );
        }
      }

      return {
        success: true,
        message: `Successfully sent ${successCount} friend requests. Failed: ${failCount}`,
        data: { successCount, failCount },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Auto-accept matchmaking
   */
  async autoAccept(enabled: boolean = true): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("auto_accept", { accept: enabled });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Instalock a specific champion
   * @param championId The ID of the champion to lock
   */
  async instalock(championId: number): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("instalock", { championId });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set backup pick champion
   * @param championId The ID of the backup champion to set
   */
  async setBackupPick(championId: number): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("set_backup_pick", { championId });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get all champions
   */
  async getAllChampions(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "GET",
        "/lol-champions/v1/owned-champions-minimal"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get champion mastery for a specific champion
   * @param championId The ID of the champion
   */
  async getChampionMastery(championId: number): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "GET",
        `/lol-champions/v1/champions/${championId}/mastery`
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get all champion masteries
   */
  async getAllChampionMasteries(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "GET",
        "/lol-champions/v1/champions-mastery"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get owned skins
   */
  async getOwnedSkins(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "GET",
        "/lol-inventory/v2/inventory/skins"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get current game queue type
   */
  async getCurrentQueueType(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "GET",
        "/lol-gameflow/v1/gameflow-metadata/player-status"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Check if a specific queue is available
   * @param queueType The queue type to check
   */
  async isQueueAvailable(queueType: QueueType): Promise<LcuResponse> {
    try {
      const response = await this.customRequest("GET", "/lol-queue/v1/queues");
      if (!response.success || !response.data) {
        return response;
      }

      const availableQueues = response.data;
      const queueAvailable = availableQueues.some(
        (queue: any) => queue.id === queueType
      );

      return {
        success: true,
        message: queueAvailable
          ? "Queue is available"
          : "Queue is not available",
        data: queueAvailable,
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Auto ban champion in champ select
   * @param championId The ID of the champion to ban
   * @param delay Delay in milliseconds before banning
   */
  async autoBan(championId: number, delay: number = 0): Promise<LcuResponse> {
    try {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return await invoke<LcuResponse>("auto_ban_champion", { championId });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Send instant message in champ select
   * @param message The message to send
   * @param times Number of times to send the message
   * @param delay Delay between messages in milliseconds
   */
  async sendInstantMessage(
    message: string,
    times: number = 1,
    delay: number = 0
  ): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("send_instant_message", {
        message,
        times,
        delay,
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Instantly mute all players in champ select
   */
  async instantMuteAll(): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("instant_mute_all");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Multi-search players in champ select
   * @param website The website to use for multi-search (opgg, ugg, porogg, porofessor)
   */
  async multiSearch(website: string = "opgg"): Promise<LcuResponse> {
    try {
      const response = await invoke<LcuResponse>("multi_search", { website });
      if (response.success && response.data?.url) {
        // Open the URL in the default browser
        window.open(response.data.url, "_blank");
        return {
          success: true,
          message: `Opened ${website.toUpperCase()} multi-search`,
          data: response.data,
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Auto import runes from OP.GG
   */
  async autoImportRunes(): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("auto_import_runes");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Dodge champ select without closing client
   */
  async dodgeLobby(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "POST",
        '/lol-login/v1/session/invoke?destination=lcdsServiceProxy&method=call&args=["","teambuilder-draft","quitV2",""]',
        ""
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get blue/red side in champ select
   */
  async getBlueSide(): Promise<LcuResponse> {
    try {
      const response = await this.customRequest(
        "GET",
        "/lol-champ-select/v1/session"
      );
      if (!response.success || !response.data) {
        return response;
      }

      const session = response.data;
      const myTeam = session.myTeam;

      if (!myTeam || !Array.isArray(myTeam) || myTeam.length === 0) {
        return {
          success: false,
          message: "Could not determine team side",
        };
      }

      const teamId = myTeam[0].team;
      const side = teamId === 1 ? "Blue" : "Red";

      return {
        success: true,
        message: `You are on the ${side} side`,
        data: { side, teamId },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Mass disenchant loot by type
   * @param lootType The type of loot to disenchant (CHAMPION_RENTAL, CHAMPION_SKIN_RENTAL, etc.)
   */
  async massDisenchantLoot(lootType: string): Promise<LcuResponse> {
    try {
      const lootResponse = await this.customRequest(
        "GET",
        "/lol-loot/v1/player-loot-map"
      );
      if (!lootResponse.success || !lootResponse.data) {
        return lootResponse;
      }

      const lootMap = lootResponse.data;
      let disenchantedCount = 0;
      let failedCount = 0;

      for (const lootKey in lootMap) {
        const loot = lootMap[lootKey];

        if (loot.type && loot.type.startsWith(lootType)) {
          const disenchantCase =
            lootType === "STATSTONE_SHARD" ? "DISENCHANT" : "disenchant";
          const disenchantName = loot.type;

          const result = await this.customRequest(
            "POST",
            `/lol-loot/v1/recipes/${disenchantName}_${disenchantCase}/craft?repeat=1`,
            [lootKey]
          );

          if (result.success) {
            disenchantedCount++;
          } else {
            failedCount++;
          }

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return {
        success: true,
        message: `Disenchanted ${disenchantedCount} items. Failed: ${failedCount}`,
        data: { disenchantedCount, failedCount },
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set minimap scale
   * @param scale Scale value (0-350, default 100)
   */
  async setMinimapScale(scale: number): Promise<LcuResponse> {
    try {
      const scaleValue = scale / 33.33;
      return await this.customRequest(
        "PATCH",
        "/lol-game-settings/v1/game-settings",
        {
          HUD: {
            MinimapScale: scaleValue,
          },
        }
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Start queue
   */
  async startQueue(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "POST",
        "/lol-lobby/v2/lobby/matchmaking/search"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Stop queue
   */
  async stopQueue(): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "DELETE",
        "/lol-lobby/v2/lobby/matchmaking/search"
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Get champ select session
   */
  async getChampSelectSession(): Promise<LcuResponse> {
    try {
      return await this.customRequest("GET", "/lol-champ-select/v1/session");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Set primary and secondary roles
   * @param primary Primary role (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, FILL)
   * @param secondary Secondary role
   */
  async setRoles(primary: string, secondary: string): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "PUT",
        "/lol-lobby/v1/lobby/members/localMember/position-preferences",
        {
          firstPreference: primary,
          secondPreference: secondary,
        }
      );
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Flush DNS cache to fix unknown player issues in League of Legends
   * This runs ipconfig /flushdns on Windows with admin privileges
   */
  async flushDns(): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("flush_dns");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Check if PersistedSettings.json is read-only
   * This protects League of Legends settings from being overwritten
   */
  async checkSettingsReadonly(): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("check_settings_readonly");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Toggle read-only status of PersistedSettings.json
   * @param setReadonly Whether to set the file as read-only or writable
   */
  async toggleSettingsReadonly(setReadonly: boolean): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("toggle_settings_readonly", {
        setReadonly,
      });
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }
}

export const lcuService = new LcuService();
