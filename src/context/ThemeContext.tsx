import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemeId = 'gold' | 'lime' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'monochrome';

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

export interface ThemeTokens {
  bgPrimary: string;
  bgSecondary: string;
  cards: string;
  borders: string;
  primaryText: string;
  secondaryText: string;
  accentRed: string;
  metallicGold: string;
}

export const DARK_TOKENS: ThemeTokens = {
  bgPrimary: '#141010',
  bgSecondary: '#1C1919',
  cards: '#242020',
  borders: '#413939',
  primaryText: '#F2EEEE',
  secondaryText: '#A4A4A4',
  accentRed: '#A41717',
  metallicGold: '#B59447',
};

export const LIGHT_TOKENS: ThemeTokens = {
  bgPrimary: '#DCE3EA',
  bgSecondary: '#D1D9E2',
  cards: '#E4EAF0',
  borders: '#B0BCC9',
  primaryText: '#0B1120',
  secondaryText: '#334155',
  accentRed: '#DC2626',
  metallicGold: '#0284C7',
};

export const THEMES: Record<ThemeId, (isDark: boolean) => ThemeOption> = {
  gold: (isDark) => ({
    id: 'gold',
    name: isDark ? 'Metallic Gold' : 'Precision Cyan',
    color: isDark ? '#B59447' : '#0284C7',
    hoverColor: isDark ? '#C7A558' : '#0369A1',
    textColor: isDark ? '#141010' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(181, 148, 71, 0.15)' : 'rgba(2, 132, 199, 0.12)',
    mutedBorder: isDark ? 'rgba(181, 148, 71, 0.4)' : 'rgba(2, 132, 199, 0.35)',
    glow: isDark ? 'rgba(181, 148, 71, 0.45)' : 'rgba(2, 132, 199, 0.25)',
  }),
  lime: (isDark) => ({
    id: 'lime',
    name: 'Swiss Lime',
    color: isDark ? '#C6F36B' : '#65A30D',
    hoverColor: isDark ? '#D6F78B' : '#4D7C0F',
    textColor: isDark ? '#0B0D10' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(198, 243, 107, 0.12)' : 'rgba(101, 163, 13, 0.12)',
    mutedBorder: isDark ? 'rgba(198, 243, 107, 0.35)' : 'rgba(101, 163, 13, 0.35)',
    glow: isDark ? 'rgba(198, 243, 107, 0.4)' : 'rgba(101, 163, 13, 0.25)',
  }),
  cyan: (isDark) => ({
    id: 'cyan',
    name: 'Cyber Cyan',
    color: isDark ? '#67E8F9' : '#0891B2',
    hoverColor: isDark ? '#A5F3FC' : '#0E7490',
    textColor: isDark ? '#0B0D10' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(103, 232, 249, 0.12)' : 'rgba(8, 145, 178, 0.12)',
    mutedBorder: isDark ? 'rgba(103, 232, 249, 0.35)' : 'rgba(8, 145, 178, 0.35)',
    glow: isDark ? 'rgba(103, 232, 249, 0.4)' : 'rgba(8, 145, 178, 0.25)',
  }),
  emerald: (isDark) => ({
    id: 'emerald',
    name: 'Signal Emerald',
    color: isDark ? '#36D98A' : '#059669',
    hoverColor: isDark ? '#5EE6A5' : '#047857',
    textColor: isDark ? '#0B0D10' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(54, 217, 138, 0.12)' : 'rgba(5, 150, 105, 0.12)',
    mutedBorder: isDark ? 'rgba(54, 217, 138, 0.35)' : 'rgba(5, 150, 105, 0.35)',
    glow: isDark ? 'rgba(54, 217, 138, 0.4)' : 'rgba(5, 150, 105, 0.25)',
  }),
  amber: (isDark) => ({
    id: 'amber',
    name: 'Solar Amber',
    color: isDark ? '#FFBD59' : '#D97706',
    hoverColor: isDark ? '#FFD085' : '#B45309',
    textColor: isDark ? '#0B0D10' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(255, 189, 89, 0.12)' : 'rgba(217, 119, 6, 0.12)',
    mutedBorder: isDark ? 'rgba(255, 189, 89, 0.35)' : 'rgba(217, 119, 6, 0.35)',
    glow: isDark ? 'rgba(255, 189, 89, 0.4)' : 'rgba(217, 119, 6, 0.25)',
  }),
  violet: (isDark) => ({
    id: 'violet',
    name: 'Hyper Violet',
    color: isDark ? '#A78BFA' : '#7C3AED',
    hoverColor: isDark ? '#C4B5FD' : '#6D28D9',
    textColor: isDark ? '#0B0D10' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(167, 139, 250, 0.12)' : 'rgba(124, 58, 237, 0.12)',
    mutedBorder: isDark ? 'rgba(167, 139, 250, 0.35)' : 'rgba(124, 58, 237, 0.35)',
    glow: isDark ? 'rgba(167, 139, 250, 0.4)' : 'rgba(124, 58, 237, 0.25)',
  }),
  monochrome: (isDark) => ({
    id: 'monochrome',
    name: 'Asphalt Noir',
    color: isDark ? '#F2EEEE' : '#242020',
    hoverColor: isDark ? '#FFFFFF' : '#141010',
    textColor: isDark ? '#141010' : '#FFFFFF',
    mutedBg: isDark ? 'rgba(242, 238, 238, 0.12)' : 'rgba(36, 32, 32, 0.10)',
    mutedBorder: isDark ? 'rgba(242, 238, 238, 0.35)' : 'rgba(36, 32, 32, 0.30)',
    glow: isDark ? 'rgba(242, 238, 238, 0.3)' : 'rgba(36, 32, 32, 0.2)',
  }),
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  tokens: ThemeTokens;
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  currentTheme: ThemeOption;
  themeList: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  toggleMode: () => {},
  setMode: () => {},
  tokens: DARK_TOKENS,
  theme: 'gold',
  setTheme: () => {},
  currentTheme: THEMES.gold(true),
  themeList: Object.values(THEMES).map((fn) => fn(true)),
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial Mode: LocalStorage -> OS preference -> Default Dark (Asphalt Noir)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('smartjunction_theme_mode') as ThemeMode;
      if (savedMode === 'dark' || savedMode === 'light') return savedMode;
    } catch {
      // DPDP local-only fallback
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Asphalt Noir
  });

  // 2. Accent Palette
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('smartjunction_theme') as ThemeId;
      if (saved && THEMES[saved]) return saved;
    } catch {}
    return 'gold';
  });

  const isDark = mode === 'dark';
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  const currentTheme = (THEMES[theme] || THEMES.gold)(isDark);

  // Set mode with persistence
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('smartjunction_theme_mode', newMode);
    } catch {}
  };

  const toggleMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeState(id);
      try {
        localStorage.setItem('smartjunction_theme', id);
      } catch {}
    }
  };

  // Sync with OS preferences if user hasn't chosen manually
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem('smartjunction_theme_mode')) {
          setModeState(e.matches ? 'light' : 'dark');
        }
      } catch {}
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Update HTML data-theme, classes, and CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Exact required palette variables
    root.style.setProperty('--bg-primary', tokens.bgPrimary);
    root.style.setProperty('--bg-secondary', tokens.bgSecondary);
    root.style.setProperty('--bg-card', tokens.cards);
    root.style.setProperty('--border-color', tokens.borders);
    root.style.setProperty('--text-primary', tokens.primaryText);
    root.style.setProperty('--text-secondary', tokens.secondaryText);
    root.style.setProperty('--accent-red', tokens.accentRed);
    root.style.setProperty('--metallic-gold', tokens.metallicGold);

    // Accent variables
    root.style.setProperty('--theme-accent', currentTheme.color);
    root.style.setProperty('--theme-accent-hover', currentTheme.hoverColor);
    root.style.setProperty('--theme-accent-text', currentTheme.textColor);
    root.style.setProperty('--theme-accent-muted', currentTheme.mutedBg);
    root.style.setProperty('--theme-accent-border', currentTheme.mutedBorder);
    root.style.setProperty('--theme-accent-glow', currentTheme.glow);
  }, [mode, isDark, tokens, currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        toggleMode,
        setMode,
        tokens,
        theme,
        setTheme,
        currentTheme,
        themeList: Object.values(THEMES).map((fn) => fn(isDark)),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
