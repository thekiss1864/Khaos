import { lcuService } from "./lcuService";
import { notifications } from "$lib/stores/notification";
import {
  champSelectStore,
  type ChampSelectSettings,
} from "$lib/stores/champSelect";

class ChampSelectAutomation {
  private champSelectInterval: number | null = null;
  private autoAcceptInterval: number | null = null;
  private isInChampSelect = false;
  private currentSettings: ChampSelectSettings | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    // Subscribe to store changes to react to setting updates
    this.unsubscribe = champSelectStore.subscribe((settings) => {
      console.log("ChampSelectAutomation: Store updated", settings);
      this.currentSettings = settings;
      this.updateAutomationState();
    });
  }

  private updateAutomationState() {
    if (!this.currentSettings) return;

    console.log(
      "ChampSelectAutomation: updateAutomationState called, autoAcceptEnabled:",
      this.currentSettings.autoAcceptEnabled
    );

    // Start/stop auto-accept based on setting
    if (this.currentSettings.autoAcceptEnabled) {
      console.log("ChampSelectAutomation: Starting auto-accept monitoring");
      this.startAutoAcceptMonitoring();
    } else {
      console.log("ChampSelectAutomation: Stopping auto-accept monitoring");
      this.stopAutoAcceptMonitoring();
    }

    // Start/stop champ select monitoring (always needed for instalock/ban)
    if (
      this.currentSettings.instalockEnabled ||
      this.currentSettings.autoBanEnabled ||
      this.currentSettings.instantMuteEnabled ||
      this.currentSettings.blueSideNotification ||
      this.currentSettings.instantMessageEnabled
    ) {
      this.startChampSelectMonitoring();
    } else {
      this.stopChampSelectMonitoring();
    }
  }

  private startChampSelectMonitoring() {
    if (this.champSelectInterval !== null) return;

    this.champSelectInterval = window.setInterval(async () => {
      try {
        const session = await lcuService.getChampSelectSession();
        if (session.success && !this.isInChampSelect) {
          // Just entered champ select
          this.isInChampSelect = true;
          this.onChampSelectStart();
        } else if (!session.success && this.isInChampSelect) {
          // Left champ select
          this.isInChampSelect = false;
          this.onChampSelectEnd();
        }
      } catch (error) {
        if (this.isInChampSelect) {
          this.isInChampSelect = false;
          this.onChampSelectEnd();
        }
      }
    }, 1000);
  }

  private stopChampSelectMonitoring() {
    if (this.champSelectInterval) {
      clearInterval(this.champSelectInterval);
      this.champSelectInterval = null;
    }
    this.isInChampSelect = false;
  }

  private startAutoAcceptMonitoring() {
    if (this.autoAcceptInterval !== null) {
      console.log(
        "ChampSelectAutomation: Auto-accept monitoring already running"
      );
      return;
    }

    console.log(
      "ChampSelectAutomation: Starting auto-accept monitoring interval"
    );
    this.autoAcceptInterval = window.setInterval(async () => {
      try {
        if (!this.currentSettings?.autoAcceptEnabled) {
          console.log(
            "ChampSelectAutomation: Auto-accept disabled, skipping check"
          );
          return;
        }

        // Check for ready check directly
        const readyCheckResponse = await lcuService.customRequest(
          "GET",
          "/lol-matchmaking/v1/ready-check"
        );

        if (readyCheckResponse.success && readyCheckResponse.data) {
          const readyCheck = readyCheckResponse.data;
          console.log("ChampSelectAutomation: Ready check data:", readyCheck);

          // If there's an active ready check and it hasn't been accepted yet
          if (readyCheck.state === "InProgress" && !readyCheck.playerResponse) {
            console.log(
              "ChampSelectAutomation: Found active ready check, auto-accepting"
            );
            const response = await lcuService.autoAccept(true);
            if (response.success) {
              notifications.success("Auto-accepted matchmaking!");
            } else if (
              response.message &&
              response.message.includes("already accepted")
            ) {
              notifications.info("Match already accepted");
            } else {
              console.error(
                "ChampSelectAutomation: Auto-accept failed:",
                response.message
              );
            }
          }
        }
      } catch (error) {
        // Silently continue monitoring - don't spam notifications
      }
    }, 100); // Check every 100ms for more responsive auto accepting
  }

  private stopAutoAcceptMonitoring() {
    if (this.autoAcceptInterval) {
      clearInterval(this.autoAcceptInterval);
      this.autoAcceptInterval = null;
    }
  }

  private async onChampSelectStart() {
    if (!this.currentSettings) {
      console.log(
        "ChampSelectAutomation: onChampSelectStart called but no current settings"
      );
      return;
    }

    console.log(
      "ChampSelectAutomation: onChampSelectStart - checking features:",
      {
        blueSideNotification: this.currentSettings.blueSideNotification,
        instantMuteEnabled: this.currentSettings.instantMuteEnabled,
        instantMessageEnabled: this.currentSettings.instantMessageEnabled,
        autoBanEnabled: this.currentSettings.autoBanEnabled,
        instalockEnabled: this.currentSettings.instalockEnabled,
      }
    );

    notifications.info("Entered champion select");

    // Execute enabled features
    if (this.currentSettings.blueSideNotification) {
      console.log("ChampSelectAutomation: Executing blue side notification");
      await this.checkSide();
    }

    if (this.currentSettings.instantMuteEnabled) {
      console.log("ChampSelectAutomation: Executing instant mute");
      try {
        const response = await lcuService.instantMuteAll();
        if (response.success) {
          notifications.success("Muted all players");
        }
      } catch (error) {
        notifications.error("Failed to mute players");
      }
    }

    if (
      this.currentSettings.instantMessageEnabled &&
      this.currentSettings.instantMessageText.trim()
    ) {
      console.log(
        "ChampSelectAutomation: Scheduling instant message, text:",
        this.currentSettings.instantMessageText,
        "delay:",
        this.currentSettings.instantMessageDelay
      );
      setTimeout(async () => {
        try {
          const response = await lcuService.sendInstantMessage(
            this.currentSettings!.instantMessageText,
            this.currentSettings!.instantMessageTimes,
            this.currentSettings!.instantMessageDelayBetween
          );
          if (response.success) {
            notifications.success("Sent instant message");
          }
        } catch (error) {
          notifications.error("Failed to send instant message");
        }
      }, this.currentSettings.instantMessageDelay);
    }

    // Auto-ban monitoring
    if (
      this.currentSettings.autoBanEnabled &&
      this.currentSettings.selectedBanChampion
    ) {
      console.log("ChampSelectAutomation: Starting auto-ban monitoring");
      this.monitorForBan();
    }

    // Instalock monitoring
    if (
      this.currentSettings.instalockEnabled &&
      this.currentSettings.selectedChampion
    ) {
      console.log("ChampSelectAutomation: Starting instalock monitoring");
      this.monitorForPick();
    }
  }

  private async onChampSelectEnd() {
    notifications.info("Left champion select");
  }

  private async monitorForPick() {
    if (!this.currentSettings) {
      console.log(
        "ChampSelectAutomation: monitorForPick called but no current settings"
      );
      return;
    }

    console.log(
      "ChampSelectAutomation: Starting instalock monitoring, selectedChampion:",
      this.currentSettings.selectedChampion
    );
    let attempts = 0;
    const maxAttempts = 240; // 2 minutes (240 * 500ms)
    const pickInterval = setInterval(async () => {
      try {
        const sessionResponse = await lcuService.getChampSelectSession();
        if (!sessionResponse.success) {
          console.log("Instalock: Failed to get champ select session");
          clearInterval(pickInterval);
          return;
        }

        const session = sessionResponse.data;
        const localPlayerCellId = session.localPlayerCellId;
        const actions = session.actions;

        console.log(
          `Instalock attempt ${attempts + 1}: Found ${
            actions.length
          } action groups`
        );

        // Check if we're in the pick phase
        let pickPhase = false;
        for (const actionGroup of actions) {
          for (const action of actionGroup) {
            if (
              action.type === "pick" &&
              action.actorCellId === localPlayerCellId
            ) {
              pickPhase = true;
              console.log(
                `Instalock: Found pick action for local player, completed: ${action.completed}`
              );
              if (!action.completed) {
                // Delay before picking
                console.log(
                  `Instalock: Waiting ${
                    this.currentSettings!.instalockDelay
                  }ms before picking`
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, this.currentSettings!.instalockDelay)
                );

                // Determine which champion to pick (main or backup)
                let championToPick = parseInt(
                  this.currentSettings!.selectedChampion!
                );

                // If backup pick is enabled, check if main champion is available
                if (
                  this.currentSettings!.backupPickEnabled &&
                  this.currentSettings!.selectedBackupChampion
                ) {
                  // Check if main champion is banned or picked
                  const isMainBanned =
                    Array.isArray(session.bans) &&
                    session.bans.some(
                      (ban: any) =>
                        ban?.championId ===
                        parseInt(this.currentSettings!.selectedChampion!)
                    );
                  const isMainPicked =
                    Array.isArray(session.actions) &&
                    session.actions.some(
                      (actionGroup: any) =>
                        Array.isArray(actionGroup) &&
                        actionGroup.some(
                          (action: any) =>
                            action?.type === "pick" &&
                            action?.championId ===
                              parseInt(
                                this.currentSettings!.selectedChampion!
                              ) &&
                            action?.completed
                        )
                    );

                  if (isMainBanned || isMainPicked) {
                    console.log(
                      "Instalock: Main champion not available, using backup"
                    );
                    championToPick = parseInt(
                      this.currentSettings!.selectedBackupChampion
                    );
                  }
                }

                console.log(
                  `Instalock: Attempting to pick champion ID ${championToPick}`
                );

                const response = await lcuService.instalock(championToPick);

                if (response.success) {
                  notifications.success("Champion instalocked!");
                  console.log("Instalock: Successfully locked champion");
                  clearInterval(pickInterval);
                  return;
                } else {
                  console.error(
                    "Instalock: Failed to lock champion:",
                    response.message
                  );
                  notifications.error(`Instalock failed: ${response.message}`);
                }
              }
            }
          }
        }

        if (!pickPhase) {
          console.log(
            "Instalock: Not in pick phase yet, continuing to monitor"
          );
        }
      } catch (error) {
        // Periodic logging of failed attempts
        if (attempts % 10 === 0) {
          console.error(`Instalock attempt ${attempts + 1} failed:`, error);
          notifications.warning(`Instalock attempt failed: ${error}`);
        }
      }

      // Stop after max attempts
      attempts++;
      if (attempts >= maxAttempts) {
        console.error("Instalock: Timed out after 2 minutes");
        notifications.error("Instalock timed out");
        clearInterval(pickInterval);
      }
    }, 500);

    // Stop monitoring after 2 minutes
    setTimeout(() => {
      console.log("Instalock: Stopping monitoring after 2 minutes timeout");
      clearInterval(pickInterval);
    }, 120000);
  }

  private async monitorForBan() {
    if (!this.currentSettings) {
      console.log(
        "ChampSelectAutomation: monitorForBan called but no current settings"
      );
      return;
    }

    console.log(
      "ChampSelectAutomation: Starting auto-ban monitoring, selectedBanChampion:",
      this.currentSettings.selectedBanChampion
    );
    const banInterval = setInterval(async () => {
      try {
        if (this.currentSettings!.selectedBanChampion) {
          setTimeout(async () => {
            const response = await lcuService.autoBan(
              parseInt(this.currentSettings!.selectedBanChampion!),
              this.currentSettings!.autoBanDelay
            );
            if (response.success) {
              notifications.success("Champion auto-banned!");
            }
          }, this.currentSettings!.autoBanDelay);
        }
      } catch (error) {
        // Keep trying
      }
    }, 1000);

    // Stop monitoring after 2 minutes
    setTimeout(() => clearInterval(banInterval), 120000);
  }

  private async checkSide() {
    try {
      const response = await lcuService.getBlueSide();
      if (response.success && response.data) {
        champSelectStore.updateSetting("currentSide", response.data.side);
        notifications.success(`You are on ${response.data.side} side!`);
      } else {
        notifications.error(`Failed to check side: ${response.message}`);
      }
    } catch (error) {
      notifications.error(`Error checking side: ${error}`);
    }
  }

  // Public methods for manual control
  public start() {
    console.log("ChampSelectAutomation: start() called");
    this.updateAutomationState();
  }

  public stop() {
    this.stopChampSelectMonitoring();
    this.stopAutoAcceptMonitoring();
  }

  // Cleanup method
  public destroy() {
    this.stop();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// Create singleton instance
export const champSelectAutomation = new ChampSelectAutomation();
