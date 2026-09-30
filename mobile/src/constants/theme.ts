/**
 * FLASHY System Design Tokens
 * "Know what you're wearing."
 * 
 * Inspired by fashion, denim, leather, fabric, and editorial magazines.
 * Genuinely designed Dark & Light modes with rich palettes.
 * No generic AI SaaS clichés, no purple gradients, no neon accents.
 */

import { create } from 'zustand';
import { Storage } from '../utils/storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Primary canvas & surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceHover: string;
  surfaceElevated: string;
  surfaceCream: string;

  // Fashion Accents
  denim: string;
  denimDark: string;
  denimLight: string;
  denimMuted: string;

  burgundy: string;
  burgundyLight: string;
  burgundyDark: string;
  burgundyMuted: string;

  leather: string;
  leatherLight: string;

  // Core action tokens (burgundy / denim fashion accents)
  primary: string;
  primaryLight: string;
  primaryDark: string;

  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Highlights / Badges
  accent: string;
  accentLight: string;
  gold: string;
  goldLight: string;
  goldDark: string;

  // Typography
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderStrong: string;

  // Semantic States (Understated, non-neon)
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;

  // Control states
  disabled: string;
  disabledBg: string;
}

export const darkColors: ThemeColors = {
  // Dark denim & washed black photography canvas
  background: '#0D1117',         // Washed dark navy / deep black
  surface: '#131922',            // Deep denim charcoal surface
  surfaceMuted: '#1A2330',       // Rich denim charcoal secondary
  surfaceHover: '#222D3D',       // Highlighted item / row
  surfaceElevated: '#1E2838',    // Floating layer / sheet
  surfaceCream: '#151D28',       // Muted denim backdrop

  // Denim Palette (Dark Mode)
  denim: '#3B5878',              // Muted denim blue
  denimDark: '#1E2D40',          // Deep navy denim
  denimLight: '#54769E',         // Washed denim highlight
  denimMuted: '#243447',         // Subtle denim wash

  // Burgundy / Maroon Palette (Dark Mode)
  burgundy: '#8B2036',           // Deep fashion burgundy
  burgundyLight: '#30131A',      // Burgundy tinted badge bg
  burgundyDark: '#661526',       // Rich wine dark
  burgundyMuted: '#261117',      // Very subtle wine shadow

  // Leather & Earth (Dark Mode)
  leather: '#7A523A',            // Aged cognac leather
  leatherLight: '#33231A',

  // Core Action (Deep Burgundy / Wine)
  primary: '#8B2036',
  primaryLight: '#30131A',
  primaryDark: '#AB2B44',

  // Secondary Action (Denim Slate)
  secondary: '#3B5878',
  secondaryLight: '#1E2D40',
  secondaryDark: '#54769E',

  accent: '#7A523A',
  accentLight: '#2C1D15',
  gold: '#7A523A',
  goldLight: '#2C1D15',
  goldDark: '#8B5D42',

  // High contrast warm off-white editorial typography
  text: '#F5F2EB',               // Warm off-white (magazine readability)
  textSecondary: '#A5A094',      // Soft warm gray / linen
  textMuted: '#716C62',          // Subtle charcoal stone
  textInverse: '#0D1117',

  // Editorial Hairlines
  border: '#243040',             // Deep denim charcoal hairline
  borderSubtle: '#1A2330',       // Whisper-thin divider
  borderStrong: '#3A4C64',       // Active border

  // Semantic
  success: '#3D8B5E',
  successBg: '#13281E',
  warning: '#B87A2A',
  warningBg: '#2A1F12',
  error: '#BA2A3E',
  errorBg: '#2E1217',
  info: '#3B6899',
  infoBg: '#132338',

  disabled: '#4D4942',
  disabledBg: '#181C22',
};

