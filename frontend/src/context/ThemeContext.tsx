import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const STORAGE_KEY = "darkMode";
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Saved choice first, otherwise follow the operating system
const initialDarkMode = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved) === true;
  } catch {
    // storage unavailable (private mode)
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(initialDarkMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(darkMode));
    } catch {
      // ignore
    }
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode: () => setDarkMode((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
