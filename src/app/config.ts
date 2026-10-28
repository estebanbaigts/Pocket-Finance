/** Nom de l'application, configurable via VITE_APP_NAME (voir .env.example). */
export const APP_NAME = (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() || 'Pocket'
