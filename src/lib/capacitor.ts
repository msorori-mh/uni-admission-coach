import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { supabase } from '@/integrations/supabase/client';
import { saveNativeSession } from '@/lib/nativeSessionStorage';

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

  // Keyboard plugin — ensure it's loaded on native
  try {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-visible');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-visible');
    });
  } catch (e) {
    console.warn('Keyboard plugin setup failed:', e);
  }

  // Handle Android hardware back button — double-tap to exit
  let lastBackPress = 0;
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        App.exitApp();
      } else {
        lastBackPress = now;
        // Show a brief toast-like message via DOM
        const el = document.createElement('div');
        el.textContent = 'اضغط مرة أخرى للخروج';
        Object.assign(el.style, {
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '8px 20px',
          borderRadius: '20px', fontSize: '14px', zIndex: '99999',
          transition: 'opacity 0.3s', opacity: '1',
        });
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; }, 1500);
        setTimeout(() => { el.remove(); }, 1800);
      }
    }
  });

  // Listen for app resume — refresh session automatically
  App.addListener('resume', async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (refreshed) {
          await saveNativeSession(refreshed.access_token, refreshed.refresh_token);
        }
      }
    } catch (e) {
      console.warn('Session refresh on resume failed:', e);
    }
  });
}
