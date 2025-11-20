import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, InlineField, MultiSelect, Input, Select, Button, Icon } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { PRTGDataSource } from '../datasource';
import {
  PRTGColumnPreset,
  PRTGDataSourceOptions,
  PRTGMetadata,
  PRTGQuery,
  PRTGQueryViewMode,
} from '../types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<PRTGDataSource, PRTGQuery, PRTGDataSourceOptions>;

interface State {
  metadata: PRTGMetadata | null;
  metadataLoading: boolean;
  metadataError?: string;
}

const DEFAULT_LIMIT = 100;

const VIEW_MODE_OPTIONS: Array<SelectableValue<PRTGQueryViewMode>> = [
  { label: 'Table (raw objects)', value: 'table' },
  { label: 'Status Heatmap (group x status)', value: 'heatmap' },
];

const OBJECT_TYPE_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Channels', value: 'channel' },
  { label: 'Sensors', value: 'sensor' },
  { label: 'Devices', value: 'device' },
  { label: 'Groups', value: 'group' },
  { label: 'Probes', value: 'probe' },
];

const STATUS_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Down', value: 'down' },
  { label: 'Warning', value: 'warning' },
  { label: 'Paused', value: 'paused' },
  { label: 'Up', value: 'up' },
];

const COLUMN_PRESETS: Record<PRTGColumnPreset, string[]> = {
  essential: ['name', 'status', 'message'],
  network: ['name', 'status', 'device', 'host', 'lastcheck', 'message'],
  full: ['name', 'status', 'message', 'parent.name', 'device', 'group', 'probe', 'lastup', 'lastdown', 'objid'],
  troubleshooting: ['name', 'status', 'message', 'lastdown', 'lastcheck', 'parent.name', 'device', 'host'],
  custom: [],
};

const COLUMN_PRESET_OPTIONS: Array<SelectableValue<PRTGColumnPreset>> = [
  { label: 'Essential (name, status, message)', value: 'essential', description: 'Basic information for quick overview' },
  { label: 'Network Device (includes host & device)', value: 'network', description: 'Network monitoring focused columns' },
  { label: 'Full Details (all common fields)', value: 'full', description: 'Comprehensive view with standard metadata' },
  { label: 'Troubleshooting (includes timestamps)', value: 'troubleshooting', description: 'Debug and investigation focused view' },
  { label: 'Custom', value: 'custom', description: 'Manually select the columns to return' },
];

