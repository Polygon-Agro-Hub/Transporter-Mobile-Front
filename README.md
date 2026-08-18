# GoVi Transport — Driver Mobile Client

Welcome to the mobile application for **GoVi Transport**, a cross-platform mobile client designed for delivery drivers. This app manages transport journeys, order scanning, proof of delivery (POD) signature capturing, cash handover validations, and user profile management.

Developed and maintained by **Polygon Holdings Private Limited**.

---

## 🚀 Features

*   **Secure Authentication**: Driver login utilizing `empId` and password, token persistence with AsyncStorage, and background driver status verification.
*   **Driver Banishment Checks**: Background worker running every 15 seconds to fetch status, automatically logging out and redirecting drivers if status is changed to `Rejected`, `Not Approved`, or `Pending`.
*   **Order Scanning & Collection**: Scan order QR codes or enter invoice numbers to associate orders to the driver's task list.
*   **Logistics Workflow & Journeys**:
    *   Start, pause, hold, return, and complete delivery journeys.
    *   Transition order groups to `On the way` with validations preventing multiple active journeys.
*   **Proof of Delivery (POD)**: Interactive canvas for capturing digital signatures, uploaded directly to Cloudflare R2 object storage.
*   **Cash Handover Verification**: Reconciliation of Cash-on-Delivery (COD) collections by scanning a Distribution Centre Manager (DCM) QR code.
*   **Multi-language Support**: Comprehensive translation support for English, Sinhala, and Tamil.
*   **Complaints Logging**: Raise and track complaints about specific orders.

---

## 🛠️ Technology Stack

*   **Framework**: Expo SDK 54 / React Native (v0.81.5) with TypeScript
*   **State Management**: Redux Toolkit (auth slices, profile status)
*   **Navigation**: React Navigation (Stack Navigator) and Expo Router
*   **Styling**: TailwindCSS via NativeWind (v4)
*   **Networking**: Axios with request/response interceptors for token handling
*   **Hardware Integrations**:
    *   `expo-camera` (for QR/Barcode scanning)
    *   `react-native-signature-canvas` (for digital signatures)
    *   `expo-location` (for tracking driver location)

---

## 📁 Project Structure

```
Transporter-Mobile-Front/
├── .expo/                # Expo development build files
├── app/                  # App screens & Expo Router configurations
├── assets/               # Local images, icons, and assets
├── component/            # React Native components
│   ├── common/           # Reusable components (Splash, custom buttons)
│   ├── orders/           # Order lists, details, hold & return views
│   ├── qr/               # QR scanning views (Assign, Cash Handover, Returns)
│   └── ...
├── environment/          # API Base URL and environment configurations
├── services/             # API request handlers and Axios configuration
├── store/                # Redux store configurations and slices
├── utils/                # Helper utilities and translation assets
├── app.json              # Expo application manifest
├── eas.json              # Expo Application Services configuration
├── package.json          # Dependency manifest
└── tsconfig.json         # TypeScript compiler configurations
```

---

## ⚙️ Getting Started

### 1. Pre-requisites
Ensure you have the following installed on your developer machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Expo Go](https://expo.dev/client) app installed on your physical mobile device, or configured Android Emulator / iOS Simulator.

### 2. Installation
Clone the repository, navigate to the directory, and install the dependencies:
```bash
npm install
```

### 3. API Base URL Configuration
Open [environment/environment.ts](environment/environment.ts) and configure the `API_BASE_URL` property to point to your running backend service:
```typescript
export const environment = {
  production: false,
  API_BASE_URL: "http://<YOUR_BACKEND_IP>:3000/transporter/"
};
```
*Note: If testing on a physical device, use your machine's local IP address instead of `localhost`.*

### 4. Running the Development Server
Start the Metro bundler server:
```bash
npm run start
```
Once the server starts:
*   Press **`a`** to open the app on an Android Emulator.
*   Press **`i`** to open the app on an iOS Simulator.
*   Scan the QR code displayed in the terminal using the Expo Go app on a physical device.

---

## 📦 Deployment & Building

### 1. EAS Build (Cloud Build)
Make sure you have EAS CLI installed and are logged in:
```bash
npm install -g eas-cli
eas login
```

#### 📦 Build AAB (Android App Bundle for Google Play Store)
Generates an `.aab` file required for uploading/updating on Google Play Console:
```bash
eas build --platform android --profile production
```

#### 📱 Build APK (Android Package for Direct Installation / Testing)
Generates an `.apk` file for direct installation on physical Android devices for testing:
```bash
eas build --platform android --profile preview
```

---

### 2. Local Gradle Build (On Your Machine)

#### 📦 Build AAB Locally
```bash
npx expo prebuild --platform android
cd android
./gradlew bundleRelease
```
*Output path*: `android/app/build/outputs/bundle/release/app-release.aab`

#### 📱 Build APK Locally
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
*Output path*: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 **Polygon Holdings Private Limited**.