export const lightColors: ThemeColors = {
  // Ivory, cream, warm white editorial palette
  background: '#FAF8F5',         // Warm ivory / cream canvas
  surface: '#FFFFFF',            // Crisp warm white
  surfaceMuted: '#F2EFEB',       // Soft beige / warm stone
  surfaceHover: '#EBE6DE',       // Warm stone hover
  surfaceElevated: '#FFFFFF',    // Crisp card surface
  surfaceCream: '#F6F3ED',       // Editorial cream container

  // Denim Palette (Light Mode)
  denim: '#243E5E',              // Classic denim blue
  denimDark: '#172A40',          // Deep indigo navy
  denimLight: '#EBF1F7',         // Light washed denim tint
  denimMuted: '#D7E3EE',         // Soft denim border/tint

  // Burgundy / Maroon Palette (Light Mode)
  burgundy: '#6E1C2E',           // Muted burgundy / maroon
  burgundyLight: '#F7EDEF',      // Soft rose-wine tint
  burgundyDark: '#521220',       // Deep oxblood
  burgundyMuted: '#F0DCE1',      // Subtle wine border

  // Leather & Earth (Light Mode)
  leather: '#634832',            // Rich saddle leather
  leatherLight: '#F5EEE8',

  // Core Action (Muted Burgundy)
  primary: '#6E1C2E',
  primaryLight: '#F7EDEF',
  primaryDark: '#521220',

  // Secondary Action (Denim Blue)
  secondary: '#243E5E',
  secondaryLight: '#EBF1F7',
  secondaryDark: '#172A40',

  accent: '#634832',
  accentLight: '#F5EEE8',
  gold: '#634832',
  goldLight: '#F5EEE8',
  goldDark: '#4A3524',

  // Editorial Charcoal & Muted Gray
  text: '#171615',               // Deep charcoal black
  textSecondary: '#524F49',      // Subtle warm gray
  textMuted: '#8A857C',          // Soft stone taupe
  textInverse: '#FAF8F5',

  // Editorial Hairlines
  border: '#E6E0D6',             // Clean warm gray hairline
  borderSubtle: '#EFECE6',       // Whisper-thin divider
  borderStrong: '#CFC6B8',       // Focused border

  // Semantic
  success: '#267345',
  successBg: '#EAF5EE',
  warning: '#A65A15',
  warningBg: '#FEF4E8',
  error: '#A82030',
  errorBg: '#FDF0F2',
  info: '#205282',
  infoBg: '#EDF4FA',

  disabled: '#BDB7AC',
  disabledBg: '#ECE7DF',
};

// Default export uses dark colors by default (authentic fashion editorial) or light
export const colors = darkColors;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  screenPadding: 16,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 36,
  },
  lineHeights: {
    xs: 15,
    sm: 18,
    base: 22,
    md: 24,
    lg: 26,
    xl: 30,
    xxl: 36,
    display: 42,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 0.8,
    tracked: 1.5,
    masthead: 3.5,
  },
};

export const radii = {
  xs: 2,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
};

export const shadows = {
  none: {},
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
};

// Zustand Theme Store for instantaneous dark/light mode toggling across the entire app
interface ThemeStoreState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  initTheme: () => Promise<void>;
}

export const useFashionTheme = create<ThemeStoreState>((set, get) => ({
  mode: 'dark',
  colors: darkColors,
  isDark: true,

  toggleTheme: () => {
    const nextMode: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    const nextColors = nextMode === 'dark' ? darkColors : lightColors;
    Storage.setItemAsync('flashy_theme_mode', nextMode);
    set({
      mode: nextMode,
      colors: nextColors,
      isDark: nextMode === 'dark',
    });
  },

  setMode: (mode: ThemeMode) => {
    const nextColors = mode === 'dark' ? darkColors : lightColors;
    Storage.setItemAsync('flashy_theme_mode', mode);
    set({
      mode,
      colors: nextColors,
      isDark: mode === 'dark',
    });
  },

  initTheme: async () => {
    try {
      const saved = await Storage.getItemAsync('flashy_theme_mode');
      if (saved === 'light' || saved === 'dark') {
        const nextColors = saved === 'dark' ? darkColors : lightColors;
        set({
          mode: saved,
          colors: nextColors,
          isDark: saved === 'dark',
        });
      }
    } catch {
      // Keep default dark
    }
  },
}));

export const theme = {
  colors: darkColors,
  darkColors,
  lightColors,
  spacing,
  typography,
  radii,
  shadows,
};

export default theme;
