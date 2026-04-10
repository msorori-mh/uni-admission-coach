import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './capacitor';

const ACCESS_TOKEN_KEY = 'sb_access_token';
const REFRESH_TOKEN_KEY = 'sb_refresh_token';

/**
 * Save session tokens to native device storage (Capacitor Preferences).
 * On web this is a no-op — Supabase already handles localStorage.
 */
export async function saveNativeSession(accessToken: string, refreshToken: string) {
  if (!isNativePlatform()) return;
  await Preferences.set({ key: ACCESS_TOKEN_KEY, value: accessToken });
  await Preferences.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
}

/**
 * Read stored session tokens from native storage.
 * Returns null if not on native or no tokens found.
 */
export async function getNativeSession(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!isNativePlatform()) return null;
  const { value: accessToken } = await Preferences.get({ key: ACCESS_TOKEN_KEY });
  const { value: refreshToken } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
  if (accessToken && refreshToken) {
    return { accessToken, refreshToken };
  }
  return null;
}

/**
 * Clear stored session tokens (on sign-out or token invalidation).
 */
export async function clearNativeSession() {
  if (!isNativePlatform()) return;
  await Preferences.remove({ key: ACCESS_TOKEN_KEY });
  await Preferences.remove({ key: REFRESH_TOKEN_KEY });
}
