import environment from '@/environment/environment';

/**
 * App Update Configuration
 *
 * Automatically syncs with your active environment in src/environment/environment.ts:
 *   - LOCAL : http://<host-ip>:3000/transporter/api/app-version
 *   - DEV   : https://transporter-mobile-api.vercel.app/transporter/api/app-version
 *   - UAT   : https://transporter-mobile-api-uat.vercel.app/transporter/api/app-version
 *   - PROD  : https://transporter-mobile-api-prod.vercel.app/transporter/api/app-version
 */
export const APP_UPDATE_CONFIG = {
  /**
   * Dynamically resolved from your active environment (LOCAL, DEV, UAT, PROD).
   */
  get policyUrl(): string {
    const baseUrl = environment.API_BASE_URL.endsWith('/')
      ? environment.API_BASE_URL
      : `${environment.API_BASE_URL}/`;
    return `${baseUrl}api/app-version`;
  },

  /**
   * Android package name from app.json → expo.android.package
   */
  androidPackageName: 'com.polygonagro.Transporter',

  /**
   * iOS Bundle Identifier from app.json → expo.ios.bundleIdentifier
   */
  iosBundleIdentifier: 'com.polygonagro.Transporter',

  /**
   * iOS App Store numeric ID (from App Store Connect -> App Information -> Apple ID).
   * Example: '6739123456'.
   * When you publish to App Store Connect, paste your Apple ID number here.
   */
  iosAppStoreId: '',

  /**
   * Maximum milliseconds to wait for the version policy fetch.
   * If the server doesn't respond in time, the check silently fails.
   */
  timeoutMs: 5000,

  /**
   * How long a "Update Later" snooze lasts, in milliseconds.
   * Default: 24 hours. Set to 0 to only snooze until next app restart.
   */
  snoozeDurationMs: 24 * 60 * 60 * 1000,
};
