import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, InlineField, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { PRTGDataSource } from '../datasource';
import { PRTGDataSourceOptions, PRTGQuery } from '../types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<PRTGDataSource, PRTGQuery, PRTGDataSourceOptions>;

const ENDPOINT_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Objects (Experimental)', value: 'experimental/objects' },
  { label: 'Sensors', value: 'sensors' },
  { label: 'Devices', value: 'devices' },
  { label: 'Groups', value: 'groups' },
  { label: 'Probes', value: 'probes' },
];

const PREDEFINED_FILTERS: Array<SelectableValue<string>> = [
  { label: 'All Objects', value: '' },
  { label: 'Down Status', value: 'status = down' },
  { label: 'Warning Status', value: 'status = warning' },
  { label: 'Paused Status', value: 'status = paused' },
  { label: 'Up Status', value: 'status = up' },
  { label: 'Down or Warning', value: 'status = down OR status = warning' },
  { label: 'Custom Filter', value: 'custom' },
];

const COMMON_COLUMNS = [
  'name',
  'status',
  'message',
  'parent.name',
  'lastup',
  'lastdown',
  'kind_name',
  'objid',
  'device',
  'group',
  'probe',
];

export class QueryEditor extends PureComponent<Props> {
  onEndpointChange = (value: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, endpoint: value.value });
  };

  onFilterChange = (value: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    if (value.value === 'custom') {
      // Keep existing custom filter or clear it
      onChange({ ...query, filter: query.filter || '' });
    } else {
      onChange({ ...query, filter: value.value });
      onRunQuery(); // Auto-run query when predefined filter selected
    }
  };

  onCustomFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, filter: event.target.value });
  };

  onCustomFilterBlur = () => {
    const { onRunQuery } = this.props;
    onRunQuery(); // Run query when user finishes editing custom filter
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

  onColumnsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    const columnsString = event.target.value;
    
    // Don't split while user is typing - just store the raw string
    onChange({ ...query, columnsString });
  };

  onColumnsBlur = () => {
    const { onChange, query, onRunQuery } = this.props;
    const columnsString = (query as any).columnsString || '';
    
    // Only parse when user finishes editing
    const columns = columnsString
      .split(',')
      .map((col: string) => col.trim())
      .filter((col: string) => col.length > 0);
    
    onChange({ ...query, columns: columns.length > 0 ? columns : undefined, columnsString: undefined });
    onRunQuery();
  };

  render() {
    const query = { ...this.props.query };
    const { endpoint, filter, limit, offset, columns } = query;
    
    // Use raw string while editing, otherwise show formatted columns
    const columnsValue = (query as any).columnsString !== undefined 
      ? (query as any).columnsString 
      : columns?.join(', ') || '';

    const selectedEndpoint = ENDPOINT_OPTIONS.find(option => option.value === endpoint) || ENDPOINT_OPTIONS[0];
    
    const isCustomFilter = filter && !PREDEFINED_FILTERS.find(option => option.value === filter && option.value !== 'custom');
    const selectedFilter = isCustomFilter 
      ? PREDEFINED_FILTERS.find(option => option.value === 'custom')
      : PREDEFINED_FILTERS.find(option => option.value === filter) || PREDEFINED_FILTERS[0];

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineField label="Endpoint" labelWidth={12}>
            <Select
              options={ENDPOINT_OPTIONS}
              value={selectedEndpoint}
              onChange={this.onEndpointChange}
              width={30}
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <InlineField label="Filter" labelWidth={12}>
            <Select
              options={PREDEFINED_FILTERS}
              value={selectedFilter}
              onChange={this.onFilterChange}
              width={30}
            />
          </InlineField>
        </div>

        {(isCustomFilter || selectedFilter?.value === 'custom') && (
          <div className="gf-form">
            <FormField
              label="Custom Filter"
              labelWidth={12}
              inputWidth={30}
              onChange={this.onCustomFilterChange}
              onBlur={this.onCustomFilterBlur}
              value={filter || ''}
              placeholder="e.g., status = down AND name contains 'server'"
              tooltip="Use PRTG API v2 filter syntax. Supports AND, OR operators"
            />
          </div>
        )}

        <div className="gf-form">
          <FormField
            label="Limit"
            labelWidth={12}
            inputWidth={15}
            onChange={this.onLimitChange}
            value={limit?.toString() || ''}
            placeholder="0 (no limit)"
            tooltip="Maximum number of results to return"
            type="number"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Offset"
            labelWidth={12}
            inputWidth={15}
            onChange={this.onOffsetChange}
            value={offset?.toString() || ''}
            placeholder="0"
            tooltip="Number of results to skip"
            type="number"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Columns"
            labelWidth={12}
            inputWidth={30}
            onChange={this.onColumnsChange}
            onBlur={this.onColumnsBlur}
            value={columnsValue}
            placeholder="name, status, message, parent.name"
            tooltip={`Comma-separated list of columns to display. You can type commas normally. Common columns: ${COMMON_COLUMNS.join(', ')}`}
          />
        </div>

        <div className="gf-form-group">
          <div className="gf-form">
            <div className="gf-form-label width-12">Help</div>
            <div className="gf-form-label">
              <small>
                <strong>Filter Syntax:</strong> Use PRTG API v2 syntax. 
                Examples: &quot;status = down&quot;, &quot;name contains &apos;server&apos;&quot;, &quot;status = warning AND device = &apos;router&apos;&quot;
                <br />
                <strong>Operators:</strong> AND, OR for combining filters. Use = for equals, contains for partial match.
                <br />
                <strong>Endpoints:</strong> Use specific endpoints (sensors, devices, groups, probes) for better filtering support.
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
