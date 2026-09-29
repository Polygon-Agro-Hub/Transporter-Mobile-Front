import type { Socket } from "socket.io-client";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use standalone pre-bundled distribution to prevent Metro bundler ESM / engine.io-client resolution errors in React Native
const io = require("socket.io-client/dist/socket.io.js");

export interface LoadDeliveredData {
  transferCode: string;
  loadCode?: string;
  unloadOfficerId?: number;
  unloadTime?: string;
  status: string;
  deliveredAt?: string;
  [key: string]: any;
}

export interface AccountStatusData {
  status: string;
  statusType?: string;
  message?: string;
  [key: string]: any;
}

type LoadDeliveredCallback = (data: LoadDeliveredData) => void;
type AccountStatusCallback = (data: AccountStatusData) => void;

class SocketService {
  private socket: Socket | null = null;
  private loadDeliveredListeners: Set<LoadDeliveredCallback> = new Set();
  private accountStatusListeners: Set<AccountStatusCallback> = new Set();
  private isConnecting: boolean = false;
  private activeLoadRooms: Set<string> = new Set();
  private currentUserId: number | null = null;
  private currentEmpId: string | null = null;

  /**
   * Connect to backend Socket.IO server with JWT authentication.
   */
  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    this.isConnecting = true;

    try {
      const token = (await AsyncStorage.getItem("token")) || "";
      const baseUrl = environment.API_BASE_URL || "http://localhost:3000/";
      const urlMatch = baseUrl.match(/^(https?:\/\/[^\/]+)/);
      const socketUrl = urlMatch ? urlMatch[1] : baseUrl;
      const socketPath = "/socket.io";

      console.log(`🔌 [SocketService] Connecting to: ${socketUrl} (path: ${socketPath})`);

      this.socket = io(socketUrl, {
        path: socketPath,
        transports: ["polling", "websocket"],
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        auth: {
          token: token || undefined,
        },
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      this.socket?.on("connect", () => {
        this.isConnecting = false;
        console.log(`✅ [SocketService] Connected! Socket ID: ${this.socket?.id}`);

        // Re-join any active load rooms
        this.activeLoadRooms.forEach((transferCode) => {
          this.socket?.emit("join_load", { transferCode });
          console.log(`📦 [SocketService] Re-joined load room: load_${transferCode}`);
        });

        this.syncUserRegistration();
      });

      this.socket?.on("load_delivered", (data: LoadDeliveredData) => {
        console.log("📢 [SocketService] Received load_delivered:", data?.transferCode || data?.loadCode);
        this.loadDeliveredListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.error("[SocketService] Load delivered listener error:", e);
          }
        });
      });


      const handleAccountStatusChange = (data: AccountStatusData) => {
        console.log("📢 [SocketService] Received account status event:", data);
        this.accountStatusListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.error("[SocketService] Account status listener error:", e);
          }
        });
      };

      this.socket?.on("account_status_changed", handleAccountStatusChange);
      this.socket?.on("officer_status_changed", handleAccountStatusChange);
      this.socket?.on("user_status_changed", handleAccountStatusChange);
      this.socket?.on("force_logout", handleAccountStatusChange);
      this.socket?.on("officer_rejected", handleAccountStatusChange);

      this.socket?.on("connect_error", (err: any) => {
        this.isConnecting = false;
        console.warn("[SocketService] Connection error:", err?.message || err);
      });

      this.socket?.on("disconnect", (reason: any) => {
        this.isConnecting = false;
        console.log(`🔌 [SocketService] Disconnected: ${reason}`);
      });

      return this.socket;
    } catch (e) {
      this.isConnecting = false;
      console.error("[SocketService] Failed to initialize socket:", e);
      return null;
    }
  }

  /**
   * Join real-time room for a specific load / transfer code
   */
  async joinLoadRoom(transferCode: string) {
    if (!transferCode) return;
    this.activeLoadRooms.add(transferCode);

    if (!this.socket?.connected) {
      await this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit("join_load", { transferCode });
      console.log(`📦 [SocketService] Joined load room: load_${transferCode}`);
    }
  }

  /**
   * Leave real-time room for a specific load / transfer code
   */
  leaveLoadRoom(transferCode: string) {
    if (!transferCode) return;
    this.activeLoadRooms.delete(transferCode);

    if (this.socket?.connected) {
      this.socket.emit("leave_load", { transferCode });
      console.log(`📦 [SocketService] Left load room: load_${transferCode}`);
    }
  }

  /**
   * Subscribe to load delivered events
   */
  onLoadDelivered(callback: LoadDeliveredCallback): () => void {
    this.loadDeliveredListeners.add(callback);
    return () => {
      this.loadDeliveredListeners.delete(callback);
    };
  }


  /**
   * Subscribe to account status changes (e.g. Banned / Rejected / Not Approved)
   */
  onAccountStatusChanged(callback: AccountStatusCallback): () => void {
    this.accountStatusListeners.add(callback);
    return () => {
      this.accountStatusListeners.delete(callback);
    };
  }

  /**
   * Register user with socket room upon login
   */
  async registerUser(userId?: number, empId?: string) {
    if (userId) this.currentUserId = userId;
    if (empId) this.currentEmpId = empId;
    if (!this.socket?.connected) {
      await this.connect();
    } else {
      this.syncUserRegistration();
    }
  }

  /**
   * Register driver by Employee ID
   */
  async registerEmpId(empId: string) {
    if (empId) this.currentEmpId = empId;
    if (!this.socket?.connected) {
      await this.connect();
    } else {
      this.syncUserRegistration();
    }
  }

  /**
   * Request status verification over the open WebSocket connection.
   * Lightweight frame that triggers DB status check without making REST/HTTP calls.
   */
  verifyStatus() {
    if (this.socket?.connected) {
      this.socket.emit("verify_status", {
        userId: this.currentUserId || undefined,
        empId: this.currentEmpId || undefined,
      });
    }
  }

  private async syncUserRegistration() {
    if (!this.socket?.connected) return;
    try {
      const token = (await AsyncStorage.getItem("token")) || "";
      const userProfileStr = await AsyncStorage.getItem("userProfile");
      const storedEmpId = await AsyncStorage.getItem("empid");
      let userId = this.currentUserId;
      let empId = this.currentEmpId || storedEmpId;

      if (!userId && userProfileStr) {
        try {
          const userProfile = JSON.parse(userProfileStr);
          userId = userProfile.id;
          if (!empId && userProfile.empId) {
            empId = userProfile.empId;
          }
        } catch (_) {}
      }

      if (userId || empId) {
        console.log(`👤 [SocketService] Registering user in socket room (userId: ${userId}, empId: ${empId})...`);
        if (userId) {
          this.socket.emit("join_user", userId);
          this.socket.emit("join_officer", userId);
        }
        if (empId) {
          this.socket.emit("join_user", empId);
          this.socket.emit("join_officer", empId);
        }
        this.socket.emit("register_user", {
          userId: userId ? Number(userId) : undefined,
          empId: empId || undefined,
          token: token || undefined,
        });
      }
    } catch (e) {
      console.warn("[SocketService] Sync user error:", e);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.activeLoadRooms.clear();
    this.currentUserId = null;
  }
}

export default new SocketService();
