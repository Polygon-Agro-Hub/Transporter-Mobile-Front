export type RootStackParamList = {
  Main: { screen: keyof RootStackParamList; params?: any };
  Home: undefined;
  Lanuage: undefined;
  Splash: undefined;
  ComplaintsList: undefined;
  AddComplaint: undefined;
  Login: undefined;
  ChangePassword: { passwordUpdated: number };
  Profile: undefined;
  ReturnOrders: undefined;
  AssignOrderQR: undefined;
    VerifyOrderQR: {
    invNo: string;
    orderId: number;
    allOrderIds: number[]; 
    totalToScan: number; 
  };
  Jobs: undefined;
  OrderDetails: {
    orderIds: number[];
  };
  OrderDetailsAfterJourney: {
    orderIds: number[];
  };
  EndJourneyConfirmation: {
    orderIds: number[];
  };
  MyJourney: {
    orderIds: number[];
  };
  SignatureScreen: undefined;
  DeliverySuccessful: undefined;
};
