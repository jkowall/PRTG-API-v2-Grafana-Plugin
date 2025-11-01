# PRTG API v2 Grafana Plugin

A native Grafana datasource plugin for PRTG Network Monitor API v2, providing seamless integration between PRTG and Grafana for monitoring and visualization.

## Attribution

This plugin is derived from the original dashboard concept created by [stylersnico](https://github.com/stylersnico/PRTG-API-v2-Grafana-Dashboard/) and has been converted into a native Grafana datasource plugin for better integration and functionality.

**Development:** This plugin was developed with the assistance of [GitHub Copilot](https://github.com/features/copilot), an AI pair programmer.

## Features

- **Native Integration**: Direct connection to PRTG API v2 without external dependencies
- **Secure Authentication**: Bearer token authentication with encrypted API key storage via Grafana's proxy
- **Smart Defaults**: New queries start with sensible defaults (100 result limit, essential columns)
- **Column Presets**: Quick-select common column configurations (Essential, Network Device, Full Details, Troubleshooting)
- **Column Auto-complete**: Searchable dropdown with all available PRTG fields, plus support for custom column names
- **Query Naming**: Add friendly names to queries for better dashboard organization
- **Flexible Filtering**: Multi-select for object types and statuses, plus custom filter syntax support
- **Real-time Data**: Live data from PRTG objects (sensors, devices, groups, probes, channels)
- **Optimized Queries**: Select specific columns and apply filters for efficient data retrieval

## Prerequisites

- Grafana 9.0.0 or later
- PRTG Network Monitor with API v2 enabled
- PRTG API v2 running on port 1616 (default)
- Valid PRTG API key with read permissions

## Installation

### From Grafana Plugin Directory (Coming Soon)
```bash
grafana-cli plugins install prtgapiv2-datasource
```

### Quick Installation with Scripts

**Linux/macOS:**
```bash
npm run build
./install-plugin.sh
sudo systemctl restart grafana-server
```

**Windows (PowerShell as Administrator):**
```powershell
npm run build
.\install-plugin.ps1
Restart-Service -Name Grafana
```

See [WINDOWS-INSTALL.md](WINDOWS-INSTALL.md) for detailed Windows installation guide.

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/releases)
2. Extract to your Grafana plugins directory:
   - **Linux/macOS:** `/var/lib/grafana/plugins/`
   - **Windows:** `C:\Program Files\GrafanaLabs\grafana\data\plugins\`
3. Restart Grafana
4. Enable the plugin in Grafana Admin > Plugins

### Development Installation
```bash
# Clone the repository
git clone https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin.git
cd PRTG-API-v2-Grafana-Plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Link to Grafana plugins directory (Linux/macOS)
ln -s $(pwd)/dist /var/lib/grafana/plugins/prtgapiv2-datasource

# Restart Grafana
sudo systemctl restart grafana-server
```

## Configuration

### 1. Enable PRTG API v2
Ensure PRTG API v2 is enabled on your PRTG server:
- Go to PRTG System Administration
- Enable "Enable REST API v2" option
- Note the port (default: 1616)

### 2. Create API Key
Create an API key in PRTG:
- Go to Account Settings > API Keys
- Create a new API key with read permissions
- Copy the generated key

### 3. Configure Datasource in Grafana
1. Go to Grafana > Configuration > Data Sources
2. Click "Add data source"
3. Select "PRTG API v2" from the list
4. Configure the connection:

   | Field | Description | Example |
   |-------|-------------|---------|
   | **PRTG Server URL** | Base URL of your PRTG server | `https://monitoring.prtg.server` |
   | **Port** | PRTG API v2 port | `1616` |
   | **API Key** | Your PRTG API key | `your-api-key-here` |
   | **Allow insecure SSL** | Check if using self-signed certificates | ☐ |

5. Click "Save & Test" to verify the connection

## Usage

### Creating Queries

The query editor provides an intuitive interface with smart defaults and helpful presets:

#### 1. **Query Name** (Optional)
Give your query a friendly name to help organize complex dashboards:
- Example: "Critical Sensors", "Network Overview", "Down Devices"

#### 2. **Object Type** (Multi-select)
Choose one or more PRTG object types:
- **Channels** - Individual sensor channels
- **Sensors** - Monitoring sensors  
- **Devices** - Monitored devices
- **Groups** - Device groups
- **Probes** - PRTG probes

Selecting multiple types generates an OR filter: `type = sensor OR type = device`

#### 3. **Status** (Multi-select)
Filter by object status:
- **Up** - Normal operation
- **Down** - Failed/unreachable
- **Warning** - Warning state
- **Paused** - Manually paused

Selecting multiple statuses generates an OR filter: `status = down OR status = warning`

#### 4. **Custom Filter**
Add additional filters using PRTG API v2 filter syntax:
- `name contains 'server'`
- `lastup > '2024-01-01'`
- `device = 'router' AND status != 'up'`

Custom filters are combined with Object Type and Status using AND logic.

#### 5. **Column Presets**
Quick-select common column configurations:

- **Essential** (default): `name, status, message`
  - Perfect for quick overview and status monitoring
  
- **Network Device**: `name, status, device, host, lastcheck, message`
  - Ideal for network infrastructure monitoring
  
- **Full Details**: `name, status, message, parent.name, device, group, probe, lastup, lastdown, objid`
  - Comprehensive view with all standard fields
  
- **Troubleshooting**: `name, status, message, lastdown, lastcheck, parent.name, device, host`
  - Focused on debugging and investigation
  
- **Custom**: Select your own columns from dropdown or type custom field names
  - Searchable multi-select with all available PRTG fields
  - Supports custom column names for API extensions

#### 6. **Data Limits**
Control result size for optimal performance:
- **Limit**: Maximum results to return (default: 100, use 0 for unlimited)
- **Offset**: Number of results to skip (useful for pagination)

### Quick Start Examples

#### Example 1: Monitor All Down Sensors
```
Query Name: Down Sensors
Object Type: Sensors
Status: Down
Column Preset: Essential
Limit: 100
```

#### Example 2: Network Device Overview
```
Query Name: Network Status
Object Type: Devices
Status: (leave empty for all)
Column Preset: Network Device
Custom Filter: device contains 'switch' OR device contains 'router'
Limit: 50
```

#### Example 3: Recent Failures
```
Query Name: Recent Failures
Object Type: Sensors, Devices
Status: Down, Warning
Column Preset: Troubleshooting
Custom Filter: lastdown > '2024-11-01'
Limit: 100
```

#### Example 4: Custom Analysis
```
Query Name: High Priority Issues
Object Type: Sensors
Status: Down
Column Preset: Custom
Columns: name, status, priority, message, parent.name, lastdown
Custom Filter: priority > 3
Limit: 50
```

### Dashboard Integration

The plugin works with all Grafana panel types:

- **Table Panel**: Perfect for showing object lists with multiple columns
- **Stat Panel**: Display counts of down/warning objects
- **Gauge Panel**: Show status percentages
- **Graph Panel**: Time-series data from sensor values

## API Reference

### Supported Endpoints
- `/experimental/objects` - All PRTG objects (sensors, devices, groups, probes)
- `/sensors` - Sensor-specific data
- `/devices` - Device information
- `/groups` - Group data  
- `/probes` - Probe information

### Filter Syntax
The plugin supports PRTG API v2 filter syntax:

```
# Status filtering
status = down
status = warning
status != up
status in ('down', 'warning')

# Name filtering  
name contains 'server'
name startswith 'DB'
name = 'Ping'

# Numeric filtering
objid > 1000
totalsens >= 5

# Date filtering
lastdown > '2024-01-01'
lastup < '2024-01-15'

# Combining filters
status = down AND name contains 'server'
(status = down OR status = warning) AND device != 'test'
```

### Available Columns
Common fields available for display:

| Field | Description |
|-------|-------------|
| `name` | Object name |
| `status` | Current status |
| `message` | Status message |
| `parent.name` | Parent object name |
| `objid` | Object ID |
| `kind_name` | Object type |
| `device` | Device name |
| `group` | Group name |
| `probe` | Probe name |
| `lastup` | Last up time |
| `lastdown` | Last down time |
| `lastcheck` | Last check time |
| `host` | Host address |
| `tags` | Object tags |
| `active` | Active status |
| `position` | Object position |
| `comments` | Comments |

## Migration from Infinity Datasource

If you're migrating from the Infinity datasource approach:

1. **Install the PRTG Plugin**: Follow installation instructions above
2. **Create New Datasource**: Configure PRTG API v2 datasource  
3. **Update Dashboards**: 
   - Change datasource from "Infinity" to "PRTG API v2"
   - Update query format using the new query editor
   - Maintain existing filters and column selections
4. **Test Queries**: Verify data is displaying correctly
5. **Remove Infinity Dependency**: Uninstall if no longer needed

### Query Migration Examples

**Old Infinity Query**:
```json
{
  "url": "https://monitoring.prtg.server:1616/api/v2/experimental/objects",
  "params": [
    {"key": "filter", "value": "status = down"},
    {"key": "limit", "value": "0"}
  ],
  "columns": [
    {"selector": "name", "text": "Name"},
    {"selector": "status", "text": "Status"}
  ]
}
```

**New PRTG Plugin Query**:
- **Endpoint**: `Objects (Experimental)`
- **Filter**: `Down Status`  
- **Columns**: `name, status`

## Troubleshooting

### Connection Issues
- Verify PRTG API v2 is enabled and accessible on port 1616
- Check firewall rules between Grafana and PRTG servers
- Validate API key permissions and expiration
- Test API access manually: `curl -H "Authorization: Bearer YOUR_API_KEY" https://prtg:1616/api/v2/experimental/objects?limit=1`

### Query Issues  
- Check filter syntax against PRTG API v2 documentation
- Verify column names exist in the selected endpoint
- Monitor Grafana logs for detailed error messages
- Test with simplified queries first

### Performance Issues
- Use appropriate limits for large PRTG installations
- Filter results to reduce data transfer
- Select only necessary columns
- Consider pagination with offset for large datasets

## Development

### Building from Source
```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build  
npm run build

# Run tests
npm run test

# Linting
npm run lint
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### "API Key is not configured" Error
See [API-KEY-FIX.md](API-KEY-FIX.md) for the complete solution. Quick fix:
1. Rebuild: `npm run build`
2. Install: `./install-plugin.sh`
3. Restart Grafana
4. Reset and re-enter API Key in datasource settings

### Connection Issues
- Verify PRTG server is accessible from Grafana server
- Check firewall rules on port 1616
- Ensure API v2 is enabled on PRTG
- Test with curl: `curl https://your-prtg:1616/api/v2/experimental/objects?limit=1 -H "Authorization: Bearer YOUR_KEY"`

### Configuration Help
See [CONFIGURATION.md](CONFIGURATION.md) for detailed setup instructions.

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues)
- **Documentation**: Check PRTG API v2 docs at `https://your-prtg-server:1616/api/v2/oas/`
- **Community**: Grafana Community Forums

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
