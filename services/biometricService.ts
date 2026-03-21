
import { supabase } from './supabaseClient';

export interface BiometricLog {
  id: number;
  deviceKey: string;
  deviceName: string;
  userId: string;
  userName: string;
  ioTime: string;
  ioMode: string;
  verifyMode: string;
  workCode: string;
}

export interface BiometricUser {
  userId: string;
  userName: string;
  cardNumber: string;
  password?: string;
  accessLevel: string;
}

class BiometricService {
  private baseUrl: string = '';
  private token: string | null = null;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized) return;
    if (!supabase) return;
    
    try {
      const { data } = await supabase.from('system_config').select('value').eq('key', 'biometric_api_config').maybeSingle();
      if (data?.value) {
        const config = data.value as any;
        this.baseUrl = config.baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
        if (config.username && config.password) {
          await this.login(config.username, config.password);
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.error("Biometric initialization failed:", e);
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : ''
    };
  }

  private async proxyFetch(url: string, options: any = {}) {
    const response = await fetch('/api/biometric-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method: options.method || 'GET',
        headers: options.headers || this.getHeaders(),
        body: options.body // Pass the object directly
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response;
  }

  async login(username: string, password: string) {
    if (!this.baseUrl) return;
    try {
      const response = await this.proxyFetch(`${this.baseUrl}/api/Auth/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { Username: username, Password: password }
      });
      const data = await response.json();
      if (data.Token) {
        this.token = data.Token;
      }
    } catch (e) {
      console.error("Biometric login failed:", e);
      throw e;
    }
  }

  async testConnection(deviceKey: string): Promise<boolean> {
    await this.initialize();
    if (!this.token || !this.baseUrl) return false;
    try {
      const response = await this.proxyFetch(`${this.baseUrl}/api/Device`);
      const devices = await response.json();
      return devices.some((d: any) => 
        d.DeviceKey === deviceKey || 
        d.SerialNumber === deviceKey || 
        String(d.Id) === deviceKey
      );
    } catch (e) {
      console.error("Test connection failed:", e);
      return false;
    }
  }

  async fetchLogs(deviceKey: string): Promise<BiometricLog[]> {
    await this.initialize();
    if (!this.token || !this.baseUrl) return [];
    try {
      // 1. Trigger fetch command on the cloud server
      // Use DeviceCommand (capitalized) to match uploadUser
      await this.proxyFetch(`${this.baseUrl}/api/DeviceCommand?commandType=FetchAllLogs`, {
        method: 'POST',
        body: [deviceKey]
      });

      // 2. Retrieve logs from the cloud database
      const today = new Date().toISOString().split('T')[0];
      const logsResponse = await this.proxyFetch(`${this.baseUrl}/api/DeviceLog/GetAllLogsByDate?FromDate=${today}&ToDate=${today}`);
      const logs = await logsResponse.json();
      return Array.isArray(logs) ? logs : [];
    } catch (e) {
      console.error("Fetch logs failed:", e);
      return [];
    }
  }

  async fetchUsersFromDevice(deviceKey: string): Promise<any[]> {
    await this.initialize();
    if (!this.token || !this.baseUrl) return [];
    try {
      const response = await this.proxyFetch(`${this.baseUrl}/api/Device/GetAllRegisteredUsers?deviceKey=${deviceKey}`);
      const users = await response.json();
      return Array.isArray(users) ? users : [];
    } catch (e) {
      console.error("Fetch users from device failed:", e);
      return [];
    }
  }

  async syncLogsToSupabase(logs: BiometricLog[]) {
    if (!supabase || !Array.isArray(logs) || logs.length === 0) return;
    
    const attendanceData = logs
      .filter(log => log && log.userId && log.ioTime) // Filter out invalid logs
      .map(log => ({
        student_id: log.userId,
        student_name: log.userName || 'Unknown User',
        class_name: 'Biometric Sync',
        status: 'present',
        date: log.ioTime.includes('T') ? log.ioTime.split('T')[0] : log.ioTime,
        updated_at: new Date().toISOString()
      }));

    if (attendanceData.length === 0) return;

    try {
      const { error } = await supabase.from('attendance_logs').upsert(attendanceData, { onConflict: 'student_id,date' });
      if (error) throw error;
    } catch (e) {
      console.error("Sync to Supabase failed:", e);
    }
  }

  async uploadUser(user: BiometricUser, deviceKey: string) {
    await this.initialize();
    if (!this.token || !this.baseUrl) return;
    try {
      await this.proxyFetch(`${this.baseUrl}/api/DeviceCommand/UploadUser`, {
        method: 'POST',
        body: [{
          UserId: user.userId,
          UserName: user.userName,
          CardNumber: user.cardNumber,
          Password: user.password || "",
          AccessLevel: user.accessLevel,
          DeviceKeys: [deviceKey],
          OnlineEnrollment: false,
          UploadBiometricDataIfAvailable: true,
          FingerPrintUpload: true,
          FaceUpload: true,
          CardUpload: true,
          PasswordUpload: true
        }]
      });
    } catch (e) {
      console.error("Upload user failed:", e);
      throw e;
    }
  }

  async deleteUserFromDevice(userId: string, deviceKey: string) {
    await this.initialize();
    if (!this.token || !this.baseUrl) return;
    try {
      // The error "The JSON value could not be converted to System.String[]" 
      // indicates the body must be an array of strings (device keys).
      // The user ID is likely expected in the query string.
      await this.proxyFetch(`${this.baseUrl}/api/DeviceCommand?commandType=DeleteUser&userIds=${userId}`, {
        method: 'POST',
        body: [deviceKey]
      });
    } catch (e) {
      console.error("Delete user failed:", e);
      throw e;
    }
  }
  async fetchCommands(deviceKey: string): Promise<any[]> {
    await this.initialize();
    if (!this.token || !this.baseUrl) return [];
    try {
      const response = await this.proxyFetch(`${this.baseUrl}/api/DeviceCommand/GetAllCommands?deviceKey=${deviceKey}`);
      const commands = await response.json();
      return Array.isArray(commands) ? commands : [];
    } catch (e) {
      console.error("Fetch commands failed:", e);
      return [];
    }
  }
}

export const biometricService = new BiometricService();
