# Google API Setup Guide

## Environment Variables Configuration

This application uses environment variables to securely store Google API credentials. Follow these steps to set up your configuration:

### 1. Create Environment File

Create a `.env` file in your project root directory with the following content:

```bash
# Google API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_SHEET_ID=your_google_sheet_id_here
VITE_GOOGLE_PROJECT_ID=your_google_project_id_here
```

### 2. Get Your Google API Credentials

#### **From Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`your-project-id`)
3. Go to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID
5. Copy the **Client ID** and **Client Secret**

#### From Google Sheets:
1. Open your Google Sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. The ID is the long string between `/d/` and `/edit`

### 3. Fill in Your Values

Replace the placeholder values in your `.env` file:

```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_SHEET_ID=your_google_sheet_id_here
VITE_GOOGLE_PROJECT_ID=your_google_project_id_here
```


### 4. Restart Your Development Server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

### 5. Verify Configuration

Check your browser console for the configuration log. You should see:

```
🔧 Google API Configuration:
  Project ID: your_project_id
  Client ID: your_client_id
  Sheet ID: your_sheet_id
  Redirect URI: http://localhost:8080/
  Scopes: ["https://www.googleapis.com/auth/spreadsheets"]
```

**Note:** The actual values will be masked for security in production.

## Security Notes

- **Never commit** your `.env` file to version control
- **Keep your client secret** secure and private
- **Use different credentials** for development and production
- **Rotate credentials** regularly for security

## Troubleshooting

### "Configuration Error" Message
- Check that your `.env` file exists in the project root
- Verify all required variables are set
- Restart your development server after changes

### "Missing Environment Variables" Console Error
- Ensure variable names start with `VITE_`
- Check for typos in variable names
- Verify the `.env` file is in the correct location

### OAuth Errors
- Ensure redirect URI in Google Cloud Console matches your app URL
- Check that your Google Cloud project is properly configured
- Verify OAuth consent screen settings 