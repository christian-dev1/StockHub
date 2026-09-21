import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeStore } from './theme-store';

describe('ThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  function create(): ThemeStore {
    TestBed.resetTestingModule();
    return TestBed.inject(ThemeStore);
  }

  it('defaults to the system preference', () => {
    expect(create().preference()).toBe('system');
  });

  it('applies and persists an explicit dark theme', () => {
    const store = create();
    store.setPreference('dark');
    TestBed.tick();

    expect(store.resolved()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('removes the dark class when switching back to light', () => {
    const store = create();
    store.setPreference('dark');
    TestBed.tick();
    store.setPreference('light');
    TestBed.tick();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('ignores corrupted stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(create().preference()).toBe('system');
  });
});
