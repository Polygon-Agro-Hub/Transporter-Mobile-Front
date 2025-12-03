export type RootStackParamList = {
  Main: { screen: keyof RootStackParamList; params?: any };
  Home: undefined;
  Lanuage: undefined;
  Splash: undefined;
  ComplaintsList:undefined;
  AddComplaint:undefined
  Login: undefined;
  ChangePassword: { passwordUpdated: number };
  Profile: undefined;
  ReturnOrders:undefined;
  QRScan:undefined;
};
