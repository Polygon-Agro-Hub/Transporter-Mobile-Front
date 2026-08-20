import AsyncStorage from '@react-native-async-storage/async-storage';

const SCAN_STORAGE_KEY = '@order_qr_scans';

export const clearCompletedScans = async (orderIds?: number[]) => {
  try {
    if (!orderIds) {
      // Clear all scans
      await AsyncStorage.removeItem(SCAN_STORAGE_KEY);
      return;
    }
    
    // Clear specific order scans
    const storedScans = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
    if (storedScans) {
      const allScans: Array<{orderId: number; invNo: string; scannedAt: string}> = JSON.parse(storedScans);
      const remainingScans = allScans.filter(
        scan => !orderIds.includes(scan.orderId)
      );
      await AsyncStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(remainingScans));
    }
  } catch (error) {
    console.error("Error clearing scans:", error);
  }
};

export const getCompletedScans = async (): Promise<number[]> => {
  try {
    const storedScans = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
    if (storedScans) {
      const allScans: Array<{orderId: number}> = JSON.parse(storedScans);
      return allScans.map(scan => scan.orderId);
    }
    return [];
  } catch (error) {
    console.error("Error getting scans:", error);
    return [];
  }
};