import React, { useEffect } from "react";
import { Alert } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { RootState } from "@/services/store";
import { ROLES } from "@/constants/user-roles";
import { navigationRef } from "../../navigationRef";
import { RootStackParamList } from "@/types/types";

// --- Public / Common Screens ---
import Splash from "@/screens/common/splash/Splash";
import LoginScreen from "@/screens/common/auth/LoginScreen";
import ChangePassword from "@/screens/common/auth/ChangePassword";
import BannedScreen from "@/screens/common/auth/BannedScreen";
import ProfileScreen from "@/screens/common/auth/Profile";
import MyQRCode from "@/screens/common/auth/MyQRCode";
import CameraAccess from "@/screens/common/permission/CameraAccess";
import LocationAccess from "@/screens/common/permission/LocationAccess";
import MediaAccess from "@/screens/common/permission/MediaAccess";

// --- Light Weight Driver Screens ---
import LightDriverHome from "@/screens/light-weight/home/LightDriverHome";
import ComplaintsList from "@/screens/common/complaints/ComplaintsList";
import AddComplaint from "@/screens/common/complaints/AddComplaint";
import ReturnOrders from "@/screens/light-weight/orders/ReturnOrders";
import AssignOrderQR from "@/screens/light-weight/qr/AssignOrderQR";
import ReturnOrderQR from "@/screens/light-weight/qr/ReturnOrderQR";
import ReturnOrderOTPVerification from "@/screens/light-weight/orders/ReturnOrderOTPVerification";
import Jobs from "@/screens/light-weight/orders/Jobs";
import OrderDetails from "@/screens/light-weight/orders/OrderDetails";
import EndJourneyConfirmation from "@/screens/light-weight/orders/EndJourneyConfirmation";
import SignatureScreen from "@/screens/light-weight/orders/SignatureScreen";
import DeliverySuccessful from "@/screens/light-weight/orders/DeliverySuccessful";
import OrderReturn from "@/screens/light-weight/orders/OrderReturn";
import HoldOrder from "@/screens/light-weight/orders/HoldOrder";
import MyEarnings from "@/screens/common/auth/MyEarnings";
import CashHandOver from "@/screens/light-weight/receivedcash/CashHandOver";
import UploadBankTransferSlip from "@/screens/light-weight/receivedcash/UploadBankTransferSlip";
import BankTransferSlipStatus from "@/screens/light-weight/receivedcash/BankTransferSlipStatus";
import OrderDetailsLoadingScreen from "@/screens/light-weight/orders/OrderDetailsLoadingScreen";

// --- Heavy Weight Driver Screens ---
import HeavyDriverHome from "@/screens/heavy-weight/home/HeavyDriverHome";
import AssignLoadQR from "@/screens/heavy-weight/qr/AssignLoadQR";
import Loads from "@/screens/heavy-weight/loads/Loads";
import LoadSummary from "@/screens/heavy-weight/loads/LoadSummary";
import LoadQR from "@/screens/heavy-weight/loads/LoadQR";

const Stack = createStackNavigator<RootStackParamList>();

export type AllowedRole = typeof ROLES[keyof typeof ROLES] | "PUBLIC";

export interface StackRouteConfig {
  name: keyof RootStackParamList;
  component: React.ComponentType<any>;
  allowedRoles: AllowedRole[] | "PUBLIC";
  options?: any;
}

/**
 * Fallback route used when a signed-in user tries to reach a screen
 * their role isn't allowed to see and there's nowhere sensible to go back to.
 */
const UNAUTHORIZED_FALLBACK_ROUTE = "Login";

