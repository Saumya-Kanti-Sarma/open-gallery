// store/themeStore.ts
import { create } from "zustand";

type ThemeState = {
  darkmode: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  darkmode: false,

  toggle: () =>
    set((state) => ({ darkmode: !state.darkmode })),

  setDark: (value) =>
    set({ darkmode: value }),
}));