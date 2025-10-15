# PRTG API v2 Grafana Plugin

A native Grafana datasource plugin for PRTG Network Monitor API v2, providing seamless integration between PRTG and Grafana for monitoring and visualization.

## Attribution

This plugin is derived from the original dashboard concept created by [stylersnico](https://github.com/stylersnico/PRTG-API-v2-Grafana-Dashboard/) and has been converted into a native Grafana datasource plugin for better integration and functionality.

## Features

- **Native Integration**: Direct connection to PRTG API v2 without external dependencies
- **Secure Authentication**: Bearer token authentication with encrypted API key storage
- **Flexible Querying**: Support for filters, limits, and custom column selection
- **Real-time Data**: Live data from PRTG sensors, devices, groups, and probes
- **Pre-built Filters**: Quick access to common status filters (Down, Warning, Paused, Up)
- **Custom Columns**: Select specific fields for optimized dashboards

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

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/releases)
2. Extract to your Grafana plugins directory: `/var/lib/grafana/plugins/`
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

# Link to Grafana plugins directory
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

1. **Endpoint Selection**: Choose the PRTG API endpoint:
   - `Objects (Experimental)` - All PRTG objects
   - `Sensors` - Sensor data
   - `Devices` - Device information
   - `Groups` - Group data
   - `Probes` - Probe information

2. **Filtering**: Apply filters to narrow down results:
   - **Predefined Filters**: Quick access to common statuses
     - All Objects
     - Down Status
     - Warning Status  
     - Paused Status
     - Up Status
   - **Custom Filters**: Use PRTG API v2 filter syntax
     - `status = down`
     - `name contains 'server'`
     - `status = warning AND device = 'router'`

3. **Data Limits**: Control result size:
   - **Limit**: Maximum number of results (0 = no limit)
   - **Offset**: Number of results to skip (for pagination)

4. **Column Selection**: Choose which fields to display:
   - Leave empty for all available columns
   - Specify comma-separated list: `name, status, message, parent.name`

### Common Query Examples

#### Show All Down Objects
- **Endpoint**: `Objects (Experimental)`
- **Filter**: `Down Status`
- **Columns**: `name, status, message, parent.name, lastup`

#### Monitor Specific Device Type
- **Endpoint**: `Objects (Experimental)`
- **Filter**: `Custom Filter`
- **Custom Filter**: `kind_name = 'Ping Sensor' AND status != up`
- **Columns**: `name, status, device, lastcheck`

#### Recent Alerts
- **Endpoint**: `Objects (Experimental)`
- **Filter**: `Custom Filter`
- **Custom Filter**: `status in ('down', 'warning') AND lastdown > '2024-01-01'`
- **Limit**: `50`

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

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues)
- **Documentation**: Check PRTG API v2 docs at `https://your-prtg-server:1616/api/v2/oas/`
- **Community**: Grafana Community Forums

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
