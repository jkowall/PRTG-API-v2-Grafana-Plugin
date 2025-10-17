import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, InlineField, MultiSelect, Input } from '@grafana/ui';
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

  onColumnsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    const columnsString = event.target.value;
    
    // Parse columns immediately while typing
    const columns = columnsString
      .split(',')
      .map((col: string) => col.trim())
      .filter((col: string) => col.length > 0);
    
    onChange({ ...query, columns: columns.length > 0 ? columns : undefined });
  };

  onColumnsBlur = () => {
    const { onRunQuery } = this.props;
    onRunQuery(); // Run query when user finishes editing columns
  };

  render() {
    const query = { ...this.props.query };
    const { objectTypes, statuses, filter, limit, offset, columns } = query;
    
    // Convert arrays to SelectableValue arrays for MultiSelect
    const selectedObjectTypes = (objectTypes || [])
      .map(type => OBJECT_TYPE_OPTIONS.find(opt => opt.value === type))
      .filter((opt): opt is SelectableValue<string> => opt !== undefined);
    
    const selectedStatuses = (statuses || [])
      .map(status => STATUS_OPTIONS.find(opt => opt.value === status))
      .filter((opt): opt is SelectableValue<string> => opt !== undefined);
    
    const columnsValue = columns?.join(', ') || '';

    return (
      <div className="gf-form-group">
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
            label="Columns" 
            labelWidth={16}
            tooltip="Comma-separated columns to display"
            grow
          >
            <Input
              onChange={this.onColumnsChange}
              onBlur={this.onColumnsBlur}
              value={columnsValue}
              placeholder="name, status, message, parent.name"
            />
          </InlineField>
        </div>

        <div className="gf-form">
          <FormField
            label="Limit"
            labelWidth={16}
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
            labelWidth={16}
            inputWidth={15}
            onChange={this.onOffsetChange}
            value={offset?.toString() || ''}
            placeholder="0"
            tooltip="Number of results to skip"
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
                <strong>Common columns:</strong> {COMMON_COLUMNS.join(', ')}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
