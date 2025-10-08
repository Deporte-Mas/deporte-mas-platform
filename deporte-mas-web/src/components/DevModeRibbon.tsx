import React from 'react';
import { Badge } from './ui/badge';

interface DevModeRibbonProps {
  className?: string;
}

export const DevModeRibbon: React.FC<DevModeRibbonProps> = ({ className = '' }) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  // Don't render anything in production mode
  if (!isDevMode) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 right-0 z-50 transform rotate-45 translate-x-12 translate-y-4 ${className}`}
      style={{ zIndex: 9999 }}
    >
      <Badge
        variant="destructive"
        className="px-8 py-1 shadow-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
      >
        TEST MODE
      </Badge>
    </div>
  );
};

// Alternative compact version for mobile or smaller spaces
export const DevModeIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  if (!isDevMode) {
    return null;
  }

  return (
    <div className={`fixed top-2 right-2 z-50 ${className}`}>
      <Badge
        variant="destructive"
        className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
      >
        TEST
      </Badge>
    </div>
  );
};

export default DevModeRibbon;