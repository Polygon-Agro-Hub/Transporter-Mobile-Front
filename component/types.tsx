export type RootStackParamList = {
  Main: { screen: keyof RootStackParamList; params?: any };
  Home: undefined;
  Lanuage: undefined;
  Splash: undefined;
  Login: undefined;
  ChangePassword: { passwordUpdated: number };
  Profile: undefined;
  Jobs:undefined;
  OrderDetails:undefined
};
