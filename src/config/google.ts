// Google API Configuration from environment variables
export const GOOGLE_CONFIG = {
  // OAuth2 Client ID from Google Cloud Console
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // OAuth2 Client Secret from Google Cloud Console
  CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  
  // Google Sheets Document ID
  SHEET_ID: import.meta.env.VITE_GOOGLE_SHEET_ID || '',
  
  // API Scopes
  SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
  
  // Google Cloud Project ID (for reference)
  PROJECT_ID: import.meta.env.VITE_GOOGLE_PROJECT_ID || ''
};

// Validate that all required environment variables are set
export const validateGoogleConfig = (): boolean => {
  const requiredVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_CLIENT_SECRET', 
    'VITE_GOOGLE_SHEET_ID',
    'VITE_GOOGLE_PROJECT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    return false;
  }
  
  return true;
};

// Environment-based configuration
export const getGoogleRedirectUri = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // For localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}/`;
  }
  
  // For production (Netlify, etc.)
  return `${window.location.origin}/`;
};

// Detect if we're in production
export const isProduction = (): boolean => {
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
};

// Get the appropriate OAuth scopes based on environment
export const getOAuthScopes = (): string[] => {
  return ['https://www.googleapis.com/auth/spreadsheets'];
};

// Configuration logging function
export const logGoogleConfig = (): void => {
  // Configuration logging removed for security
}; 