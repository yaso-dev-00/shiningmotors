"use client";

import { useEffect } from 'react';

const PwaRegister = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );

        if (process.env.NODE_ENV !== 'production') {
          console.info('[PWA] Service worker registered', registration);
        }
      } catch (error) {
        console.error('[PWA] Service worker registration failed', error);
      }
    };

    register();
  }, []);

  return null;
};

export default PwaRegister;





