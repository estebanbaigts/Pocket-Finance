import { readPreference, writePreference } from './preferences'

export type ThemeChoice = 'system' | 'light' | 'dark'

/** Thème propre à l'appareil : `data-theme` sur <html>, « système » suit prefers-color-scheme. */
export function applyTheme(choice: ThemeChoice): void {
  if (choice === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', choice)
  writePreference('theme', choice)
}

export function storedTheme(): ThemeChoice {
  const value = readPreference('theme')
  return value === 'light' || value === 'dark' ? value : 'system'
}
