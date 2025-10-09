# PRTG API v2 Datasource Configuration Guide

## Issue Fixed: "Cannot read properties of undefined (reading 'apiKey')"

### Root Cause
The error occurred when the `decryptedSecureJsonData` property was undefined during datasource initialization. This typically happens when:
1. The datasource is first being configured (before any API key is saved)
2. The secure fields haven't been loaded yet
3. The datasource configuration is incomplete

### Fixes Applied

#### 1. Datasource Constructor (src/datasource.ts)
**Before:**
```typescript
const { apiKey = '' } = (instanceSettings as any).decryptedSecureJsonData as PRTGSecureJsonData;
```

**After:**
```typescript
const secureJsonData = (instanceSettings as any).decryptedSecureJsonData || {};
const apiKey = (secureJsonData as PRTGSecureJsonData)?.apiKey || '';
```

This ensures we safely handle undefined `decryptedSecureJsonData` by providing an empty object as a fallback.

#### 2. API Client Validation (src/api.ts)
Added validation in the constructor to warn about missing configuration:
```typescript
if (!options.url) {
  console.warn('PRTG API: URL is not configured');
}
if (!this.apiKey) {
  console.warn('PRTG API: API Key is not configured');
}
```

#### 3. Connection Test Validation (src/api.ts)
Added validation before attempting API calls:
```typescript
if (!this.apiKey) {
  throw new Error('API Key is not configured. Please configure the API Key in the datasource settings.');
}

if (!this.baseUrl || this.baseUrl.includes('undefined')) {
  throw new Error('Server URL is not configured. Please configure the PRTG server URL in the datasource settings.');
}
```

#### 4. Improved Error Messages
Updated error handling throughout to provide more helpful error messages that guide users to the correct configuration.

## How to Configure the Datasource

### Step 1: Add the Datasource
1. In Grafana, go to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Search for and select **PRTG API v2**

### Step 2: Configure Connection Settings
Fill in the following fields:

- **PRTG Server URL**: The base URL of your PRTG server
  - Example: `https://monitoring.prtg.server`
  - Do NOT include the port number in the URL
  
- **Port**: The API v2 port (default: 1616)
  - Default: `1616`
  - This is the port where PRTG API v2 is running

- **API Key**: Your PRTG API authentication key
  - This is a secure field (encrypted at rest)
  - Generate this from PRTG: Setup → Account Settings → API Keys
  - Recommended: Create a read-only API key

- **Allow insecure SSL**: Check this only if using self-signed certificates
  - Leave unchecked for production environments
  - Only enable for testing/development

### Step 3: Test the Connection
1. Click **Save & Test**
2. You should see: "Successfully connected to PRTG API v2"

### Troubleshooting

#### Error: "API Key is not configured"
- Ensure you've entered an API key in the secure field
- Click the reset button next to API Key if it shows as configured but doesn't work
- Re-enter the API key and save

#### Error: "Server URL is not configured"
- Make sure the PRTG Server URL field is filled in
- Do not include port numbers or trailing slashes
- Format: `https://your-server` or `http://your-server`

#### Error: "Connection test failed"
- Verify the PRTG server is accessible from Grafana
- Check that PRTG API v2 is enabled on the server
- Verify the port number (default 1616)
- Check firewall rules between Grafana and PRTG
- Validate the API key is active and has read permissions

#### Error: Network/SSL Issues
- If using self-signed certificates, enable "Allow insecure SSL"
- Verify the URL scheme (http vs https)
- Check that the PRTG server's certificate is trusted by the Grafana server

## PRTG API v2 Documentation
Visit your PRTG server's API documentation at:
```
https://your-prtg-server:1616/api/v2/oas/
```

This provides the full OpenAPI specification for the PRTG API v2.

## Additional Notes

### Secure Field Handling
- API keys are stored encrypted in Grafana's database
- Once saved, the actual key value is not visible in the UI
- To change the key, click the "Reset" button and enter a new value

### First-Time Setup
- The error may appear briefly during initial configuration
- This is normal - complete the configuration and save
- The error will resolve once all required fields are filled

### Multiple Datasources
- You can configure multiple PRTG datasources
- Each can point to different PRTG servers
- Each requires its own API key
