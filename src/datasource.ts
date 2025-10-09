import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { PRTGDataSourceOptions, PRTGQuery, PRTGSecureJsonData, PRTGObject } from './types';
import { PRTGApiClient } from './api';

export class PRTGDataSource extends DataSourceApi<PRTGQuery, PRTGDataSourceOptions> {
  private apiClient: PRTGApiClient;

  constructor(instanceSettings: DataSourceInstanceSettings<PRTGDataSourceOptions>) {
    super(instanceSettings);

    const { url, port = 1616, allowInsecure = false } = instanceSettings.jsonData;
    const secureJsonData = (instanceSettings as any).decryptedSecureJsonData || {};
    const apiKey = (secureJsonData as PRTGSecureJsonData)?.apiKey || '';

    this.apiClient = new PRTGApiClient({
      url: url || '',
      port,
      apiKey,
      allowInsecure,
    });
  }

  async query(options: DataQueryRequest<PRTGQuery>): Promise<DataQueryResponse> {
    // const { range } = options; // TODO: Use range for time-based queries
    const data: MutableDataFrame[] = [];

    for (const target of options.targets) {
      if (target.hide || !target.endpoint) {
        continue;
      }

      try {
        const response = await this.apiClient.query({
          endpoint: target.endpoint,
          filter: target.filter,
          limit: target.limit,
          offset: target.offset,
        });

        const frame = new MutableDataFrame({
          refId: target.refId,
          fields: this.createFields(response.data, target.columns),
        });

        // Add data to the frame
        for (const item of response.data) {
          frame.add(this.transformObjectToRow(item, target.columns));
        }

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

  private createFields(data: PRTGObject[], columns?: string[]) {
    if (!data.length) {
      return [];
    }

    const sampleObject = data[0];
    const fieldsToShow = columns || Object.keys(sampleObject);

    return fieldsToShow.map(fieldName => ({
      name: this.formatFieldName(fieldName),
      type: this.getFieldType(sampleObject[fieldName as keyof PRTGObject]),
    }));
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private getFieldType(value: any): FieldType {
    if (typeof value === 'number') {
      return FieldType.number;
    }
    if (typeof value === 'boolean') {
      return FieldType.boolean;
    }
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return FieldType.time;
    }
    return FieldType.string;
  }

  private transformObjectToRow(obj: PRTGObject, columns?: string[]) {
    const fieldsToShow = columns || Object.keys(obj);
    const row: any = {};

    for (const field of fieldsToShow) {
      const value = obj[field as keyof PRTGObject];
      
      // Handle nested objects like parent.name
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.');
        const parentObj = obj[parentKey as keyof PRTGObject] as any;
        row[this.formatFieldName(field)] = parentObj?.[childKey] || null;
      } else {
        row[this.formatFieldName(field)] = value;
      }
    }

    return row;
  }
}
