import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  FieldConfig,
  MappingType,
  ValueMappingResult,
} from '@grafana/data';

import { PRTGDataSourceOptions, PRTGQuery, PRTGSecureJsonData, PRTGObject, PRTGMetadata, PRTGQueryViewMode } from './types';
import { PRTGApiClient } from './api';

interface StatusDefinition {
  keys: string[];
  label: string;
  priority: number;
  color: string;
}

const STATUS_DEFINITIONS: StatusDefinition[] = [
  { keys: ['down'], label: 'Down', priority: 1, color: '#e02f44' },
  { keys: ['down (acknowledged)', 'down (ack)'], label: 'Down (Acknowledged)', priority: 2, color: '#ff941f' },
  { keys: ['down (partial)'], label: 'Down (Partial)', priority: 3, color: '#f2cc0c' },
  { keys: ['warning'], label: 'Warning', priority: 4, color: '#f2c96d' },
  { keys: ['unusual'], label: 'Unusual', priority: 5, color: '#ffcb7d' },
  { keys: ['paused'], label: 'Paused', priority: 6, color: '#a8a8a8' },
  { keys: ['paused (by user)'], label: 'Paused (by User)', priority: 7, color: '#c8c8c8' },
  { keys: ['paused (by dependency)'], label: 'Paused (by Dependency)', priority: 8, color: '#c8c8c8' },
  { keys: ['paused (because of license)'], label: 'Paused (License)', priority: 9, color: '#c8c8c8' },
  { keys: ['paused (until)'], label: 'Paused (Until)', priority: 10, color: '#c8c8c8' },
  { keys: ['collecting'], label: 'Collecting', priority: 11, color: '#5794f2' },
  { keys: ['no monitoring'], label: 'No Monitoring', priority: 12, color: '#b877d9' },
  { keys: ['up'], label: 'Up', priority: 13, color: '#56a64b' },
  { keys: ['unknown'], label: 'Unknown', priority: 14, color: '#888888' },
];

const STATUS_LOOKUP: Record<string, StatusDefinition> = STATUS_DEFINITIONS.reduce((acc, def) => {
  def.keys.forEach(key => {
    acc[key] = def;
  });
  return acc;
}, {} as Record<string, StatusDefinition>);

const STATUS_MAPPING_OPTIONS = STATUS_DEFINITIONS.reduce((acc, def) => {
  acc[def.priority.toString()] = {
    text: def.label,
    color: def.color,
  };
  return acc;
}, {} as Record<string, ValueMappingResult>);

STATUS_MAPPING_OPTIONS['98'] = { text: 'Unknown', color: '#888888' };

const DEFAULT_STATUS_DEFINITION: StatusDefinition = {
  keys: ['unknown'],
  label: 'Unknown',
  priority: 98,
  color: '#888888',
};

const DEFAULT_VIEW_MODE: PRTGQueryViewMode = 'table';

export class PRTGDataSource extends DataSourceApi<PRTGQuery, PRTGDataSourceOptions> {
  private apiClient: PRTGApiClient;
  private metadataCache?: PRTGMetadata;
  private metadataPromise?: Promise<PRTGMetadata>;

  constructor(instanceSettings: DataSourceInstanceSettings<PRTGDataSourceOptions>) {
    super(instanceSettings);

    const { url, port = 1616, allowInsecure = false } = instanceSettings.jsonData;
    const secureJsonData = (instanceSettings as any).decryptedSecureJsonData || {};
    const apiKey = (secureJsonData as PRTGSecureJsonData)?.apiKey || '';

    // Debug logging to help troubleshoot configuration issues
    console.log('PRTG Datasource initialization:', {
      url,
      port,
      allowInsecure,
      hasSecureData: !!(instanceSettings as any).decryptedSecureJsonData,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      datasourceId: instanceSettings.id,
      useProxy: !!instanceSettings.id,
    });

    this.apiClient = new PRTGApiClient({
      url: url || '',
      port,
      apiKey,
      allowInsecure,
      datasourceId: instanceSettings.id,
    });
  }

  async query(options: DataQueryRequest<PRTGQuery>): Promise<DataQueryResponse> {
    // const { range } = options; // TODO: Use range for time-based queries
    const data: MutableDataFrame[] = [];

    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }

