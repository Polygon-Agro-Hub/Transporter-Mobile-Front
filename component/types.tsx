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
  ReceivedCashQR: { amount: number; selectedCount: number };
  ReturnOrderQR: {
    invoiceNumber: string;
    orderId: number;
  };
  Jobs: undefined;
  OrderDetails: {
    processOrderIds: number[];
  };
  EndJourneyConfirmation: {
    processOrderIds: number[];
    allProcessOrderIds?: number[];
    remainingOrders?: number[];
    orderData?: any;
    onOrderComplete?: (completedId: number) => void;
  };
  SignatureScreen: {
    processOrderIds: number[];
    allProcessOrderIds?: number[];
    remainingOrders?: number[];
    onOrderComplete?: (completedId: number) => void;
  };
  HoldOrder: {
    orderIds: number[];
    allProcessOrderIds?: number[];
    remainingOrders?: number[];
    onOrderComplete?: (completedId: number) => void;
  };
  OrderReturn: {
    orderIds: number[];
    allProcessOrderIds?: number[];
    remainingOrders?: number[];
    onOrderComplete?: (completedId: number) => void;
  };
  DeliverySuccessful: undefined;
};
