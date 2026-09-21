export const THEME_STORAGE_KEY = 'stockhub.theme';
export const THEMES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEMES)[number];
