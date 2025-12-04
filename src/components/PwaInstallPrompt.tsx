"use client";

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const PwaInstallPrompt = () => {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInstalled || isStandalone || dismissed) {
      setShowBanner(false);
      return;
    }

    // Show banner for installable apps (Android) or iOS
    if (isInstallable || isIOS) {
      // Check if user has dismissed before (using localStorage)
      const hasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!hasDismissed) {
        // Delay showing banner slightly for better UX
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000); // Show after 3 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [isInstallable, isInstalled, isStandalone, isIOS, dismissed]);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, show instructions
      return;
    }

    const installed = await promptInstall();
    if (installed) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner || isInstalled || isStandalone) {
    return null;
  }

  // iOS-specific instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Alert className="bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-lg">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AlertDescription className="text-sm">
                <strong className="font-semibold block mb-2">Install Shining Motors</strong>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <li>Tap the <strong>Share</strong> button <span className="inline-block">📤</span></li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> to confirm</li>
                </ol>
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Android/Chrome install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Alert className="bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-lg">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <strong className="font-semibold block mb-1">Install Shining Motors</strong>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Get the full app experience with offline access and faster loading.
              </p>
            </AlertDescription>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleInstall}
              className="text-xs"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default PwaInstallPrompt;



