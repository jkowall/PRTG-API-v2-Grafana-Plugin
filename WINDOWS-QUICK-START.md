# 🪟 Windows Installation - Complete Guide

## ✅ What's Included

Two installation methods for Windows:
1. **Automated PowerShell Script** - `install-plugin.ps1`
2. **Manual Installation** - Step-by-step guide

## 🚀 Quick Start (Recommended)

### Prerequisites
- ✅ Windows Server 2019+ or Windows 10/11
- ✅ PowerShell 5.1 or later
- ✅ Grafana installed
- ✅ Node.js and npm (for building)

### Installation Steps

1. **Open PowerShell as Administrator**
   ```
   Win + X → Windows PowerShell (Admin)
   ```

2. **Navigate to plugin directory**
   ```powershell
   cd C:\path\to\PRTG-API-v2-Grafana-Plugin
   ```

3. **Build the plugin**
   ```powershell
   npm run build
   ```

4. **Run installation script**
   ```powershell
   .\install-plugin.ps1
   ```

5. **Follow the prompts** - Script will:
   - ✅ Check prerequisites
   - ✅ Copy plugin files
   - ✅ Verify installation
   - ✅ Offer to restart Grafana

## 📋 Script Features

### Smart Detection
- ✅ Checks for Administrator privileges
- ✅ Validates PowerShell version
- ✅ Verifies build artifacts
- ✅ Detects Grafana service
- ✅ Confirms proxy route configuration

### Flexible Options
```powershell
# Custom Grafana location
.\install-plugin.ps1 -GrafanaPluginsDir "D:\Grafana\data\plugins"

# Custom service name
.\install-plugin.ps1 -GrafanaServiceName "GrafanaEnterprise"

# Both
.\install-plugin.ps1 -GrafanaPluginsDir "D:\Grafana\data\plugins" -GrafanaServiceName "GrafanaOSS"
```

### Color-Coded Output
- 🟢 Green checkmarks for success
- 🟡 Yellow warnings for attention items
- 🔴 Red errors for failures
- 🔵 Cyan headers and info

## 🔧 Common Scenarios

### Default Grafana MSI Install
```powershell
.\install-plugin.ps1
# Uses: C:\Program Files\GrafanaLabs\grafana\data\plugins
```

### Custom Grafana Location
```powershell
.\install-plugin.ps1 -GrafanaPluginsDir "D:\Apps\Grafana\data\plugins"
```

### Grafana Enterprise
```powershell
.\install-plugin.ps1 -GrafanaServiceName "GrafanaEnterprise"
```

### Docker on Windows
```powershell
# Build plugin
npm run build

# Copy to container
docker cp dist grafana:/var/lib/grafana/plugins/prtgapiv2-datasource

# Restart
docker restart grafana
```

## 🛠️ Troubleshooting

### Execution Policy Error
```powershell
# Check current policy
Get-ExecutionPolicy

# Allow local scripts (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass (one-time)
PowerShell -ExecutionPolicy Bypass -File .\install-plugin.ps1
```

### Access Denied
- Run as Administrator
- Close Grafana service first
- Check folder permissions

### Service Not Found
```powershell
# Find Grafana service
Get-Service | Where-Object {$_.Name -like "*Grafana*"}

# Use correct name
.\install-plugin.ps1 -GrafanaServiceName "ActualServiceName"
```

### Port/Firewall Issues
```powershell
# Test PRTG connectivity
Test-NetConnection -ComputerName your-prtg-server -Port 1616

# Add firewall rule
New-NetFirewallRule -DisplayName "Grafana to PRTG" `
  -Direction Outbound `
  -RemoteAddress <PRTG-IP> `
  -RemotePort 1616 `
  -Protocol TCP `
  -Action Allow
```

## 📁 Default Paths

| Component | Default Location |
|-----------|-----------------|
| Plugin Install | `C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource` |
| Grafana Config | `C:\Program Files\GrafanaLabs\grafana\conf\defaults.ini` |
| Grafana Logs | `C:\Program Files\GrafanaLabs\grafana\data\log\grafana.log` |
| Grafana Data | `C:\Program Files\GrafanaLabs\grafana\data` |

## 🔍 Verification

### Check Installation
```powershell
# Verify plugin files
Test-Path "C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource\plugin.json"

# Check proxy configuration
Get-Content "C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource\plugin.json" | Select-String "routes"

# List all plugins
Get-ChildItem "C:\Program Files\GrafanaLabs\grafana\data\plugins"
```

### Check Grafana Service
```powershell
# Service status
Get-Service -Name Grafana

# Service details
Get-Service -Name Grafana | Format-List *

# Restart service
Restart-Service -Name Grafana

# View recent logs
Get-Content "C:\Program Files\GrafanaLabs\grafana\data\log\grafana.log" -Tail 50
```

## ✨ After Installation

1. **Open Grafana**
   - Default: `http://localhost:3000`

2. **Add Data Source**
   - Configuration → Data Sources → Add data source
   - Search: "PRTG API v2"

3. **Configure Settings**
   - Server URL: `https://your-prtg-server`
   - Port: `1616`
   - API Key: `<your-key>`

4. **Save & Test**
   - Click "Save & Test"
   - Should show: ✅ "Successfully connected"

5. **Verify in Browser Console** (F12)
   ```javascript
   useProxy: true        // Should be true
   datasourceId: 123     // Should have a number
   ```

## 📚 Additional Documentation

- **WINDOWS-INSTALL.md** - Detailed Windows guide
- **QUICK-FIX.md** - Quick reference card
- **API-KEY-FIX.md** - API key troubleshooting
- **PROXY-FIX.md** - Technical proxy details
- **CONFIGURATION.md** - Configuration guide

## 🆘 Getting Help

### Windows-Specific Issues
1. Check Windows Event Viewer:
   - `eventvwr.msc`
   - Windows Logs → Application
   - Look for Grafana errors

2. Check Grafana logs:
   ```powershell
   Get-Content "C:\Program Files\GrafanaLabs\grafana\data\log\grafana.log" -Tail 100
   ```

3. Test network connectivity:
   ```powershell
   Test-NetConnection -ComputerName your-prtg-server -Port 1616
   ```

### Report Issues
[Open an issue](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues) with:
- Windows version (`winver`)
- PowerShell version (`$PSVersionTable.PSVersion`)
- Grafana version
- Error messages
- Script output

---

**Status:** ✅ Windows PowerShell installation script ready for Windows Server 2019+ and Windows 10/11!
