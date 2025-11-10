
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser: string;
  screenResolution: string;
  userAgent: string;
  timestamp: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Determine device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent);
  
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }

  // Determine platform
  let platform = 'Unknown';
  if (userAgent.includes('Windows')) platform = 'Windows';
  else if (userAgent.includes('Mac')) platform = 'macOS';
  else if (userAgent.includes('Linux')) platform = 'Linux';
  else if (userAgent.includes('Android')) platform = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';

  // Determine browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Get screen resolution
  const screenResolution = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '';

  return {
    type: deviceType,
    platform,
    browser,
    screenResolution,
    userAgent,
    timestamp: new Date().toISOString()
  };
};
