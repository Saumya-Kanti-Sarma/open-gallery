// theme/ThemeProvider.tsx
import { createContext, useContext } from "react";
import { createTheme } from "./theme";
import { useThemeStore } from "@/src/store/ThemeStore";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const darkmode = useThemeStore((s) => s.darkmode);

  const theme = createTheme(darkmode);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);