#!/bin/bash

# PRTG API v2 Grafana Plugin - Installation Script
# This script helps install or update the plugin with the proxy fix

set -e

PLUGIN_NAME="prtgapiv2-datasource"
GRAFANA_PLUGINS_DIR="${GRAFANA_PLUGINS_DIR:-/var/lib/grafana/plugins}"
DIST_DIR="./dist"

echo "🔧 PRTG API v2 Grafana Plugin Installation"
echo "=========================================="
echo ""

# Check if running as root or with sudo for system-level Grafana
if [ -w "$GRAFANA_PLUGINS_DIR" ]; then
    echo "✅ Have write access to $GRAFANA_PLUGINS_DIR"
else
    echo "⚠️  No write access to $GRAFANA_PLUGINS_DIR"
    echo "   You may need to run this script with sudo"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: dist directory not found"
    echo "   Please run 'npm run build' first"
    exit 1
fi

# Check if dist has required files
if [ ! -f "$DIST_DIR/plugin.json" ]; then
    echo "❌ Error: plugin.json not found in dist"
    echo "   Please run 'npm run build' first"
    exit 1
fi

# Create plugins directory if it doesn't exist
if [ ! -d "$GRAFANA_PLUGINS_DIR" ]; then
    echo "📁 Creating plugins directory: $GRAFANA_PLUGINS_DIR"
    mkdir -p "$GRAFANA_PLUGINS_DIR"
fi

PLUGIN_DIR="$GRAFANA_PLUGINS_DIR/$PLUGIN_NAME"

# Remove old version if it exists
if [ -d "$PLUGIN_DIR" ]; then
    echo "🗑️  Removing old plugin version from $PLUGIN_DIR"
    rm -rf "$PLUGIN_DIR"
fi

# Copy new version
echo "📦 Installing plugin to $PLUGIN_DIR"
cp -r "$DIST_DIR" "$PLUGIN_DIR"

# Verify installation
if [ -f "$PLUGIN_DIR/plugin.json" ]; then
    echo "✅ Plugin installed successfully"
    
    # Check for proxy route configuration
    if grep -q '"routes"' "$PLUGIN_DIR/plugin.json"; then
        echo "✅ Proxy route configuration found (API key will work)"
    else
        echo "⚠️  Warning: Proxy route configuration not found"
    fi
else
    echo "❌ Error: Installation failed"
    exit 1
fi

echo ""
echo "📝 Next Steps:"
echo "   1. Restart Grafana:"
echo "      sudo systemctl restart grafana-server"
echo "      (or: docker restart grafana)"
echo ""
echo "   2. In Grafana UI, go to:"
echo "      Configuration → Data Sources → PRTG API v2"
echo ""
echo "   3. If reconfiguring existing datasource:"
echo "      - Click 'Reset' next to API Key field"
echo "      - Re-enter your API Key"
echo "      - Click 'Save & Test'"
echo ""
echo "   4. Check browser console for initialization logs"
echo "      Look for: useProxy: true"
echo ""
echo "📚 For troubleshooting, see:"
echo "   - PROXY-FIX.md (detailed fix explanation)"
echo "   - CONFIGURATION.md (configuration guide)"
echo ""
echo "Done! 🎉"
