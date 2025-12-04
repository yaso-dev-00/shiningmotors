"use client";

import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PwaInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showTooltip?: boolean;
}

export const PwaInstallButton = ({
  variant = 'outline',
  size = 'icon',
  className = '',
  showTooltip = true,
}: PwaInstallButtonProps) => {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall } = usePwaInstall();

  // Don't show if already installed or not installable
  if (isInstalled || isStandalone || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      // For iOS, show alert with instructions
      alert(
        'To install this app:\n\n' +
        '1. Tap the Share button 📤\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" to confirm'
      );
      return;
    }

    await promptInstall();
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      aria-label="Install app"
    >
      {isIOS ? (
        <Smartphone className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>Install App</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};



