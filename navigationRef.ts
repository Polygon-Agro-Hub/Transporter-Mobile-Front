// navigationRef.ts
import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
