import { writable } from 'svelte/store';

// Champion Select Automation Store
interface ChampSelectSettings {
  // Auto features
  autoAcceptEnabled: boolean;
  instalockEnabled: boolean;
  instalockDelay: number;
  autoBanEnabled: boolean;
  autoBanDelay: number;
  backupPickEnabled: boolean;
  dodgeOnBan: boolean;

  // Champion selections
  selectedChampion: string | null;
  selectedBanChampion: string | null;
  selectedBackupChampion: string | null;

  // Instant message
  instantMessageEnabled: boolean;
  instantMessageText: string;
  instantMessageTimes: number;
  instantMessageDelay: number;
  instantMessageDelayBetween: number;

  // Other features
  instantMuteEnabled: boolean;
  blueSideNotification: boolean;
  currentSide: string;

  // Role selection
  primaryRole: string;
  secondaryRole: string;

  // Multi-search
  multiSearchWebsite: string;
}

// Default settings
const defaultSettings: ChampSelectSettings = {
  // Auto features
  autoAcceptEnabled: false,
  instalockEnabled: false,
  instalockDelay: 0,
  autoBanEnabled: false,
  autoBanDelay: 0,
  backupPickEnabled: false,
  dodgeOnBan: false,

  // Champion selections
  selectedChampion: null,
  selectedBanChampion: null,
  selectedBackupChampion: null,

  // Instant message
  instantMessageEnabled: false,
  instantMessageText: '',
  instantMessageTimes: 1,
  instantMessageDelay: 0,
  instantMessageDelayBetween: 0,

  // Other features
  instantMuteEnabled: false,
  blueSideNotification: false,
  currentSide: '',

  // Role selection
  primaryRole: 'UNSELECTED',
  secondaryRole: 'UNSELECTED',

  // Multi-search
  multiSearchWebsite: 'opgg',
};

// Create the store
function createChampSelectStore() {
  // Get stored settings from localStorage if available
  let initialSettings = defaultSettings;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('champSelectSettings');
    if (stored) {
      try {
        initialSettings = { ...defaultSettings, ...JSON.parse(stored) };
      } catch (e) {
        console.warn('Failed to parse stored champ select settings:', e);
      }
    }
  }

  const { subscribe, set, update } = writable<ChampSelectSettings>(initialSettings);

  return {
    subscribe,
    set,
    update,

    // Reset to defaults
    reset: () => set(defaultSettings),

    // Update and persist to localStorage
    updateSetting: <K extends keyof ChampSelectSettings>(
      key: K,
      value: ChampSelectSettings[K]
    ) => {
      update(settings => {
        const newSettings = { ...settings, [key]: value };
        if (typeof window !== 'undefined') {
          localStorage.setItem('champSelectSettings', JSON.stringify(newSettings));
        }
        return newSettings;
      });
    },

    // Bulk update multiple settings
    updateSettings: (newSettings: Partial<ChampSelectSettings>) => {
      update(settings => {
        const updatedSettings = { ...settings, ...newSettings };
        if (typeof window !== 'undefined') {
          localStorage.setItem('champSelectSettings', JSON.stringify(updatedSettings));
        }
        return updatedSettings;
      });
    },

    // Clear all stored settings
    clearStoredSettings: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('champSelectSettings');
      }
    },
  };
}

export const champSelectStore = createChampSelectStore();

// Export types
export type { ChampSelectSettings };
