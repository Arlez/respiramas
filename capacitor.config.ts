import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.respiramas.app',
  appName: 'Respiramas',
  webDir: 'out',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#16a34a',
    },
  },
};

export default config;
