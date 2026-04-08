// theme/theme.ts
export const createTheme = (dark: boolean) => ({
  dark,

  colors: {
    background: dark ? "#111" : "#fff",
    text: dark ? "#ffffff" : "#000000",
    primary: "#07762A",
  },

  barStyle: dark ? "light-content" : "dark-content",
});