import { writable } from 'svelte/store';

type Theme = 'softextreme' | 'lemonade';

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>('softextreme');

  return {
    subscribe,
    set: (theme: Theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      set(theme);
    },
    toggle: () => {
      update(current => {
        const newTheme = current === 'softextreme' ? 'lemonade' : 'softextreme';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        return newTheme;
      });
    },
    init: () => {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme && (savedTheme === 'softextreme' || savedTheme === 'lemonade')) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        set(savedTheme);
      }
    }
  };
}

export const theme = createThemeStore();

