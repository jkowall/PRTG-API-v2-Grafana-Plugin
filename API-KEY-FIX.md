# 🔧 API Key Fix - Quick Start

## The Problem
**Error:** "API Key is not configured" even after saving the API key in Grafana.

## The Solution
The plugin now uses **Grafana's datasource proxy** to securely handle API keys. This is the correct pattern for frontend Grafana plugins.

## Quick Fix Steps

### 1. Rebuild and Install
```bash
# Build the updated plugin
npm run build

# Install (choose one method):

# Method A: Using install script
./install-plugin.sh

# Method B: Manual installation
sudo cp -r dist /var/lib/grafana/plugins/prtgapiv2-datasource
sudo systemctl restart grafana-server
```

### 2. Reconfigure Datasource in Grafana
1. Go to **Configuration** → **Data Sources** → **PRTG API v2**
2. Click **Reset** button next to API Key field
3. Re-enter your **API Key**
4. Click **Save & Test**
5. Should now show: ✅ "Successfully connected to PRTG API v2"

### 3. Verify (Optional)
Open browser Developer Tools console and look for:
```javascript
PRTG Datasource initialization: {
  useProxy: true,      // ← Should be true
  datasourceId: 123    // ← Should have a number
}
```

## What Changed?

### Before (Broken):
- Frontend tried to access `decryptedSecureJsonData` directly
- Grafana blocks this for security
- API key was saved but never retrieved → Error

### After (Fixed):
- Requests routed through Grafana's proxy
- Grafana backend injects API key securely
- Frontend never sees the API key
- Everything works! ✅

## Key Files Modified
- ✅ `src/plugin.json` - Added proxy route configuration
- ✅ `src/api.ts` - Uses proxy when datasourceId available
- ✅ `src/datasource.ts` - Passes datasourceId to API client
- ✅ `src/components/ConfigEditor.tsx` - Fixed secure data handling

## Documentation
- **PROXY-FIX.md** - Detailed technical explanation
- **CONFIGURATION.md** - User configuration guide
- **install-plugin.sh** - Automated installation script

## Troubleshooting

### Still seeing the error?
1. Clear browser cache
2. Hard reload Grafana (Ctrl+Shift+R / Cmd+Shift+R)
3. Check browser console for `useProxy: true`
4. Verify datasource has an ID number

### Can't connect to PRTG?
1. Verify PRTG server accessible from Grafana server (not just your browser)
2. Test manually:
   ```bash
   curl https://your-prtg:1616/api/v2/experimental/objects?limit=1 \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
3. Check firewall rules between Grafana and PRTG

### Questions?
See **PROXY-FIX.md** for complete technical details.
