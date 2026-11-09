import { lcuService } from "./lcuService";
import { notifications } from "$lib/stores/notification";
import {
  champSelectStore,
  type ChampSelectSettings,
} from "$lib/stores/champSelect";

const CHAMP_SELECT_POLL_MS = 500;
const READY_CHECK_POLL_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Action = {
  id: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  isInProgress: boolean;
  type: string;
};

function allActions(session: any): Action[] {
  return Array.isArray(session?.actions)
    ? (session.actions.flat().filter(Boolean) as Action[])
    : [];
}

/** My action of this type that the client is currently waiting on */
function myActiveAction(session: any, type: "pick" | "ban"): Action | undefined {
  return allActions(session).find(
    (a) =>
      a.actorCellId === session.localPlayerCellId &&
      a.type === type &&
      !a.completed &&
      a.isInProgress
  );
}

/** Champions that are banned or already locked by someone else */
function unavailableChampions(session: any): Set<number> {
  const ids = new Set<number>();
  // session.bans is { myTeamBans: number[], theirTeamBans: number[] }
  for (const id of session?.bans?.myTeamBans ?? []) ids.add(id);
  for (const id of session?.bans?.theirTeamBans ?? []) ids.add(id);
  for (const a of allActions(session)) {
    if (!a.completed || !a.championId) continue;
    if (a.type === "ban") ids.add(a.championId);
    if (a.type === "pick" && a.actorCellId !== session.localPlayerCellId) {
      ids.add(a.championId);
    }
  }
  return ids;
}

class ChampSelectAutomation {
  private champSelectTimer: number | null = null;
  private autoAcceptTimer: number | null = null;
  private champSelectRunning = false;
  private autoAcceptRunning = false;
  private isInChampSelect = false;
  private currentSettings: ChampSelectSettings | null = null;
  private unsubscribe: (() => void) | null = null;

  // Per champ select bookkeeping so each action is handled once
  private handledActions = new Set<number>();
  private pendingAction: number | null = null;
  private dodged = false;

  constructor() {
    // React to setting updates
    this.unsubscribe = champSelectStore.subscribe((settings) => {
      this.currentSettings = settings;
      this.updateAutomationState();
    });
  }

  private updateAutomationState() {
    if (!this.currentSettings) return;

    if (this.currentSettings.autoAcceptEnabled) {
      this.startAutoAcceptMonitoring();
    } else {
      this.stopAutoAcceptMonitoring();
    }

    if (
      this.currentSettings.instalockEnabled ||
      this.currentSettings.autoBanEnabled ||
      this.currentSettings.instantMuteEnabled ||
      this.currentSettings.blueSideNotification ||
      this.currentSettings.instantMessageEnabled ||
      this.currentSettings.dodgeOnBan
    ) {
      this.startChampSelectMonitoring();
    } else {
      this.stopChampSelectMonitoring();
    }
  }

  // ---------- Champ select ----------

  private startChampSelectMonitoring() {
    if (this.champSelectRunning) return;
    this.champSelectRunning = true;

    const tick = async () => {
      if (!this.champSelectRunning) return;
      try {
        const session = await lcuService.getChampSelectSession();
        if (session.success && session.data) {
          if (!this.isInChampSelect) {
            this.isInChampSelect = true;
            this.resetChampSelectState();
            await this.onChampSelectStart();
          }
          await this.handleSession(session.data);
        } else if (this.isInChampSelect) {
          this.isInChampSelect = false;
          this.onChampSelectEnd();
        }
      } catch {
        if (this.isInChampSelect) {
          this.isInChampSelect = false;
          this.onChampSelectEnd();
        }
      }
      if (this.champSelectRunning) {
        // Schedule the next poll only after this one finished, so polls never overlap
        this.champSelectTimer = window.setTimeout(tick, CHAMP_SELECT_POLL_MS);
      }
    };
    tick();
  }

  private stopChampSelectMonitoring() {
    this.champSelectRunning = false;
    if (this.champSelectTimer !== null) {
      clearTimeout(this.champSelectTimer);
      this.champSelectTimer = null;
    }
    this.isInChampSelect = false;
  }

  private resetChampSelectState() {
    this.handledActions.clear();
    this.pendingAction = null;
    this.dodged = false;
  }

  private async onChampSelectStart() {
    const settings = this.currentSettings;
    if (!settings) return;

    notifications.info("Entered champion select");

    if (settings.blueSideNotification) {
      await this.checkSide();
    }

    if (settings.instantMuteEnabled) {
      const response = await lcuService.instantMuteAll();
      if (response.success) {
        notifications.success(response.message || "Muted all players");
      } else {
        notifications.error(`Failed to mute players: ${response.message}`);
      }
    }

    if (settings.instantMessageEnabled && settings.instantMessageText.trim()) {
      setTimeout(async () => {
        const response = await lcuService.sendInstantMessage(
          settings.instantMessageText,
          settings.instantMessageTimes,
          settings.instantMessageDelayBetween
        );
        if (response.success) {
          notifications.success("Sent instant message");
        } else {
          notifications.error(`Failed to send message: ${response.message}`);
        }
      }, settings.instantMessageDelay);
    }
  }