const ALL_AVAILABLE_COLUMNS: Array<SelectableValue<string>> = [
  { label: 'name', value: 'name' },
  { label: 'status', value: 'status' },
  { label: 'message', value: 'message' },
  { label: 'parent.name', value: 'parent.name' },
  { label: 'objid', value: 'objid' },
  { label: 'kind', value: 'kind' },
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

const toSelectableValues = (values: string[]): Array<SelectableValue<string>> =>
  values.map(value => ({ label: value, value }));

export class QueryEditor extends PureComponent<Props, State> {
  state: State = {
    metadata: null,
    metadataLoading: false,
    metadataError: undefined,
  };

  componentDidMount(): void {
    this.applySmartDefaults();
    void this.loadMetadata();
  }

  private applySmartDefaults() {
    const { query, onChange } = this.props;
    const next: PRTGQuery = { ...query };
    let changed = false;

    if (next.limit === undefined) {
      next.limit = DEFAULT_LIMIT;
      changed = true;
    }

    if (!next.viewMode) {
      next.viewMode = 'table';
      changed = true;
    }

    if (!next.columnPreset && (!next.columns || next.columns.length === 0)) {
      next.columnPreset = 'essential';
      next.columns = COLUMN_PRESETS.essential;
      changed = true;
    }

    if (changed) {
      onChange(next);
    }
  }

  private async loadMetadata(forceRefresh = false) {
    const { datasource } = this.props;

    this.setState({ metadataLoading: true, metadataError: undefined });

    try {
      const metadata = await datasource.getMetadata(forceRefresh);
      this.setState({ metadata, metadataLoading: false });
    } catch (error) {
      console.error('Failed to load PRTG metadata', error);
      const message = error instanceof Error ? error.message : String(error);
      this.setState({ metadataLoading: false, metadataError: message });
    }
  }

  private onQueryNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryName: event.target.value || undefined });
  };

  private onObjectTypesChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const objectTypes = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, objectTypes: objectTypes.length ? objectTypes : undefined });
    onRunQuery();
  };

  private onStatusesChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const statuses = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, statuses: statuses.length ? statuses : undefined });
    onRunQuery();
  };

  private onSensorTypesChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const sensorTypes = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, sensorTypes: sensorTypes.length ? sensorTypes : undefined });
    onRunQuery();
  };

  private onGroupsChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const groups = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, groups: groups.length ? groups : undefined });
    onRunQuery();
  };

  private onDevicesChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const devices = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, devices: devices.length ? devices : undefined });
    onRunQuery();
  };

  private onTagsChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const tags = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, tags: tags.length ? tags : undefined });
    onRunQuery();
  };

  private onColumnPresetChange = (value: SelectableValue<PRTGColumnPreset>) => {
    const { onChange, query, onRunQuery } = this.props;
    const preset = value?.value ?? 'essential';

    if (preset === 'custom') {
      onChange({ ...query, columnPreset: 'custom', columns: query.columns ?? [] });
      return;
    }

    const columns = COLUMN_PRESETS[preset] ?? COLUMN_PRESETS.essential;
    onChange({ ...query, columnPreset: preset, columns });
    onRunQuery();
  };

  private onColumnsChange = (values: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    const columns = values.map(v => v.value).filter((v): v is string => !!v);
    onChange({ ...query, columns, columnPreset: 'custom' });
    onRunQuery();
  };

  private onFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, filter: event.target.value || undefined });
  };

  private onFilterBlur = () => {
    const { onRunQuery } = this.props;
    onRunQuery();
  };

  private onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    const value = parseInt(event.target.value, 10);
    onChange({ ...query, limit: Number.isNaN(value) ? undefined : value });
  };

  private onOffsetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    const value = parseInt(event.target.value, 10);
    onChange({ ...query, offset: Number.isNaN(value) ? undefined : value });
  };

  private onViewModeChange = (value: SelectableValue<PRTGQueryViewMode>) => {
    const { onChange, query, onRunQuery } = this.props;
    const viewMode = value?.value ?? 'table';
    onChange({ ...query, viewMode });
    onRunQuery();
  };

  render() {
    const { query } = this.props;
    const { metadata, metadataError, metadataLoading } = this.state;

    const {
      queryName,
      viewMode = 'table',
      objectTypes,
      statuses,
      sensorTypes,
      groups,
      devices,
      tags,
      filter,
      limit,
      offset,
      columns = [],
      columnPreset = 'essential',
    } = query;

    const selectedObjectTypes = (objectTypes ?? [])
      .map(type => OBJECT_TYPE_OPTIONS.find(opt => opt.value === type))
      .filter((opt): opt is SelectableValue<string> => !!opt);

    const selectedStatuses = (statuses ?? [])
      .map(status => STATUS_OPTIONS.find(opt => opt.value === status))
      .filter((opt): opt is SelectableValue<string> => !!opt);

    const selectedSensorTypes = (sensorTypes ?? []).map(value => ({ label: value, value }));
    const selectedGroups = (groups ?? []).map(value => ({ label: value, value }));
    const selectedDevices = (devices ?? []).map(value => ({ label: value, value }));
    const selectedTags = (tags ?? []).map(value => ({ label: value, value }));

    const selectedColumnPreset = COLUMN_PRESET_OPTIONS.find(opt => opt.value === columnPreset) ?? COLUMN_PRESET_OPTIONS[0];
    const selectedColumns = columns.map(col => ALL_AVAILABLE_COLUMNS.find(opt => opt.value === col) || { label: col, value: col });

    const viewModeOption = VIEW_MODE_OPTIONS.find(opt => opt.value === viewMode) ?? VIEW_MODE_OPTIONS[0];

    const groupOptions = toSelectableValues(metadata?.groups ?? []);
    const deviceOptions = toSelectableValues(metadata?.devices ?? []);
    const tagOptions = toSelectableValues(metadata?.tags ?? []);
    const sensorTypeOptions = toSelectableValues(metadata?.sensorTypes ?? []);

    const showColumnControls = viewMode === 'table';

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineField
            label="Query Name"
            labelWidth={16}
            tooltip="Optional: Give this query a friendly name to help organize large dashboards"
            grow
          >
            <Input
              onChange={this.onQueryNameChange}
              value={queryName || ''}
              placeholder="e.g., Down Sensors, Network Overview, Critical Devices"
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField
            label="View Mode"
            labelWidth={16}
            tooltip="Choose how to visualize the data. Table shows raw objects, Status Heatmap aggregates counts by group/status."
            grow
          >
            <Select
              options={VIEW_MODE_OPTIONS}
              value={viewModeOption}
              onChange={this.onViewModeChange}
              menuPlacement="bottom"
            />
          </InlineField>
        </div>

        {viewMode === 'heatmap' && (
          <div className="gf-form">
            <div className="gf-form-label width-16" />
            <div className="gf-form-label">
              <small>
                Heatmap mode groups results by <strong>Group</strong> and <strong>Status</strong>, returning counts per combination.
                Use the filters below to focus on specific sensor types, groups, devices, or tags.
              </small>
            </div>
          </div>
        )}

        <div className="gf-form">
          <InlineField
            label="Object Type"
            labelWidth={16}
            tooltip="Filter by object category in PRTG (sensor, device, group, etc.)"
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
            label="Statuses"
            labelWidth={16}
            tooltip="Filter by current status. Sorting in tables follows PRTG severity order automatically."
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
            label="Sensor Types"
            labelWidth={16}
            tooltip="Filter by sensor type (kind_name). Populated from live PRTG metadata."
            grow
          >
            <MultiSelect
              options={sensorTypeOptions}
              value={selectedSensorTypes}
              onChange={this.onSensorTypesChange}
              placeholder="Start typing to filter sensor types..."
              isLoading={metadataLoading}
              isClearable
              allowCustomValue
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField
            label="Groups"
            labelWidth={16}
            tooltip="Limit results to specific PRTG groups"
            grow
          >
            <MultiSelect
              options={groupOptions}
              value={selectedGroups}
              onChange={this.onGroupsChange}
              placeholder="Select groups..."
              isLoading={metadataLoading}
              isClearable
              allowCustomValue
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField
            label="Devices"
            labelWidth={16}
            tooltip="Limit results to specific devices"
            grow
          >
            <MultiSelect
              options={deviceOptions}
              value={selectedDevices}
              onChange={this.onDevicesChange}
              placeholder="Select devices..."
              isLoading={metadataLoading}
              isClearable
              allowCustomValue
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField
            label="Tags"
            labelWidth={16}
            tooltip="Filter by tags attached to sensors/devices"
            grow
          >
            <MultiSelect
              options={tagOptions}
              value={selectedTags}
              onChange={this.onTagsChange}
              placeholder="Select or type tags..."
              isLoading={metadataLoading}
              isClearable
              allowCustomValue
            />
          </InlineField>
        </div>

        {metadataError && (
          <div className="gf-form">
            <div className="gf-form-label width-16">
              <Icon name="exclamation-triangle" size="sm" />
            </div>
            <div className="gf-form-label">
              <small>Metadata refresh failed: {metadataError}. Filters still work with manual values.</small>
            </div>
          </div>
        )}

        <div className="gf-form">
          <InlineField
            label="Custom Filter"
            labelWidth={16}
            tooltip="Additional raw filter expression appended to the filters above. Uses PRTG API v2 syntax."
            grow
          >
            <Input
              onChange={this.onFilterChange}
              onBlur={this.onFilterBlur}
              value={filter || ''}
              placeholder="e.g., name contains 'server' AND lastdown > '2024-11-01'"
            />
          </InlineField>
        </div>

        {showColumnControls ? (
          <>
            <div className="gf-form">
              <InlineField
                label="Column Preset"
                labelWidth={16}
                tooltip="Select a preset of commonly used columns or choose Custom to pick specific fields"
                grow
              >
                <Select
                  options={COLUMN_PRESET_OPTIONS}
                  value={selectedColumnPreset}
                  onChange={this.onColumnPresetChange}
                  menuPlacement="bottom"
                />
              </InlineField>
            </div>

            {columnPreset === 'custom' ? (
              <div className="gf-form">
                <InlineField
                  label="Columns"
                  labelWidth={16}
                  tooltip="Select or type column names. Custom values are sent directly to the PRTG API."
                  grow
                >
                  <MultiSelect
                    options={ALL_AVAILABLE_COLUMNS}
                    value={selectedColumns}
                    onChange={this.onColumnsChange}
                    placeholder="Select or type column names..."
                    allowCustomValue
                    isClearable
                  />
                </InlineField>
              </div>
            ) : (
              <div className="gf-form">
                <InlineField
                  label="Columns"
                  labelWidth={16}
                  tooltip={`Using ${selectedColumnPreset.label}`}
                  grow
                >
                  <Input value={columns.join(', ')} disabled placeholder="Using preset columns" />
                </InlineField>
              </div>
            )}
          </>
        ) : (
          <div className="gf-form">
            <div className="gf-form-label width-16" />
            <div className="gf-form-label">
              <small>
                Column selection is managed automatically in heatmap mode. Switch back to table view to pick custom columns.
              </small>
            </div>
          </div>
        )}

        <div className="gf-form-inline">
          <FormField
            label="Limit"
            labelWidth={16}
            inputWidth={15}
            onChange={this.onLimitChange}
            value={limit?.toString() ?? DEFAULT_LIMIT.toString()}
            placeholder={`${DEFAULT_LIMIT}`}
            tooltip="Maximum results to return (0 = unlimited). Default is 100 to protect dashboards."
            type="number"
          />
          <FormField
            label="Offset"
            labelWidth={16}
            inputWidth={15}
            onChange={this.onOffsetChange}
            value={offset?.toString() ?? '0'}
            placeholder="0"
            tooltip="Number of results to skip (useful for pagination)."
            type="number"
          />
        </div>

        <div className="gf-form">
          <InlineField labelWidth={16} label={metadata ? 'Metadata' : 'Metadata'} grow>
            <div className="gf-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <small>
                {metadata
                  ? `Loaded ${metadata.groups.length} groups · ${metadata.devices.length} devices · ${metadata.tags.length} tags`
                  : 'Metadata loads automatically to populate filters.'}
              </small>
              <Button
                size="sm"
                variant="secondary"
                icon="sync"
                onClick={() => this.loadMetadata(true)}
                disabled={metadataLoading}
              >
                Refresh
              </Button>
            </div>
          </InlineField>
        </div>

        <div className="gf-form-group">
          <div className="gf-form">
            <div className="gf-form-label width-16">Help</div>
            <div className="gf-form-label">
              <small>
                <strong>Filter syntax:</strong> Use the built-in selectors above or add custom expressions (documentation linked).
                <br />
                <strong>Status order:</strong> Sorting on the <em>Status</em> column follows PRTG severity automatically.
                <br />
                <a
                  href="https://www.paessler.com/support/prtg/api/v2/overview/index.html#filter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PRTG API v2 filter reference
                </a>
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
