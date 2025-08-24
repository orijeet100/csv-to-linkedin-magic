# Deployment Guide - Netlify

This guide explains how to deploy your CSV Profile Extractor app to Netlify while maintaining Google Sheets integration.

## 🚀 Prerequisites

1. **Netlify Account** - Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository** - Your code should be in a Git repository
3. **Google Cloud Project** - With OAuth 2.0 credentials configured

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your repository has:
- ✅ `netlify.toml` configuration file
- ✅ All environment variables removed from code
- ✅ `.env` file in `.gitignore`
- ✅ Production-ready build scripts

### 2. Deploy to Netlify

#### **Option A: Connect to Git (Recommended)**
1. **Login to Netlify** and click "New site from Git"
2. **Choose your Git provider** (GitHub, GitLab, etc.)
3. **Select your repository** containing the CSV Profile Extractor
4. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (or higher)
5. **Click "Deploy site"**

#### **Option B: Manual Deploy**
1. **Build locally**: `npm run build`
2. **Drag and drop** the `dist` folder to Netlify

### 3. Configure Environment Variables

#### **In Netlify Dashboard:**
1. Go to **Site settings** → **Environment variables**
2. Add these variables:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
   VITE_GOOGLE_SHEET_ID=your_google_sheet_id
   VITE_GOOGLE_PROJECT_ID=your_google_project_id
   ```
3. **Redeploy** your site after adding variables

### 4. Update Google Cloud Console

#### **OAuth 2.0 Redirect URIs:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. **Edit your OAuth 2.0 Client ID**
4. **Add authorized redirect URIs**:
   ```
   https://your-app-name.netlify.app/
   https://your-custom-domain.com/ (if applicable)
   ```
5. **Save changes**

### 5. Test Your Deployment

1. **Visit your Netlify URL**
2. **Test CSV upload** functionality
3. **Test Google Sheets export** (OAuth flow)
4. **Verify all features** work as expected

## 🔧 Configuration Files

### **netlify.toml**
- **Build settings** for production deployment
- **Redirect rules** for React Router
- **Security headers** for production safety
- **Environment-specific** configurations

### **Environment Variables**
- **Never commit** sensitive data to Git
- **Use Netlify's** environment variable system
- **Keep credentials** secure and private

## 🌐 Custom Domain (Optional)

1. **Purchase domain** from your preferred registrar
2. **Add custom domain** in Netlify dashboard
3. **Update Google Cloud Console** with new redirect URI
4. **Configure DNS** as instructed by Netlify

## 🔒 Security Considerations

### **Production Security:**
- ✅ **HTTPS enforced** by Netlify
- ✅ **Security headers** configured
- ✅ **CSP policies** for Google APIs
- ✅ **Environment variables** secured

### **OAuth Security:**
- ✅ **Redirect URIs** restricted to your domain
- ✅ **Client secrets** stored securely
- ✅ **Scopes limited** to necessary permissions

## 🚨 Common Issues & Solutions

### **Build Failures:**
- **Check Node version** (use Node 18+)
- **Verify dependencies** are in package.json
- **Check build logs** for specific errors

### **OAuth Errors:**
- **Verify redirect URIs** in Google Cloud Console
- **Check environment variables** in Netlify
- **Ensure HTTPS** is used in production

### **CORS Issues:**
- **Verify Google API** endpoints are accessible
- **Check Content Security Policy** headers
- **Ensure proper** OAuth flow configuration

## 📱 Post-Deployment

### **Monitor Your App:**
- **Check Netlify analytics** for performance
- **Monitor Google API** usage and quotas
- **Test functionality** regularly

### **Updates:**
- **Push changes** to your Git repository
- **Netlify auto-deploys** on new commits
- **Test thoroughly** after each deployment

## 🎯 Success Checklist

- [ ] **App deployed** to Netlify successfully
- [ ] **Environment variables** configured
- [ ] **Google Cloud Console** updated
- [ ] **OAuth flow** working in production
- [ ] **CSV upload** functioning properly
- [ ] **Google Sheets export** working
- [ ] **Custom domain** configured (if applicable)
- [ ] **Security headers** in place
- [ ] **All features** tested and working

## 🆘 Support

If you encounter issues:
1. **Check Netlify build logs** for errors
2. **Verify environment variables** are set correctly
3. **Test OAuth flow** step by step
4. **Check Google Cloud Console** configuration
5. **Review browser console** for client-side errors

Your app should now be accessible to everyone on the internet! 🌍 