
export const HapticService = {
  /**
   * Basic selection feedback (light tap)
   */
  selection: () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  },
  
  /**
   * Light impact (navigation)
   */
  impactLight: () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  },
  
  /**
   * Medium impact (toggle change)
   */
  impactMedium: () => {
    if ('vibrate' in navigator) navigator.vibrate(25);
  },
  
  /**
   * Heavy impact (destructive or major action)
   */
  impactHeavy: () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
  },
  
  /**
   * Success notification (double tap)
   */
  notificationSuccess: () => {
    if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
  },
  
  /**
   * Error notification (staccato vibration)
   */
  notificationError: () => {
    if ('vibrate' in navigator) navigator.vibrate([50, 100, 50, 100]);
  },
  
  /**
   * Protocol complete (celebratory sequence)
   */
  protocolComplete: () => {
    if ('vibrate' in navigator) navigator.vibrate([20, 50, 20, 50, 100]);
  }
};