  private onChampSelectEnd() {
    this.resetChampSelectState();
    notifications.info("Left champion select");
  }

  private async handleSession(session: any) {
    const settings = this.currentSettings;
    if (!settings || this.pendingAction !== null || this.dodged) return;

    // Auto-ban
    if (settings.autoBanEnabled && settings.selectedBanChampion) {
      const ban = myActiveAction(session, "ban");
      if (ban && !this.handledActions.has(ban.id)) {
        await this.runAction(ban.id, settings.autoBanDelay, async () => {
          const response = await lcuService.autoBan(
            parseInt(settings.selectedBanChampion!)
          );
          if (response.success) {
            notifications.success("Champion auto-banned!");
          } else {
            notifications.error(`Auto-ban failed: ${response.message}`);
          }
        });
        return;
      }
    }

    const pick = myActiveAction(session, "pick");
    const main = settings.selectedChampion
      ? parseInt(settings.selectedChampion)
      : null;

    // Dodge when the main champion got banned/taken and there is no usable backup
    if (settings.dodgeOnBan && main !== null) {
      const unavailable = unavailableChampions(session);
      const backup =
        settings.backupPickEnabled && settings.selectedBackupChampion
          ? parseInt(settings.selectedBackupChampion)
          : null;
      const backupUsable = backup !== null && !unavailable.has(backup);
      if (unavailable.has(main) && !backupUsable) {
        this.dodged = true;
        const response = await lcuService.dodgeLobby();
        if (response.success) {
          notifications.warning("Main champion unavailable, dodged lobby");
        } else {
          notifications.error(`Dodge failed: ${response.message}`);
        }
        return;
      }
    }

    // Instalock
    if (settings.instalockEnabled && main !== null && pick) {
      if (this.handledActions.has(pick.id)) return;
      await this.runAction(pick.id, settings.instalockDelay, async () => {
        // Re-read the session after the delay so bans/picks are up to date
        const fresh = await lcuService.getChampSelectSession();
        const unavailable = unavailableChampions(fresh.data ?? session);

        let championToPick = main;
        if (unavailable.has(main)) {
          const backup =
            settings.backupPickEnabled && settings.selectedBackupChampion
              ? parseInt(settings.selectedBackupChampion)
              : null;
          if (backup === null || unavailable.has(backup)) {
            notifications.warning(
              "Instalock skipped: your champion is banned or taken"
            );
            return;
          }
          championToPick = backup;
          notifications.info("Main champion unavailable, using backup pick");
        }

        const response = await lcuService.instalock(championToPick);
        if (response.success) {
          notifications.success("Champion instalocked!");
        } else {
          notifications.error(`Instalock failed: ${response.message}`);
        }
      });
    }
  }

  /** Run a pick/ban once per action id, after an optional delay */
  private async runAction(
    actionId: number,
    delay: number,
    run: () => Promise<void>
  ) {
    this.handledActions.add(actionId);
    this.pendingAction = actionId;
    try {
      if (delay > 0) await sleep(delay);
      if (this.isInChampSelect) await run();
    } finally {
      this.pendingAction = null;
    }
  }

  // ---------- Ready check ----------

  private startAutoAcceptMonitoring() {
    if (this.autoAcceptRunning) return;
    this.autoAcceptRunning = true;

    const tick = async () => {
      if (!this.autoAcceptRunning) return;
      try {
        const response = await lcuService.customRequest(
          "GET",
          "/lol-matchmaking/v1/ready-check"
        );
        const readyCheck = response.success ? response.data : null;

        // playerResponse is "None" until you accept or decline
        if (
          readyCheck?.state === "InProgress" &&
          readyCheck.playerResponse === "None"
        ) {
          const accepted = await lcuService.autoAccept(true);
          if (accepted.success) {
            // playerResponse flips to "Accepted", so this fires once per ready check
            notifications.success("Auto-accepted matchmaking!");
          }
        }
      } catch {
        // Not in queue or client closed; keep polling quietly
      }
      if (this.autoAcceptRunning) {
        this.autoAcceptTimer = window.setTimeout(tick, READY_CHECK_POLL_MS);
      }
    };
    tick();
  }

  private stopAutoAcceptMonitoring() {
    this.autoAcceptRunning = false;
    if (this.autoAcceptTimer !== null) {
      clearTimeout(this.autoAcceptTimer);
      this.autoAcceptTimer = null;
    }
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
    this.updateAutomationState();
  }

  public stop() {
    this.stopChampSelectMonitoring();
    this.stopAutoAcceptMonitoring();
  }

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
