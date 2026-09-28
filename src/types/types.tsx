export type RootStackParamList = {
  Main: { screen: keyof RootStackParamList; params?: any };
  Home: undefined;
  HeavyDriverHome: undefined;
  MyQRCode: undefined;
  CameraAccess?: {
    returnScreen?: keyof RootStackParamList;
  };
  LocationAccess?: {
    returnScreen?: keyof RootStackParamList;
    blockBackNavigation?: boolean;
  };
  MediaAccess?: {
    returnScreen?: keyof RootStackParamList;
  };
  Lanuage: undefined;
  Splash: undefined;
  ComplaintsList: undefined;
  DeliverySuccessful: undefined;
  AddComplaint: undefined;
  Login: undefined;
  ChangePassword: { passwordUpdated: number };
  BannedScreen: {
    status?: string;
    statusType?: string;
    message?: string;
  };
  Profile: undefined;
  ReturnOrders: undefined;
  AssignOrderQR: undefined;
  AssignLoadQR: undefined;
  ReturnOrderQR: {
    invoiceNumber: string;
    orderId: number;
  };
  ReturnOrderOTPVerification: {
    orderId: number;
    invoiceNumber: string;
    dcmEmpId: string;
    drvOrderId: number;
  };
  Jobs: undefined;
  Loads: undefined;
  LoadSummary: { loadCode?: string; mode?: "accept" | "journey" } | undefined;
  LoadQR: { loadCode?: string } | undefined;
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
  OrderDetailsLoadingScreen: {
    processOrderIds: number[];
    allProcessOrderIds: number[];
    remainingOrders: number[];
    orderData: any;
    onOrderComplete: (id: number) => void;
    latitude: string | null;
    longitude: string | null;
    address?: string;
  };
  MyEarnings:{
    
  };
  CashHandOver:{

  };
  UploadBankTransferSlip: {
    amount?: number;
  } | undefined;
  BankTransferSlipStatus:{
    
  }
};