      try {
        const viewMode: PRTGQueryViewMode = target.viewMode ?? DEFAULT_VIEW_MODE;
        const filter = this.buildFilter(target);
        const columnsForFetch = this.getColumnsForFetch(target);

        const response = await this.apiClient.query({
          endpoint: 'experimental/objects',
          filter,
          limit: target.limit,
          offset: target.offset,
          columns: columnsForFetch,
        });

        if (viewMode === 'heatmap') {
          data.push(this.createHeatmapFrame(response.data, target));
          continue;
        }

        const displayColumns = this.getDisplayColumns(response.data, target);

        const frame = new MutableDataFrame({
          refId: target.refId,
          fields: this.createFields(response.data, displayColumns),
        });

        response.data.forEach(item => {
          frame.add(this.transformObjectToRow(item, displayColumns));
        });

        data.push(frame);
      } catch (error) {
        console.error('PRTG API Error:', error);
        // Create an empty frame with error info
        const errorFrame = new MutableDataFrame({
          refId: target.refId,
          fields: [
            { name: 'Error', type: FieldType.string },
          ],
        });
        errorFrame.add({ Error: `Failed to fetch data: ${error}` });
        data.push(errorFrame);
      }
    }

    return { data };
  }

  private buildFilter(query: PRTGQuery): string {
    const filters: Array<string | undefined> = [];

    filters.push(this.buildEqualityFilter('type', query.objectTypes));
    filters.push(this.buildEqualityFilter('status', query.statuses));
    filters.push(this.buildEqualityFilter('group', query.groups));
    filters.push(this.buildEqualityFilter('device', query.devices));
    filters.push(this.buildEqualityFilter('kind_name', query.sensorTypes));
    filters.push(this.buildContainsFilter('tags', query.tags));

    if (query.filter && query.filter.trim()) {
      filters.push(`(${query.filter.trim()})`);
    }

    return filters.filter(Boolean).join(' AND ');
  }

  async testDatasource() {
    try {
      // Validate configuration
      if (!this.apiClient) {
        return {
          status: 'error',
          message: 'API client not initialized. Please check your configuration.',
        };
      }

      await this.apiClient.testConnection();
      return {
        status: 'success',
        message: 'Successfully connected to PRTG API v2',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        status: 'error',
        message: `Failed to connect to PRTG API: ${errorMessage}`,
      };
    }
  }

  private createFields(data: PRTGObject[], columns: string[]): Array<{ name: string; type: FieldType; config?: any }> {
    const sampleObject = data.length > 0 ? data[0] : undefined;
    return columns.map(fieldName => this.createFieldDefinition(fieldName, sampleObject));
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private getFieldType(value: any, fieldName?: string): FieldType {
    if (fieldName === 'status') {
      return FieldType.number;
    }
    if (typeof value === 'number') {
      return FieldType.number;
    }
    if (typeof value === 'boolean') {
      return FieldType.boolean;
    }
    // Only treat as date if it's an actual Date object or a string that looks like a proper date/time
    // Avoid parsing simple numbers like "1002" as dates
    if (value instanceof Date) {
      return FieldType.time;
    }
    if (typeof value === 'string') {
      // Only treat as date if it contains date separators or time indicators
      // This prevents IDs like "1002" from being parsed as dates
      const hasDateSeparators = /[-\/:]/.test(value);
      const hasTimeIndicators = /T|Z|\s\d{2}:/.test(value);
      if ((hasDateSeparators || hasTimeIndicators) && !isNaN(Date.parse(value))) {
        return FieldType.time;
      }
    }
    return FieldType.string;
  }

  private transformObjectToRow(obj: PRTGObject, columns?: string[]) {
    const fieldsToShow = columns && columns.length > 0 ? columns : Object.keys(obj);
    const row: any = {};

    for (const field of fieldsToShow) {
      const value = obj[field as keyof PRTGObject];
      
      // Handle nested objects like parent.name
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        const parentObj = obj[parentKey as keyof PRTGObject] as any;
        row[this.formatFieldName(field)] = parentObj?.[childKey] || null;
      } else if (field === 'status') {
        const definition = this.getStatusDefinition(typeof value === 'string' ? value : '');
        row[this.formatFieldName(field)] = definition.priority;
      } else {
        row[this.formatFieldName(field)] = value ?? null;
      }
    }

    return row;
  }

  private createFieldDefinition(fieldName: string, sample?: PRTGObject) {
    const formattedName = this.formatFieldName(fieldName);
    const sampleValue = sample ? sample[fieldName as keyof PRTGObject] : undefined;
    const fieldType = this.getFieldType(sampleValue, fieldName);
    const field: any = {
      name: formattedName,
      type: fieldType,
    };

    if (fieldName === 'status') {
      field.type = FieldType.number;
      field.config = this.getStatusFieldConfig();
    }

    return field;
  }

  private getColumnsForFetch(query: PRTGQuery): string[] | undefined {
    const viewMode = query.viewMode ?? DEFAULT_VIEW_MODE;
    if (viewMode === 'heatmap') {
      return ['group', 'status'];
    }

    if (query.columns && query.columns.length > 0) {
      return Array.from(new Set(query.columns));
    }

    return undefined;
  }

  private getDisplayColumns(data: PRTGObject[], query: PRTGQuery): string[] {
    if (query.columns && query.columns.length > 0) {
      return query.columns;
    }

    if (data.length > 0) {
      return Object.keys(data[0]);
    }

    return [];
  }

  private getStatusDefinition(rawStatus: string): StatusDefinition {
    if (!rawStatus) {
      return DEFAULT_STATUS_DEFINITION;
    }

    const normalized = rawStatus.trim().toLowerCase();
    return STATUS_LOOKUP[normalized] ?? {
      keys: [normalized],
      label: rawStatus,
      priority: DEFAULT_STATUS_DEFINITION.priority,
      color: DEFAULT_STATUS_DEFINITION.color,
    };
  }

  private getStatusFieldConfig(): FieldConfig {
    return {
      displayName: 'Status',
      custom: {
        displayMode: 'color-text',
      },
      mappings: [
        {
          type: MappingType.ValueToText,
          options: STATUS_MAPPING_OPTIONS,
        },
      ],
    };
  }

  private createHeatmapFrame(data: PRTGObject[], target: PRTGQuery): MutableDataFrame {
    const frame = new MutableDataFrame({
      refId: target.refId,
      fields: [
        { name: 'Group', type: FieldType.string },
        { name: 'Status', type: FieldType.number, config: this.getStatusFieldConfig() },
        { name: 'Count', type: FieldType.number },
      ],
    });

    const counts = new Map<string, Map<number, number>>();

    data.forEach(item => {
      const groupName = item.group || 'Ungrouped';
      const statusDefinition = this.getStatusDefinition(item.status);
      if (!counts.has(groupName)) {
        counts.set(groupName, new Map<number, number>());
      }
      const groupMap = counts.get(groupName)!;
      groupMap.set(statusDefinition.priority, (groupMap.get(statusDefinition.priority) ?? 0) + 1);
    });

    counts.forEach((statusMap, groupName) => {
      // Emit rows in defined status order first
      STATUS_DEFINITIONS.forEach(def => {
        const count = statusMap.get(def.priority);
        if (count !== undefined && count > 0) {
          frame.add({
            Group: groupName,
            Status: def.priority,
            Count: count,
          });
          statusMap.delete(def.priority);
        }
      });

      // Emit any unknown statuses
      statusMap.forEach((count, priority) => {
        if (count > 0) {
          frame.add({
            Group: groupName,
            Status: priority,
            Count: count,
          });
        }
      });
    });

    return frame;
  }

  private buildEqualityFilter(field: string, values?: string[]): string | undefined {
    if (!values || values.length === 0) {
      return undefined;
    }

    const clauses = values
      .map(value => value?.toString().trim())
      .filter((value): value is string => !!value && value.length > 0)
      .map(value => `${field} = ${this.quoteFilterValue(value)}`);

    if (!clauses.length) {
      return undefined;
    }

    return clauses.length === 1 ? clauses[0] : `(${clauses.join(' OR ')})`;
  }

  private buildContainsFilter(field: string, values?: string[]): string | undefined {
    if (!values || values.length === 0) {
      return undefined;
    }

    const clauses = values
      .map(value => value?.toString().trim())
      .filter((value): value is string => !!value && value.length > 0)
      .map(value => `${field} contains ${this.quoteFilterValue(value)}`);

    if (!clauses.length) {
      return undefined;
    }

    return clauses.length === 1 ? clauses[0] : `(${clauses.join(' OR ')})`;
  }

  private quoteFilterValue(value: string): string {
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${escaped}'`;
  }

  async getMetadata(forceRefresh = false): Promise<PRTGMetadata> {
    if (!forceRefresh && this.metadataCache) {
      return this.metadataCache;
    }

    if (!forceRefresh && this.metadataPromise) {
      return this.metadataPromise;
    }

    this.metadataPromise = this.apiClient.getMetadata().catch(error => {
      console.error('Failed to fetch PRTG metadata:', error);
      throw error;
    }).finally(() => {
      this.metadataPromise = undefined;
    });

    this.metadataCache = await this.metadataPromise;
    return this.metadataCache;
  }
}
