/**
 * LCU Service - Handles communication with the Tauri backend for LCU operations
 */

import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/shell";

export interface LcuResponse {
  success: boolean;
  message: string;
  data?: any;
  /** HTTP status code from the client, when a request was made */
  status?: number;
}

/** Which local API a request goes to. "riot" is the Riot Client (/chat/*, /riotclient/*). */
export type ClientTarget = "league" | "riot";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
   * Make a custom request to the League Client (default) or the Riot Client API
   */
  async customRequest(
    method: string,
    endpoint: string,
    body?: any,
    target: ClientTarget = "league"
  ): Promise<LcuResponse> {
    try {
      return await invoke<LcuResponse>("custom_lcu_request", {
        method,
        endpoint,
        body,
        target,
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
        "/lol-challenges/v1/update-player-preferences",
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
        "/lol-challenges/v1/update-player-preferences",
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
        "/lol-challenges/v1/update-player-preferences",
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
      // The client calls "online" availability "chat"
      return await this.customRequest("PUT", "/lol-chat/v1/me", {
        availability: status === "online" ? "chat" : status,
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
      // Riot Client endpoint (not served by the League Client)
      return await invoke<LcuResponse>("disconnect_chat");
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
      // Riot Client endpoint (not served by the League Client)
      return await invoke<LcuResponse>("reconnect_chat");
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
      return await this.customRequest("GET", "/lol-chat/v2/friend-requests");
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Accept an incoming friend request (from /lol-chat/v2/friend-requests)
   */
  async acceptFriendRequest(request: any): Promise<LcuResponse> {
    // Accepting = setting the request direction to "both"
    return this.customRequest(
      "PUT",
      `/lol-chat/v2/friend-requests/${request.puuid}`,
      { ...request, direction: "both" }
    );
  }

  /**
   * Decline an incoming friend request
   */
  async declineFriendRequest(request: any): Promise<LcuResponse> {
    return this.customRequest(
      "DELETE",
      `/lol-chat/v2/friend-requests/${request.puuid}`
    );
  }

  /**
   * Delete a friend by friend id (falls back to PUUID)
   */
  async deleteFriend(id: string): Promise<LcuResponse> {
    try {
      return await this.customRequest(
        "DELETE",
        `/lol-chat/v1/friends/${encodeURIComponent(id)}`
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
        const result = await this.deleteFriend(friend.id || friend.puuid);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
          await sleep(delayMs);
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
        const result = await this.acceptFriendRequest(request);

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
          await sleep(delayMs);
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
        const result = await this.declineFriendRequest(request);

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
          await sleep(delayMs);
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
                toPuuid: friend.puuid,
                toSummonerId: friend.summonerId,
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
            await sleep(delayMs);
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
        name: friend.gameName ? `${friend.gameName}#${friend.gameTag}` : friend.name,
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
   * Send a friend request by Riot ID ("Name#TAG", or separate name and tag)
   */
  async sendFriendRequest(
    gameNameOrRiotId: string,
    tagLine?: string
  ): Promise<LcuResponse> {
    try {
      let gameName = gameNameOrRiotId.trim();
      let tag = tagLine?.trim() ?? "";
      if (!tag && gameName.includes("#")) {
        const index = gameName.lastIndexOf("#");
        tag = gameName.slice(index + 1);
        gameName = gameName.slice(0, index);
      }
      if (!gameName || !tag) {
        return {
          success: false,
          message: `"${gameNameOrRiotId}" is not a Riot ID (expected Name#TAG)`,
        };
      }
      return await this.customRequest("POST", "/lol-chat/v2/friend-requests", {
        gameName,
        tagLine: tag,
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
   * Import friends from an exported list.
   * Looks each player up by PUUID first so renamed Riot IDs are picked up, then falls
   * back to the Riot ID stored in the export.
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
          let gameName: string | undefined = friend.gameName;
          let tagLine: string | undefined = friend.gameTag ?? friend.tagLine;

          if (friend.puuid) {
            const summonerResponse = await this.customRequest(
              "GET",
              `/lol-summoner/v2/summoners/puuid/${friend.puuid}`
            );
            if (
              summonerResponse.success &&
              summonerResponse.data?.gameName &&
              summonerResponse.data?.tagLine
            ) {
              gameName = summonerResponse.data.gameName;
              tagLine = summonerResponse.data.tagLine;
            }
          }

          // Old exports only had a name; accept it when it is already a Riot ID
          const result =
            gameName && tagLine
              ? await this.sendFriendRequest(gameName, tagLine)
              : await this.sendFriendRequest(String(friend.name ?? ""));

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }

          if (delayMs > 0) {
            await sleep(delayMs);
          }
        } catch (error) {
          // If individual friend import fails, continue with others
          failCount++;
          console.error(
            `Failed to import friend ${friend.gameName || friend.name}:`,
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
      return await invoke<LcuResponse>("get_champion_mastery", { championId });
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
      return await invoke<LcuResponse>("get_all_champion_masteries");
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
      return await invoke<LcuResponse>("get_owned_skins");
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
      return await invoke<LcuResponse>("get_current_queue_type");
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
      return await invoke<LcuResponse>("is_queue_available", {
        queueId: queueType,
      });
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
   * Only includes players whose Riot IDs the client shows (ranked lobbies hide them).
   * @param website The website to use for multi-search (opgg, ugg)
   */
  async multiSearch(website: string = "opgg"): Promise<LcuResponse> {
    try {
      const response = await invoke<LcuResponse>("multi_search", { website });
      if (response.success && response.data?.url) {
        // Open the URL in the default browser (window.open does nothing in Tauri)
        await open(response.data.url);
        return {
          success: true,
          message: `Opened ${website.toUpperCase()} multi-search: ${response.message}`,
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
   * Import the client's recommended rune page for your champion and role
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
   * Dodge champ select without closing client.
   * Uses the LCDS "quitV2" call; the normal dodge penalty still applies.
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
   * @param lootType Exact loot type (CHAMPION_RENTAL, CHAMPION_SKIN_RENTAL, STATSTONE_SHARD, ...)
   */
  async massDisenchantLoot(lootType: string): Promise<LcuResponse> {
    try {
      const lootResponse = await this.customRequest(
        "GET",
        "/lol-loot/v1/player-loot"
      );
      if (!lootResponse.success || !Array.isArray(lootResponse.data)) {
        return lootResponse;
      }

      // Exact type match: "CHAMPION" must not also hit CHAMPION_RENTAL or CHAMPION_SKIN
      const items = lootResponse.data.filter(
        (loot: any) =>
          loot.type === lootType &&
          loot.disenchantRecipeName &&
          (loot.count ?? 0) > 0
      );
      if (items.length === 0) {
        return {
          success: true,
          message: "Nothing to disenchant",
          data: { disenchantedCount: 0, failedCount: 0 },
        };
      }

      // One request for everything
      const mass = await this.customRequest(
        "POST",
        "/lol-loot/v1/craft/mass",
        items.map((loot: any) => ({
          recipeName: loot.disenchantRecipeName,
          lootNames: [loot.lootName ?? loot.lootId],
          repeat: loot.count,
        }))
      );
      if (mass.success) {
        const total = items.reduce((sum: number, l: any) => sum + l.count, 0);
        return {
          success: true,
          message: `Disenchanted ${total} items`,
          data: { disenchantedCount: total, failedCount: 0 },
        };
      }

      // Fallback: one recipe call per item
      let disenchantedCount = 0;
      let failedCount = 0;
      for (const loot of items) {
        const name = loot.lootName ?? loot.lootId;
        const result = await this.customRequest(
          "POST",
          `/lol-loot/v1/recipes/${loot.disenchantRecipeName}/craft?repeat=${loot.count}`,
          [name]
        );
        if (result.success) {
          disenchantedCount += loot.count;
        } else {
          failedCount += loot.count;
        }
        await sleep(100);
      }

      return {
        success: failedCount === 0,
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
      const result = await this.customRequest(
        "PATCH",
        "/lol-game-settings/v1/game-settings",
        {
          HUD: {
            MinimapScale: scaleValue,
          },
        }
      );
      if (result.success) {
        // Persist the change to disk
        await this.customRequest("POST", "/lol-game-settings/v1/save");
      }
      return result;
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
