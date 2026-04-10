import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativePlatform = () => Capacitor.isNativePlatform();

export async function initializeCapacitor() {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setBackgroundColor({ color: '#1A237E' });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn('StatusBar setup failed:', e);
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn('SplashScreen hide failed:', e);
  }
}
