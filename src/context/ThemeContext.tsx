import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'lime' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'monochrome';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  color: string;
  hoverColor: string;
  textColor: string;
  mutedBg: string;
  mutedBorder: string;
  glow: string;
}

export const THEMES: Record<ThemeId, ThemeOption> = {
  lime: {
    id: 'lime',
    name: 'Swiss Lime',
    color: '#C6F36B',
    hoverColor: '#D6F78B',
    textColor: '#0B0D10',
    mutedBg: 'rgba(198, 243, 107, 0.12)',
    mutedBorder: 'rgba(198, 243, 107, 0.35)',
    glow: 'rgba(198, 243, 107, 0.4)',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    color: '#67E8F9',
    hoverColor: '#A5F3FC',
    textColor: '#0B0D10',
    mutedBg: 'rgba(103, 232, 249, 0.12)',
    mutedBorder: 'rgba(103, 232, 249, 0.35)',
    glow: 'rgba(103, 232, 249, 0.4)',
  },
  emerald: {
    id: 'emerald',
    name: 'Signal Emerald',
    color: '#36D98A',
    hoverColor: '#5EE6A5',
    textColor: '#0B0D10',
    mutedBg: 'rgba(54, 217, 138, 0.12)',
    mutedBorder: 'rgba(54, 217, 138, 0.35)',
    glow: 'rgba(54, 217, 138, 0.4)',
  },
  amber: {
    id: 'amber',
    name: 'Solar Amber',
    color: '#FFBD59',
    hoverColor: '#FFD085',
    textColor: '#0B0D10',
    mutedBg: 'rgba(255, 189, 89, 0.12)',
    mutedBorder: 'rgba(255, 189, 89, 0.35)',
    glow: 'rgba(255, 189, 89, 0.4)',
  },
  violet: {
    id: 'violet',
    name: 'Hyper Violet',
    color: '#A78BFA',
    hoverColor: '#C4B5FD',
    textColor: '#0B0D10',
    mutedBg: 'rgba(167, 139, 250, 0.12)',
    mutedBorder: 'rgba(167, 139, 250, 0.35)',
    glow: 'rgba(167, 139, 250, 0.4)',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Minimal Mono',
    color: '#E2E8F0',
    hoverColor: '#F8FAFC',
    textColor: '#0B0D10',
    mutedBg: 'rgba(226, 232, 240, 0.12)',
    mutedBorder: 'rgba(226, 232, 240, 0.35)',
    glow: 'rgba(226, 232, 240, 0.4)',
  },
};

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  currentTheme: ThemeOption;
  themeList: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'lime',
  setTheme: () => {},
  currentTheme: THEMES.lime,
  themeList: Object.values(THEMES),
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('smartjunction_theme') as ThemeId;
      if (saved && THEMES[saved]) return saved;
    } catch {
      // DPDP local-only fallback
    }
    return 'lime';
  });

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeState(id);
      try {
        localStorage.setItem('smartjunction_theme', id);
      } catch {
        // Safe fallback
      }
    }
  };

  const currentTheme = THEMES[theme] || THEMES.lime;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--theme-accent', currentTheme.color);
    root.style.setProperty('--theme-accent-hover', currentTheme.hoverColor);
    root.style.setProperty('--theme-accent-text', currentTheme.textColor);
    root.style.setProperty('--theme-accent-muted', currentTheme.mutedBg);
    root.style.setProperty('--theme-accent-border', currentTheme.mutedBorder);
    root.style.setProperty('--theme-accent-glow', currentTheme.glow);
  }, [theme, currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentTheme,
        themeList: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
