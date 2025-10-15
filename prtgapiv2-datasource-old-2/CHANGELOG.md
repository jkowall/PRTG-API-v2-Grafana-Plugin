# Changelog

All notable changes to the PRTG API v2 Grafana Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added
- Initial release of native Grafana plugin for PRTG API v2
- Native datasource plugin replacing Infinity datasource dependency
- Secure API key authentication with encrypted storage
- Query editor with endpoint selection and filter configuration
- Support for all major PRTG API v2 endpoints:
  - Objects (Experimental)
  - Sensors
  - Devices
  - Groups
  - Probes
- Predefined filter options for common status queries
- Custom filter support with PRTG API v2 syntax
- Configurable column selection for optimized dashboards
- Data pagination with limit and offset controls
- Connection testing and validation
- Comprehensive documentation and migration guide
- Example dashboards and query templates

### Changed
- **BREAKING**: Migrated from Infinity datasource to native plugin
- Improved query performance with direct API integration
- Enhanced security with proper credential management
- Simplified configuration with guided setup wizard

### Migration Notes
- Existing dashboards using Infinity datasource need to be updated
- Follow the migration guide in README.md for step-by-step instructions
- API functionality remains the same, only the query interface changes

## [0.x.x] - Previous Versions

### Legacy Implementation
- Dashboard examples using Infinity datasource
- Manual API configuration required
- External dependency on Infinity plugin
- Basic PRTG API v2 integration examples

---

## Migration from Legacy Version

If you're upgrading from the legacy Infinity-based implementation:

1. **Backup existing dashboards** before starting migration
2. **Install the new plugin** following installation instructions
3. **Create new PRTG API v2 datasource** with plugin configuration
4. **Update dashboard queries** using the new query editor
5. **Test thoroughly** before removing old Infinity datasource
6. **Remove Infinity datasource** if no longer needed for other purposes

For detailed migration steps, see the [Migration Guide](README.md#migration-from-infinity-datasource) in README.md.