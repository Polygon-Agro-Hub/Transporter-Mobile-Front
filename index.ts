import "./global.css";
import { registerRootComponent } from 'expo';
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

// Map the className prop to the style prop for expo-linear-gradient
cssInterop(LinearGradient, {
  className: "style",
});

import App from './app/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

