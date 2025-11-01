import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, InlineField, MultiSelect, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { PRTGDataSource } from '../datasource';
import { PRTGDataSourceOptions, PRTGQuery } from '../types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<PRTGDataSource, PRTGQuery, PRTGDataSourceOptions>;

const OBJECT_TYPE_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Channels', value: 'channel' },
  { label: 'Sensors', value: 'sensor' },
  { label: 'Devices', value: 'device' },
  { label: 'Groups', value: 'group' },
  { label: 'Probes', value: 'probe' },
];

const STATUS_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Up', value: 'up' },
  { label: 'Down', value: 'down' },
  { label: 'Warning', value: 'warning' },
  { label: 'Paused', value: 'paused' },
];

const COLUMN_PRESETS: Record<string, string[]> = {
  essential: ['name', 'status', 'message'],
  network: ['name', 'status', 'device', 'host', 'lastcheck', 'message'],
  full: ['name', 'status', 'message', 'parent.name', 'device', 'group', 'probe', 'lastup', 'lastdown', 'objid'],
  troubleshooting: ['name', 'status', 'message', 'lastdown', 'lastcheck', 'parent.name', 'device', 'host'],
};

const COLUMN_PRESET_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Essential (name, status, message)', value: 'essential', description: 'Basic information for quick overview' },
  { label: 'Network Device (includes host & device)', value: 'network', description: 'Network monitoring focused columns' },
  { label: 'Full Details (all common fields)', value: 'full', description: 'Comprehensive view with all standard fields' },
  { label: 'Troubleshooting (includes timestamps)', value: 'troubleshooting', description: 'Debug and investigation focused' },
  { label: 'Custom', value: 'custom', description: 'Manually specify columns' },
];

const ALL_AVAILABLE_COLUMNS: Array<SelectableValue<string>> = [
  { label: 'name', value: 'name' },
  { label: 'status', value: 'status' },
  { label: 'message', value: 'message' },
  { label: 'parent.name', value: 'parent.name' },
  { label: 'objid', value: 'objid' },
  { label: 'kind_name', value: 'kind_name' },
  { label: 'device', value: 'device' },
  { label: 'group', value: 'group' },
  { label: 'probe', value: 'probe' },
  { label: 'host', value: 'host' },
  { label: 'lastup', value: 'lastup' },
  { label: 'lastdown', value: 'lastdown' },
  { label: 'lastcheck', value: 'lastcheck' },
  { label: 'active', value: 'active' },
  { label: 'tags', value: 'tags' },
  { label: 'type', value: 'type' },
  { label: 'position', value: 'position' },
  { label: 'comments', value: 'comments' },
  { label: 'priority', value: 'priority' },
  { label: 'basetype', value: 'basetype' },
  { label: 'parentid', value: 'parentid' },
];

export class QueryEditor extends PureComponent<Props> {
  // Set smart defaults for new queries
  componentDidMount() {
    const { query, onChange } = this.props;
    
    // Apply smart defaults only if this is a new/empty query
    if (!query.limit && query.limit !== 0) {
      onChange({ ...query, limit: 100 }); // Default limit to 100
    }
    if (!query.columnPreset && !query.columns) {
      onChange({ ...query, columnPreset: 'essential', columns: COLUMN_PRESETS.essential }); // Default to essential columns
    }
  }

  onQueryNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryName: event.target.value });
  };

  onObjectTypesChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const objectTypes = values.map(v => v.value).filter((v): v is string => v !== undefined);
    onChange({ ...query, objectTypes: objectTypes.length > 0 ? objectTypes : undefined });
    onRunQuery(); // Auto-run query when object types change
  };

  onStatusesChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const statuses = values.map(v => v.value).filter((v): v is string => v !== undefined);
    onChange({ ...query, statuses: statuses.length > 0 ? statuses : undefined });
    onRunQuery(); // Auto-run query when statuses change
  };

  onColumnPresetChange = (value: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    const preset = value.value;
    
    if (preset === 'custom') {
      // Switch to custom mode - keep existing columns or clear
      onChange({ ...query, columnPreset: 'custom', columnsInput: query.columns?.join(', ') || '' });
    } else if (preset && COLUMN_PRESETS[preset]) {
      // Apply preset columns
      const columns = COLUMN_PRESETS[preset];
      onChange({ ...query, columnPreset: preset, columns, columnsInput: undefined });
      onRunQuery();
    }
  };

  onColumnsMultiSelectChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const columns = values.map(v => v.value).filter((v): v is string => v !== undefined);
    onChange({ ...query, columns: columns.length > 0 ? columns : undefined, columnPreset: 'custom' });
    onRunQuery();
  };

  onFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, filter: event.target.value });
  };

  onFilterBlur = () => {
    const { onRunQuery } = this.props;
    onRunQuery(); // Run query when user finishes editing filter
  };

  onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    const limit = parseInt(event.target.value, 10);
    onChange({ ...query, limit: isNaN(limit) ? undefined : limit });
  };

  onOffsetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    const offset = parseInt(event.target.value, 10);
    onChange({ ...query, offset: isNaN(offset) ? undefined : offset });
  };

  render() {
    const query = { ...this.props.query };
    const { queryName, objectTypes, statuses, filter, limit, offset, columns, columnPreset } = query;
    
    // Convert arrays to SelectableValue arrays for MultiSelect
    const selectedObjectTypes = (objectTypes || [])
      .map(type => OBJECT_TYPE_OPTIONS.find(opt => opt.value === type))
      .filter((opt): opt is SelectableValue<string> => opt !== undefined);
    
    const selectedStatuses = (statuses || [])
      .map(status => STATUS_OPTIONS.find(opt => opt.value === status))
      .filter((opt): opt is SelectableValue<string> => opt !== undefined);
    
    const selectedColumnPreset = COLUMN_PRESET_OPTIONS.find(opt => opt.value === (columnPreset || 'essential')) || COLUMN_PRESET_OPTIONS[0];
    
    const selectedColumns = (columns || [])
      .map(col => ALL_AVAILABLE_COLUMNS.find(opt => opt.value === col) || { label: col, value: col })
      .filter((opt): opt is SelectableValue<string> => opt !== undefined);
    
    const isCustomColumns = columnPreset === 'custom';

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineField 
            label="Query Name" 
            labelWidth={16}
            tooltip="Optional: Give this query a friendly name to help organize your dashboard"
            grow
          >
            <Input
              onChange={this.onQueryNameChange}
              value={queryName || ''}
              placeholder="e.g., Down Sensors, Critical Devices, Network Overview"
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField 
            label="Object Type" 
            labelWidth={16}
            tooltip="Select one or more object types. Generates filter like: type = sensor OR type = device"
            grow
          >
            <MultiSelect
              options={OBJECT_TYPE_OPTIONS}
              value={selectedObjectTypes}
              onChange={this.onObjectTypesChange}
              placeholder="Select object types..."
              isClearable
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField 
            label="Status" 
            labelWidth={16}
            tooltip="Select one or more status values. Generates filter like: status = down OR status = warning"
            grow
          >
            <MultiSelect
              options={STATUS_OPTIONS}
              value={selectedStatuses}
              onChange={this.onStatusesChange}
              placeholder="Select statuses..."
              isClearable
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField 
            label="Custom Filter" 
            labelWidth={16}
            tooltip="Additional filters using PRTG API v2 syntax. Appended to Object Type and Status filters. Examples: name contains 'server', lastup > '2024-01-01'"
            grow
          >
            <Input
              onChange={this.onFilterChange}
              onBlur={this.onFilterBlur}
              value={filter || ''}
              placeholder="e.g., name contains 'server' AND lastup > '2024-01-01'"
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField 
            label="Column Preset" 
            labelWidth={16}
            tooltip="Choose a pre-configured set of columns or select Custom to pick your own"
            grow
          >
            <Select
              options={COLUMN_PRESET_OPTIONS}
              value={selectedColumnPreset}
              onChange={this.onColumnPresetChange}
            />
          </InlineField>
        </div>

        {isCustomColumns && (
          <div className="gf-form">
            <InlineField 
              label="Columns" 
              labelWidth={16}
              tooltip="Select columns to display. Start typing to search or add custom column names"
              grow
            >
              <MultiSelect
                options={ALL_AVAILABLE_COLUMNS}
                value={selectedColumns}
                onChange={this.onColumnsMultiSelectChange}
                placeholder="Select or type column names..."
                allowCustomValue
                isClearable
              />
            </InlineField>
          </div>
        )}

        {!isCustomColumns && (
          <div className="gf-form">
            <InlineField 
              label="Columns" 
              labelWidth={16}
              tooltip={`Using ${selectedColumnPreset.label} preset`}
              grow
            >
              <Input
                value={(columns || []).join(', ')}
                disabled
                placeholder="Using preset columns..."
              />
            </InlineField>
          </div>
        )}

        <div className="gf-form-inline">
          <FormField
            label="Limit"
            labelWidth={16}
            inputWidth={15}
            onChange={this.onLimitChange}
            value={limit?.toString() || ''}
            placeholder="100"
            tooltip="Maximum number of results to return (default: 100, use 0 for no limit)"
            type="number"
          />
          <FormField
            label="Offset"
            labelWidth={16}
            inputWidth={15}
            onChange={this.onOffsetChange}
            value={offset?.toString() || ''}
            placeholder="0"
            tooltip="Number of results to skip (for pagination)"
            type="number"
          />
        </div>

        <div className="gf-form-group">
          <div className="gf-form">
            <div className="gf-form-label width-16">Help</div>
            <div className="gf-form-label">
              <small>
                <strong>Filter Syntax:</strong> Use PRTG API v2 filter query language (
                <a href="https://www.paessler.com/support/prtg/api/v2/overview/index.html#filter" target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>).
                <br />
                <strong>Operators:</strong> AND, OR for combining filters. Use = for equals, contains for partial match, &gt; &lt; for comparisons.
                <br />
                <strong>Quick Tips:</strong> Use Column Presets for common scenarios, or choose Custom to select specific fields. Default limit is 100 results.
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
