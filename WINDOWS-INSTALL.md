# Windows Installation Guide

## Requirements
- Windows Server 2019 or newer / Windows 10/11
- PowerShell 5.1 or later
- Grafana installed on Windows
- Administrator privileges (recommended)

## Quick Installation

### Method 1: Using PowerShell Script (Recommended)

1. **Open PowerShell as Administrator**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Navigate to plugin directory**
   ```powershell
   cd C:\path\to\PRTG-API-v2-Grafana-Plugin
   ```

3. **Run the installation script**
   ```powershell
   .\install-plugin.ps1
   ```

   **Custom Grafana location:**
   ```powershell
   .\install-plugin.ps1 -GrafanaPluginsDir "D:\Grafana\data\plugins"
   ```

   **Custom service name:**
   ```powershell
   .\install-plugin.ps1 -GrafanaServiceName "GrafanaEnterprise"
   ```

### Method 2: Manual Installation

1. **Build the plugin**
   ```powershell
   npm run build
   ```

2. **Copy to Grafana plugins directory**
   ```powershell
   # Default Grafana location
   Copy-Item -Path .\dist -Destination "C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource" -Recurse -Force
   ```

3. **Restart Grafana**
   ```powershell
   Restart-Service -Name Grafana
   ```

## Common Grafana Locations on Windows

| Installation Type | Default Plugins Path |
|------------------|---------------------|
| MSI Installer | `C:\Program Files\GrafanaLabs\grafana\data\plugins` |
| ZIP Archive | `<extraction-path>\data\plugins` |
| Custom Install | Check your Grafana configuration |

## Execution Policy Issues

If you get an error about execution policy:

```powershell
# Check current policy
Get-ExecutionPolicy

# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass (one-time)
PowerShell -ExecutionPolicy Bypass -File .\install-plugin.ps1
```

## Troubleshooting

### "Access Denied" Error
- Run PowerShell as Administrator
- Close Grafana before installing
- Check folder permissions

### "Service Not Found" Error
If Grafana service has a different name:
```powershell
# List all services containing "Grafana"
Get-Service | Where-Object {$_.Name -like "*Grafana*"}

# Use the correct service name
.\install-plugin.ps1 -GrafanaServiceName "YourServiceName"
```

### Grafana Not Starting
1. Check Windows Event Viewer:
   - Event Viewer → Windows Logs → Application
   - Look for Grafana errors

2. Check Grafana logs:
   ```
   C:\Program Files\GrafanaLabs\grafana\data\log\grafana.log
   ```

3. Verify plugin files:
   ```powershell
   Test-Path "C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource\plugin.json"
   ```

### Firewall Issues
If Grafana can't reach PRTG server:

1. **Test connectivity**
   ```powershell
   Test-NetConnection -ComputerName your-prtg-server -Port 1616
   ```

2. **Check Windows Firewall**
   ```powershell
   # Allow outbound to PRTG
   New-NetFirewallRule -DisplayName "Grafana to PRTG" -Direction Outbound -RemoteAddress <PRTG-IP> -RemotePort 1616 -Protocol TCP -Action Allow
   ```

## Configuration After Installation

1. **Open Grafana in browser**
   - Default: `http://localhost:3000`

2. **Add Data Source**
   - Configuration → Data Sources → Add data source
   - Search for "PRTG API v2"

3. **Configure Connection**
   - PRTG Server URL: `https://your-prtg-server`
   - Port: `1616`
   - API Key: `<your-api-key>`

4. **Save & Test**
   - Should show: ✅ "Successfully connected to PRTG API v2"

## Uninstallation

```powershell
# Stop Grafana
Stop-Service -Name Grafana

# Remove plugin
Remove-Item -Path "C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource" -Recurse -Force

# Start Grafana
Start-Service -Name Grafana
```

## Useful PowerShell Commands

```powershell
# Check Grafana service status
Get-Service -Name Grafana

# View Grafana service details
Get-Service -Name Grafana | Select-Object *

# Restart Grafana
Restart-Service -Name Grafana

# View recent Grafana logs (if using default location)
Get-Content "C:\Program Files\GrafanaLabs\grafana\data\log\grafana.log" -Tail 50

# List installed plugins
Get-ChildItem "C:\Program Files\GrafanaLabs\grafana\data\plugins"

# Check plugin.json content
Get-Content "C:\Program Files\GrafanaLabs\grafana\data\plugins\prtgapiv2-datasource\plugin.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## Environment-Specific Notes

### Windows Server Core
If running on Server Core (no GUI):
```powershell
# Install via PowerShell remoting
Enter-PSSession -ComputerName YourServer
cd C:\path\to\plugin
.\install-plugin.ps1
```

### Docker on Windows
If running Grafana in Docker:
```powershell
# Copy to container volume
docker cp dist grafana:/var/lib/grafana/plugins/prtgapiv2-datasource

# Restart container
docker restart grafana
```

### Windows Subsystem for Linux (WSL)
If running Grafana in WSL:
```bash
# Use the Linux install script
./install-plugin.sh
```

## Support

For issues specific to Windows:
- Check Windows Event Viewer
- Review Grafana logs at `C:\Program Files\GrafanaLabs\grafana\data\log\`
- Ensure proper permissions on plugins directory
- [Open an issue](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues) with Windows version and error details
