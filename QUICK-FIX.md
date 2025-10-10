# 🚀 Quick Reference: API Key Fix

## Problem
```
❌ Failed to connect to PRTG API: API Key is not configured
```

## Solution
The plugin now uses Grafana's datasource proxy for secure API key handling.

## Fix in 3 Steps

### 1️⃣ Install Updated Plugin
```bash
npm run build
./install-plugin.sh
# OR manually: sudo cp -r dist /var/lib/grafana/plugins/prtgapiv2-datasource
```

### 2️⃣ Restart Grafana
```bash
sudo systemctl restart grafana-server
```

### 3️⃣ Reconfigure in Grafana UI
1. Configuration → Data Sources → PRTG API v2
2. Click **Reset** next to API Key
3. Re-enter API Key
4. Click **Save & Test**
5. ✅ Should succeed!

## Verify Fix

### Console Should Show:
```javascript
useProxy: true          // ← Must be true
datasourceId: 123       // ← Must have a number
hasApiKey: false        // ← This is NORMAL (proxy handles it)
```

### Requests Should Go To:
```
/api/datasources/proxy/{id}/prtg/api/v2/...
```
(NOT directly to PRTG server)

## Why This Works

| Before | After |
|--------|-------|
| Frontend tries to read API key | Frontend uses proxy route |
| `decryptedSecureJsonData` is undefined | Grafana backend injects key |
| ❌ Error: Key not configured | ✅ Works securely |

## Documentation
- 📘 **FIX-COMPLETE.md** - Full installation guide
- 📗 **PROXY-FIX.md** - Technical details
- 📙 **API-KEY-FIX.md** - Quick start
- 📕 **CONFIGURATION.md** - Configuration help

## Still Not Working?

### Check:
1. ✅ Grafana version ≥ 9.0.0
2. ✅ Plugin rebuilt after changes
3. ✅ Grafana restarted
4. ✅ Browser cache cleared
5. ✅ API key re-entered (after reset)

### Test PRTG Access:
```bash
curl https://your-prtg:1616/api/v2/experimental/objects?limit=1 \
  -H "Authorization: Bearer YOUR_KEY"
```

### Get Help:
[Open Issue](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues) with:
- Grafana version
- Console logs
- Error messages

---
**Status:** ✅ Fix Complete • Ready to Use
