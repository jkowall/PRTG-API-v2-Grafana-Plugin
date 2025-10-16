# Feature Fixes - v1.1.0

## Issues Fixed

### ✅ 1. Hostname Port Auto-Append Issue
**Problem:** URL field was automatically appending port 1616 even though there's a separate port field.

**Fix:** 
- Simplified `onURLChange` to only handle the URL without port
- Removed automatic port concatenation logic
- URL and Port fields now work independently
- URL field now properly strips any accidentally entered port

**Usage:**
- URL field: `https://monitoring.prtg.server` (no port)
- Port field: `1616` (separate)

### ✅ 2. Custom Filters Not Working
**Problem:** Custom filters weren't being applied properly to queries.

**Fix:**
- Fixed filter detection logic in `QueryEditor`
- Added `onBlur` handler to custom filter field to trigger query execution
- Auto-run query when predefined filter is selected
- Fixed custom filter detection to exclude 'custom' from comparison

**Usage:**
- Select "Custom Filter" from dropdown
- Type your filter (e.g., `status = down AND name contains 'server'`)
- Press Tab or click outside field to apply

### ✅ 3. Columns Field Doesn't Accept Commas
**Problem:** Typing commas in the Columns field was problematic due to immediate parsing.

**Fix:**
- Added temporary `columnsString` field to PRTGQuery type
- Store raw string while user is typing
- Only parse columns when user blurs the field (clicks away)
- This allows natural comma typing without interference

**Usage:**
- Type columns normally: `name, status, message, parent.name`
- Commas work naturally now
- Press Tab or click outside to apply

### ✅ 4. Endpoint Support
**Problem:** Plugin mentioned deprecated endpoints but already had proper endpoint options.

**Fix:**
- Confirmed all PRTG API v2 endpoints are properly configured:
  - `experimental/objects` - All objects (experimental endpoint)
  - `sensors` - Sensor objects
  - `devices` - Device objects
  - `groups` - Group objects
  - `probes` - Probe objects
- Updated help text to clarify endpoint usage
- All endpoints support filtering

**Usage:**
- Select specific endpoint for better filtering
- Each endpoint supports the same filter syntax

### ✅ 5. Combined Filters (AND/OR)
**Problem:** Couldn't combine filters like "down AND warning".

**Fix:**
- PRTG API v2 uses OR for combining status filters (not AND)
- Added predefined "Down or Warning" filter
- Updated custom filter help text to clarify AND/OR usage
- Custom filters now properly support both operators

**Usage:**
- **Predefined:** Select "Down or Warning" from dropdown
- **Custom:** Type `status = down OR status = warning`
- **With names:** `status = down AND name contains 'server'`

## Configuration Changes

### Plugin.json Route
```json
"url": "{{ .JsonData.url }}:{{ .JsonData.port }}/api/v2"
```
Now properly constructs: `https://your-server:1616/api/v2`

### Updated Help Text
Now includes:
- Filter syntax examples
- AND/OR operator usage
- Endpoint recommendations

## New Features

### Auto-Run Query
- Queries now auto-run when:
  - Predefined filter is selected
  - Custom filter field is blurred
  - Columns field is blurred
- Reduces need for manual "Run Query" clicks

### Improved Filter Options
Added new predefined filter:
- **Down or Warning** - `status = down OR status = warning`

## Breaking Changes

None - All changes are backward compatible.

## Migration Guide

### If Updating from Previous Version:

1. **URL Field:** Remove port if present
   - Before: `https://server:1616`
   - After: `https://server` (port in separate field)

2. **Custom Filters:** No changes needed
   - Existing filters continue to work
   - Now can type commas naturally

3. **Columns:** No changes needed
   - Existing column configurations preserved
   - Can now edit with normal comma typing

## Testing Checklist

- [ ] URL field doesn't add port automatically
- [ ] Port field updates independently
- [ ] Custom filters apply when field loses focus
- [ ] Can type commas in Columns field
- [ ] Predefined filters work (Down, Warning, etc.)
- [ ] Combined filter "Down or Warning" works
- [ ] Custom filter with AND operator works
- [ ] Custom filter with OR operator works
- [ ] All endpoints selectable (sensors, devices, groups, probes)
- [ ] Queries auto-run when appropriate

## Examples

### Combined Filters
```
# Status filters (use OR)
status = down OR status = warning

# Status + Name filter (use AND)
status = down AND name contains 'production'

# Multiple conditions
status = warning AND (device = 'router01' OR device = 'router02')
```

### Column Selection
```
# Basic columns
name, status, message

# With parent info
name, status, parent.name, lastup

# Full monitoring info
name, status, message, lastup, lastdown, device, group
```

### Endpoint Selection
```
sensors     - Best for sensor-specific queries
devices     - Filter by device name/location
groups      - Group-level monitoring
probes      - Probe status overview
experimental/objects - All object types
```

## Known Limitations

1. **Nested Parentheses:** Complex nested filter expressions may not work
2. **Special Characters:** Quote strings with special characters
3. **Filter Validation:** No client-side validation of filter syntax

## Support

For issues with these features:
- Check browser console for error messages
- Verify PRTG API v2 filter syntax
- Test filters in PRTG API documentation page
- [Report issues](https://github.com/jkowall/PRTG-API-v2-Grafana-Plugin/issues)

---

**Version:** 1.1.0  
**Date:** October 16, 2025  
**Status:** ✅ All requested features implemented
