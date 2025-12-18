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
    processOrderIds?: number[]; 
    primaryProcessOrderId?: number; 
    marketOrderIds?: number[]; 
  };
  OrderDetailsAfterJourney: {
    orderIds: number[];
    processOrderIds?: number[];
    primaryProcessOrderId?: number; 
    marketOrderIds?: number[];
  };
  EndJourneyConfirmation: {
    orderIds: number[];
    processOrderIds?: number[]; 
    primaryProcessOrderId?: number; 
    marketOrderIds?: number[]; 
  };
  MyJourney: {
    orderIds: number[];
    processOrderIds?: number[]; 
    primaryProcessOrderId?: number; 
    marketOrderIds?: number[]; 
  };
  SignatureScreen: undefined;
  DeliverySuccessful: undefined;
};