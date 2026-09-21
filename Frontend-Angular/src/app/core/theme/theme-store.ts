import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { SafeStorage } from '../../shared/utils/safe-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'stockhub.theme';
const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** Light / dark / system theme, persisted per device and applied on <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(SafeStorage);
  private readonly media =
    this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  private readonly systemPrefersDark = signal(this.media?.matches ?? false);

  readonly preference = signal<ThemePreference>(this.readStoredPreference());
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return preference;
  });

  constructor() {
    this.media?.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
    effect(() => {
      this.document.documentElement.classList.toggle('dark', this.resolved() === 'dark');
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.storage.set(THEME_STORAGE_KEY, preference);
  }

  private readStoredPreference(): ThemePreference {
    const stored = this.storage.get(THEME_STORAGE_KEY);
    return PREFERENCES.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'system';
  }
}
