import { GOOGLE_CONFIG, getGoogleRedirectUri, logGoogleConfig, validateGoogleConfig } from '@/config/google';

export interface Profile {
  name: string;
  url: string;
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private accessToken: string | null = null;
  private readonly SHEET_ID = GOOGLE_CONFIG.SHEET_ID;
  private readonly CLIENT_ID = GOOGLE_CONFIG.CLIENT_ID;
  private readonly CLIENT_SECRET = GOOGLE_CONFIG.CLIENT_SECRET;
  private readonly SCOPES = GOOGLE_CONFIG.SCOPES;

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      // Validate configuration before creating instance
      if (!validateGoogleConfig()) {
        throw new Error('Google API configuration is incomplete. Please check your .env file.');
      }
      
      GoogleSheetsService.instance = new GoogleSheetsService();
      // Configuration logging
      logGoogleConfig();
    }
    return GoogleSheetsService.instance;
  }

  // Check if user is authenticated
  isUserAuthenticated(): boolean {
    const token = localStorage.getItem('google_sheets_access_token');
    if (token) {
      this.accessToken = token;
      return true;
    }
    return false;
  }

  // Get the sheet ID for external use
  getSheetId(): string {
    return this.SHEET_ID;
  }

  // Logout and clear access token
  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('google_sheets_access_token');
  }

  // Get authorization URL for user to authenticate
  getAuthUrl(): string {
    const redirectUri = getGoogleRedirectUri();
    
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: redirectUri,
      scope: this.SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  // Handle OAuth callback and get access token
  async handleAuthCallback(code: string): Promise<void> {
    try {
      const redirectUri = getGoogleRedirectUri();
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      
      // Store token in localStorage
      localStorage.setItem('google_sheets_access_token', this.accessToken);
      
    } catch (error) {
      throw new Error('Failed to authenticate with Google Sheets');
    }
  }

  // Write profiles to Google Sheets
  async writeProfilesToSheet(profiles: Profile[]): Promise<void> {
    if (!this.accessToken) {
      throw new Error('User not authenticated. Please authenticate first.');
    }

    try {
      // Prepare data for Google Sheets
      const values = [
        ['Name', 'LinkedIn URL'], // Header row
        ...profiles.map(profile => [profile.name, profile.url])
      ];

      // Clear existing data
      await this.clearSheetData();
      
      // Write new data
      await this.updateSheetData(values);

    } catch (error) {
      throw new Error('Failed to write data to Google Sheets');
    }
  }

  // Clear existing sheet data
  private async clearSheetData(): Promise<void> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/A:Z:clear`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to clear sheet data');
    }
  }

  // Update sheet with new data
  private async updateSheetData(values: string[][]): Promise<void> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update sheet data');
    }
  }

  // Get current sheet data
  async getSheetData(): Promise<any[][]> {
    if (!this.accessToken) {
      throw new Error('User not authenticated. Please authenticate first.');
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/A:Z`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to read sheet data');
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      throw new Error('Failed to read data from Google Sheets');
    }
  }
}

export default GoogleSheetsService; 