export type RootStackParamList = {
  Main: { screen: keyof RootStackParamList; params?: any };
  Home: undefined;
  Lanuage: undefined;
  Splash: undefined;
  ComplaintsList: undefined;
    ReceivedCash: { scannedOfficerId?: string } | undefined;
  AddComplaint: undefined;
  Login: undefined;
  ChangePassword: { passwordUpdated: number };
  Profile: undefined;
  ReturnOrders: undefined;
  AssignOrderQR: undefined;
  ReceivedCashQR:{amount: number , selectedCount:number};
  VerifyOrderQR: {
    invNo: string;
    orderId: number;
    allOrderIds: number[]; 
    totalToScan: number;
  };
  ReturnOrderQR: {
    invoiceNumber: string;
    orderId: number;
  };
  Jobs: undefined;
  OrderDetails: {
    processOrderIds: number[];
  };
  OrderDetailsAfterJourney: {
    processOrderIds: number[];
  };
  EndJourneyConfirmation: {
    processOrderIds: number[]; 
  };
  SignatureScreen: {
    processOrderIds: number[];
  };
  DeliverySuccessful: undefined;
  OrderReturn:{
    orderIds: number[];
  };
  HoldOrder:{
    orderIds: number[];
  };
};
