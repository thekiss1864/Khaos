import { writable } from "svelte/store";

type Theme = "forest";

function createThemeStore() {
  const { subscribe, set } = writable<Theme>("forest");

  return {
    subscribe,
    set: (theme: Theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      set(theme);
    },
    init: () => {
      document.documentElement.setAttribute("data-theme", "forest");
      set("forest");
    },
  };
}

export const theme = createThemeStore();