/**
 * Wraps a screen component with a role check. If the current jobRole
 * (from Redux) is not included in allowedRoles, the user sees an
 * "Access Denied" alert and gets bounced back / to the fallback route,
 * instead of the protected screen ever rendering.
 *
 * allowedRoles === "PUBLIC" means the screen is reachable regardless of
 * role (or with no role at all, e.g. pre-login screens).
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: AllowedRole[] | "PUBLIC"
) {
  function GuardedScreen(props: P & { navigation?: any }) {
    const jobRole = useSelector((state: RootState) => state.auth.jobRole);

    const isAllowed =
      allowedRoles === "PUBLIC" ||
      (!!jobRole && (allowedRoles as string[]).includes(jobRole));

    useEffect(() => {
      if (isAllowed) {
        return;
      }

      const navigation = (props as any)?.navigation;

      if (!jobRole) {
        if (navigationRef.isReady()) {
          const currentRoute = navigationRef.getCurrentRoute() as any;
          if (currentRoute?.name === "BannedScreen") {
            return;
          }
          navigationRef.reset({
            index: 0,
            routes: [{ name: UNAUTHORIZED_FALLBACK_ROUTE }],
          });
        }
        return;
      }

      Alert.alert(
        "Access Denied",
        "You don't have permission to view this screen.",
        [
          {
            text: "OK",
            onPress: () => {
              if (navigation?.canGoBack?.()) {
                navigation.goBack();
                return;
              }
              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ name: UNAUTHORIZED_FALLBACK_ROUTE }],
                });
              }
            },
          },
        ],
        { cancelable: false }
      );
    }, [isAllowed, jobRole]);

    if (!isAllowed) {
      return null;
    }

    return <Component {...(props as P)} />;
  }

  GuardedScreen.displayName = `withRoleGuard(${
    Component.displayName || Component.name || "Component"
  })`;

  return GuardedScreen;
}

// ============================================================================
// 1. PUBLIC ROUTES (Login, splash, onboarding & common utility screens)
// ============================================================================
export const PUBLIC_STACK_SCREENS: StackRouteConfig[] = [
  { name: "Splash", component: Splash, allowedRoles: "PUBLIC" },
  { name: "Login", component: LoginScreen, allowedRoles: "PUBLIC" },
  { name: "ChangePassword", component: ChangePassword, allowedRoles: "PUBLIC" },
  { name: "BannedScreen", component: BannedScreen as any, allowedRoles: "PUBLIC" },
  { name: "Profile", component: ProfileScreen, allowedRoles: "PUBLIC" },
  { name: "CameraAccess", component: CameraAccess as any, allowedRoles: "PUBLIC" },
  { name: "LocationAccess", component: LocationAccess as any, allowedRoles: "PUBLIC" },
  { name: "MediaAccess", component: MediaAccess as any, allowedRoles: "PUBLIC" },
];

// ============================================================================
// 2. SHARED DRIVER ROUTES (Accessible by both Light and Heavy Weight Drivers)
// ============================================================================
export const SHARED_DRIVER_STACK_SCREENS: StackRouteConfig[] = [
  {
    name: "ComplaintsList",
    component: ComplaintsList,
    allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER, ROLES.HEAVY_WEIGHT_DRIVER],
  },
  {
    name: "AddComplaint",
    component: AddComplaint,
    allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER, ROLES.HEAVY_WEIGHT_DRIVER],
  },
  {
    name: "MyQRCode",
    component: MyQRCode,
    allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER, ROLES.HEAVY_WEIGHT_DRIVER],
  },
];

// ============================================================================
// 3. LIGHT WEIGHT DRIVER ROUTES (Current operational routes)
// ============================================================================
export const LIGHT_WEIGHT_DRIVER_STACK_SCREENS: StackRouteConfig[] = [
  { name: "Home", component: LightDriverHome, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "Jobs", component: Jobs, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "OrderDetails", component: OrderDetails, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "OrderDetailsLoadingScreen", component: OrderDetailsLoadingScreen, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "ReturnOrders", component: ReturnOrders, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "AssignOrderQR", component: AssignOrderQR, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "ReturnOrderQR", component: ReturnOrderQR, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "ReturnOrderOTPVerification", component: ReturnOrderOTPVerification, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "EndJourneyConfirmation", component: EndJourneyConfirmation, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "SignatureScreen", component: SignatureScreen, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "DeliverySuccessful", component: DeliverySuccessful, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "OrderReturn", component: OrderReturn, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "HoldOrder", component: HoldOrder, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "MyEarnings", component: MyEarnings, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "CashHandOver", component: CashHandOver, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "UploadBankTransferSlip", component: UploadBankTransferSlip, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
  { name: "BankTransferSlipStatus", component: BankTransferSlipStatus, allowedRoles: [ROLES.LIGHT_WEIGHT_DRIVER] },
];

// ============================================================================
// 4. HEAVY WEIGHT DRIVER ROUTES (Reserved for Heavy Weight Driver screens)
// ============================================================================
export const HEAVY_WEIGHT_DRIVER_STACK_SCREENS: StackRouteConfig[] = [
  {
    name: "HeavyDriverHome",
    component: HeavyDriverHome,
    allowedRoles: [ROLES.HEAVY_WEIGHT_DRIVER],
  },
  {
    name: "AssignLoadQR",
    component: AssignLoadQR,
    allowedRoles: [ROLES.HEAVY_WEIGHT_DRIVER],
  },
  {
    name: "Loads",
    component: Loads,
    allowedRoles: [ROLES.HEAVY_WEIGHT_DRIVER],
  },
  {
    name: "LoadSummary",
    component: LoadSummary,
    allowedRoles: [ROLES.HEAVY_WEIGHT_DRIVER],
  },
  {
    name: "LoadQR",
    component: LoadQR,
    allowedRoles: [ROLES.HEAVY_WEIGHT_DRIVER],
  },
];

// ============================================================================
// COMBINED ROUTE CONFIGURATIONS
// ============================================================================
const STACK_SCREENS_CONFIG: StackRouteConfig[] = [
  ...PUBLIC_STACK_SCREENS,
  ...SHARED_DRIVER_STACK_SCREENS,
  ...LIGHT_WEIGHT_DRIVER_STACK_SCREENS,
  ...HEAVY_WEIGHT_DRIVER_STACK_SCREENS,
];

/**
 * Screen list with role guard applied to every component.
 */
const STACK_SCREENS: StackRouteConfig[] = STACK_SCREENS_CONFIG.map((screen) => ({
  ...screen,
  component: withRoleGuard(screen.component, screen.allowedRoles),
}));

/**
 * Root Stack.Navigator. App.tsx renders this inside its NavigationContainer.
 */
export function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {STACK_SCREENS.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Stack.Navigator>
  );
}

export default RootStackNavigator;
