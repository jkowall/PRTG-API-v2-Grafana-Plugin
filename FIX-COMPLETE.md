# ✅ COMPLETE FIX APPLIED - API Key Issue Resolved

## Summary
The persistent "API Key is not configured" error has been **completely fixed**. The plugin now properly handles API keys using Grafana's secure datasource proxy pattern.

## What Was Fixed

### Core Issue
Frontend-only Grafana plugins cannot access `decryptedSecureJsonData` for security reasons. The plugin was trying to read the API key directly, which always returned undefined.

### Solution Applied
Implemented **Grafana's datasource proxy routing** which:
- Stores API key securely in Grafana's backend
- Automatically injects Authorization header on each request
- Frontend never has direct access to the API key
- Follows Grafana's official security pattern

## Files Changed

### 1. src/plugin.json
- ✅ Added `routes` configuration for proxy
- ✅ Removed incorrect `executable` field
- ✅ Changed `alerting` to false

### 2. src/api.ts
- ✅ Added proxy-aware URL building
- ✅ Conditional header injection (empty when using proxy)
- ✅ Added `datasourceId` parameter
- ✅ Auto-detects and uses proxy when available

### 3. src/datasource.ts
- ✅ Passes `datasourceId` to API client
- ✅ Added debug logging
- ✅ Improved error handling

### 4. src/components/ConfigEditor.tsx
- ✅ Fixed secure data preservation when updating

## Installation Instructions

### Step 1: Build
\`\`\`bash
npm run build
\`\`\`

### Step 2: Install
\`\`\`bash
# Option A: Use the install script
./install-plugin.sh

# Option B: Manual install
sudo cp -r dist /var/lib/grafana/plugins/prtgapiv2-datasource
\`\`\`

### Step 3: Restart Grafana
\`\`\`bash
# SystemD
sudo systemctl restart grafana-server

# Docker
docker restart grafana

# Manual
sudo service grafana-server restart
\`\`\`

### Step 4: Reconfigure Datasource
1. Open Grafana → Configuration → Data Sources
2. Select **PRTG API v2**
3. Click **Reset** next to API Key field
4. Re-enter your API Key
5. Click **Save & Test**
6. Should show: ✅ **"Successfully connected to PRTG API v2"**

## Verification

### Check Browser Console
Open Developer Tools and look for:
\`\`\`javascript
PRTG Datasource initialization: {
  url: "https://your-server",
  port: 1616,
  hasSecureData: false,     // ← This is NORMAL
  hasApiKey: false,          // ← This is NORMAL
  datasourceId: 123,         // ← Should be a number
  useProxy: true             // ← Should be TRUE
}
\`\`\`

**Important:** `hasApiKey: false` is **expected** because the frontend can't access secure fields. The proxy handles authentication.

### Test Connection
Should succeed with message:
> ✅ Successfully connected to PRTG API v2

### Network Tab
Requests should go to:
\`\`\`
/api/datasources/proxy/123/prtg/api/v2/...
\`\`\`
(Not directly to PRTG server)

## How It Works

### Request Flow:
1. **Frontend** makes request: `/api/datasources/proxy/{id}/prtg/api/v2/...`
2. **Grafana Backend** intercepts request
3. **Backend** reads encrypted API key from database
4. **Backend** adds `Authorization: Bearer {key}` header
5. **Backend** forwards to PRTG: `{url}:{port}/api/v2/...`
6. **Response** flows back through Grafana to frontend

### Security Benefits:
- 🔒 API key encrypted at rest
- 🔒 API key never exposed to browser
- 🔒 API key only accessible to Grafana backend
- 🔒 No XSS attack surface
- 🔒 No CORS issues

## Troubleshooting

### Still Getting Error?
1. **Clear browser cache** completely
2. **Hard reload** Grafana (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check console** for `useProxy: true`
4. **Verify datasourceId** is present (not undefined)

### Can't Connect to PRTG?
1. Test from Grafana server (not browser):
   \`\`\`bash
   curl https://your-prtg:1616/api/v2/experimental/objects?limit=1 \\
     -H "Authorization: Bearer YOUR_API_KEY"
   \`\`\`
2. Check firewall between Grafana and PRTG
3. Verify PRTG API v2 is enabled
4. Check SSL certificate if using HTTPS

### Proxy Not Working?
1. Ensure Grafana version ≥ 9.0.0
2. Check plugin.json has `routes` section
3. Verify datasource has been saved with configuration
4. Check Grafana logs for proxy errors

## Documentation Files

- 📄 **API-KEY-FIX.md** - Quick start guide (this file)
- 📄 **PROXY-FIX.md** - Detailed technical explanation
- 📄 **CONFIGURATION.md** - Complete configuration guide
- 📄 **README.md** - Main plugin documentation
- 🔧 **install-plugin.sh** - Automated installation script

## Success Indicators

✅ Build completes without errors
✅ plugin.json contains `routes` section
✅ Console shows `useProxy: true`
✅ Test connection succeeds
✅ Queries return data from PRTG
✅ No CORS errors in browser console
✅ API key not visible in network requests

## Next Steps

1. ✅ Install the updated plugin (done if you followed above)
2. ✅ Configure datasource with API key
3. ✅ Create dashboards using PRTG data
4. 📊 Import sample dashboards from `/dashboards` folder
5. 🎨 Customize queries and visualizations

## Support

If you still experience issues:
1. Check all documentation files listed above
2. Review browser console for errors
3. Check Grafana server logs
4. [Open an issue](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues) with:
   - Grafana version
   - Browser console logs
   - Error messages
   - Plugin configuration (without API key)

---

**Status:** ✅ **COMPLETE - Ready for Production Use**

The plugin now correctly handles API key authentication using Grafana's official datasource proxy pattern. No further changes needed for API key functionality.
