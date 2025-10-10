# PRTG API v2 Grafana Plugin - Windows Installation Script
# Compatible with Windows Server 2019 and newer, Windows 10/11
# Requires PowerShell 5.1 or later

#Requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$GrafanaPluginsDir = "C:\Program Files\GrafanaLabs\grafana\data\plugins",
    
    [Parameter(Mandatory=$false)]
    [string]$GrafanaServiceName = "Grafana"
)

# Script configuration
$ErrorActionPreference = "Stop"
$PluginName = "prtgapiv2-datasource"
$DistDir = ".\dist"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )
    if ($Prefix) {
        Write-Host "$Prefix " -NoNewline -ForegroundColor $Color
        Write-Host $Message
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Header
Write-Host ""
Write-ColorOutput "PRTG API v2 Grafana Plugin Installation" "Cyan"
Write-ColorOutput "=======================================" "Cyan"
Write-Host ""

# Check for administrator privileges
if (-not (Test-Administrator)) {
    Write-ColorOutput "Warning: Not running as Administrator" "Yellow" "⚠️"
    Write-Host "  Some operations may fail without admin privileges."
    Write-Host "  Consider running PowerShell as Administrator."
    Write-Host ""
    
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Check PowerShell version
$psVersion = $PSVersionTable.PSVersion
Write-ColorOutput "PowerShell Version: $($psVersion.Major).$($psVersion.Minor)" "Gray" "ℹ️"

if ($psVersion.Major -lt 5) {
    Write-ColorOutput "Error: PowerShell 5.1 or later is required" "Red" "❌"
    Write-Host "  Current version: $psVersion"
    exit 1
}

# Check if dist directory exists
if (-not (Test-Path $DistDir)) {
    Write-ColorOutput "Error: dist directory not found" "Red" "❌"
    Write-Host "  Please run 'npm run build' first"
    exit 1
}

# Check if plugin.json exists
$pluginJsonPath = Join-Path $DistDir "plugin.json"
if (-not (Test-Path $pluginJsonPath)) {
    Write-ColorOutput "Error: plugin.json not found in dist" "Red" "❌"
    Write-Host "  Please run 'npm run build' first"
    exit 1
}

Write-ColorOutput "Build artifacts found" "Green" "✓"

# Check/Create plugins directory
if (-not (Test-Path $GrafanaPluginsDir)) {
    Write-ColorOutput "Creating plugins directory: $GrafanaPluginsDir" "Yellow" "📁"
    try {
        New-Item -Path $GrafanaPluginsDir -ItemType Directory -Force | Out-Null
        Write-ColorOutput "Plugins directory created" "Green" "✓"
    } catch {
        Write-ColorOutput "Error creating plugins directory: $_" "Red" "❌"
        exit 1
    }
} else {
    Write-ColorOutput "Plugins directory exists: $GrafanaPluginsDir" "Green" "✓"
}

$pluginDir = Join-Path $GrafanaPluginsDir $PluginName

# Remove old version if it exists
if (Test-Path $pluginDir) {
    Write-ColorOutput "Removing old plugin version from $pluginDir" "Yellow" "🗑️"
    try {
        Remove-Item -Path $pluginDir -Recurse -Force
        Write-ColorOutput "Old version removed" "Green" "✓"
    } catch {
        Write-ColorOutput "Error removing old version: $_" "Red" "❌"
        Write-Host "  Try closing Grafana first or run as Administrator"
        exit 1
    }
}

# Copy new version
Write-ColorOutput "Installing plugin to $pluginDir" "Cyan" "📦"
try {
    Copy-Item -Path $DistDir -Destination $pluginDir -Recurse -Force
    Write-ColorOutput "Plugin files copied" "Green" "✓"
} catch {
    Write-ColorOutput "Error copying plugin files: $_" "Red" "❌"
    exit 1
}

# Verify installation
$installedPluginJson = Join-Path $pluginDir "plugin.json"
if (Test-Path $installedPluginJson) {
    Write-ColorOutput "Plugin installed successfully" "Green" "✓"
    
    # Check for proxy route configuration
    $pluginContent = Get-Content $installedPluginJson -Raw
    if ($pluginContent -match '"routes"') {
        Write-ColorOutput "Proxy route configuration found (API key will work)" "Green" "✓"
    } else {
        Write-ColorOutput "Warning: Proxy route configuration not found" "Yellow" "⚠️"
    }
} else {
    Write-ColorOutput "Error: Installation verification failed" "Red" "❌"
    exit 1
}

Write-Host ""

# Check Grafana service
Write-ColorOutput "Checking Grafana service..." "Cyan" "🔍"
$grafanaService = Get-Service -Name $GrafanaServiceName -ErrorAction SilentlyContinue

if ($grafanaService) {
    Write-ColorOutput "Grafana service found: $GrafanaServiceName" "Green" "✓"
    Write-Host ""
    
    $restart = Read-Host "Restart Grafana service now? (Y/n)"
    if ($restart -ne "n" -and $restart -ne "N") {
        try {
            Write-ColorOutput "Stopping Grafana service..." "Yellow" "⏸️"
            Stop-Service -Name $GrafanaServiceName -Force
            Start-Sleep -Seconds 2
            
            Write-ColorOutput "Starting Grafana service..." "Yellow" "▶️"
            Start-Service -Name $GrafanaServiceName
            Start-Sleep -Seconds 3
            
            $serviceStatus = (Get-Service -Name $GrafanaServiceName).Status
            if ($serviceStatus -eq "Running") {
                Write-ColorOutput "Grafana service restarted successfully" "Green" "✓"
            } else {
                Write-ColorOutput "Warning: Grafana service status is $serviceStatus" "Yellow" "⚠️"
            }
        } catch {
            Write-ColorOutput "Error restarting Grafana: $_" "Red" "❌"
            Write-Host "  You may need to restart manually with Administrator privileges"
        }
    }
} else {
    Write-ColorOutput "Grafana service not found: $GrafanaServiceName" "Yellow" "⚠️"
    Write-Host "  You'll need to restart Grafana manually"
}

Write-Host ""
Write-ColorOutput "Next Steps:" "Cyan" "📝"
Write-Host ""

if (-not $grafanaService -or $restart -eq "n" -or $restart -eq "N") {
    Write-Host "   1. Restart Grafana:"
    Write-Host "      • Via Services: services.msc → Grafana → Restart"
    Write-Host "      • Via PowerShell: Restart-Service -Name $GrafanaServiceName"
    Write-Host "      • Or restart the Grafana process manually"
    Write-Host ""
}

Write-Host "   2. In Grafana UI, go to:"
Write-Host "      Configuration → Data Sources → PRTG API v2"
Write-Host ""
Write-Host "   3. If reconfiguring existing datasource:"
Write-Host "      • Click 'Reset' next to API Key field"
Write-Host "      • Re-enter your API Key"
Write-Host "      • Click 'Save & Test'"
Write-Host ""
Write-Host "   4. Check browser console for initialization logs"
Write-Host "      Look for: useProxy: true"
Write-Host ""

Write-ColorOutput "Documentation:" "Cyan" "📚"
Write-Host "   • QUICK-FIX.md - Quick reference"
Write-Host "   • PROXY-FIX.md - Detailed fix explanation"
Write-Host "   • CONFIGURATION.md - Configuration guide"
Write-Host ""

Write-ColorOutput "Done!" "Green" "🎉"
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Plugin installed to: " -NoNewline
Write-Host $pluginDir -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
