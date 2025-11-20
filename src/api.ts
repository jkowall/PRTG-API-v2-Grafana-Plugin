import { getBackendSrv } from '@grafana/runtime';
import { PRTGMetadata, PRTGObject } from './types';

export interface PRTGApiClientOptions {
  url: string;
  port: number;
  apiKey: string;
  allowInsecure: boolean;
  datasourceId?: number;
}

export interface PRTGQueryOptions {
  endpoint: string;
  filter?: string;
  limit?: number;
  offset?: number;
  columns?: string[];
}

export interface PRTGApiResponse<T = any> {
  data: T[];
  total?: number;
  offset?: number;
  limit?: number;
}

export class PRTGApiClient {
  private baseUrl: string;
  private apiKey: string;
  private datasourceId?: number;
  private useProxy: boolean;
  // private allowInsecure: boolean; // TODO: Implement SSL verification settings

  constructor(options: PRTGApiClientOptions) {
    this.baseUrl = `${options.url}:${options.port}/api/v2`;
    this.apiKey = options.apiKey || '';
    this.datasourceId = options.datasourceId;
    this.useProxy = !!this.datasourceId; // Use proxy if datasourceId is available
    
    // Validate required configuration
    if (!options.url) {
      console.warn('PRTG API: URL is not configured');
    }
    if (!this.apiKey && !this.useProxy) {
      console.warn('PRTG API: API Key is not configured');
    }
    
    // Log proxy configuration for debugging
    console.log('PRTG API Client initialized:', {
      useProxy: this.useProxy,
      datasourceId: this.datasourceId,
      hasApiKey: !!this.apiKey,
      baseUrl: this.useProxy ? 'Using proxy route' : this.baseUrl,
    });
    // this.allowInsecure = options.allowInsecure; // TODO: Implement SSL verification
  }

  async query(options: PRTGQueryOptions): Promise<PRTGApiResponse<PRTGObject>> {
    const { endpoint, filter, limit, offset, columns } = options;
    
    const params: Record<string, string> = {};
    
    if (filter) {
      params.filter = filter;
    }
    if (limit !== undefined) {
      params.limit = limit.toString();
    }
    if (offset !== undefined) {
      params.offset = offset.toString();
    }
    if (columns && columns.length > 0) {
      params.columns = columns.join(',');
    }

    const url = this.buildUrl(endpoint, params);
    
    console.log('PRTG API query:', {
      endpoint,
      url,
      useProxy: this.useProxy,
      hasApiKey: !!this.apiKey,
    });
    
    try {
      const headers = this.useProxy ? {} : this.getHeaders();
      
      const response = await getBackendSrv().fetch<PRTGObject[]>({
        url,
        method: 'GET',
        headers,
      }).toPromise();

      return {
        data: response?.data || [],
        total: response?.data?.length || 0,
        offset: offset || 0,
        limit: limit || 0,
      };
    } catch (error) {
      console.error('PRTG API request failed:', error);
      throw new Error(`Failed to fetch data from PRTG API: ${error}`);
    }
  }

  async testConnection(): Promise<void> {
    // Validate configuration before attempting connection
    if (!this.useProxy && !this.apiKey) {
      throw new Error('API Key is not configured. Please configure the API Key in the datasource settings.');
    }
    
    if (!this.baseUrl || this.baseUrl.includes('undefined')) {
      throw new Error('Server URL is not configured. Please configure the PRTG server URL in the datasource settings.');
    }

    // Test the connection by making a simple API call
    try {
      const url = this.buildUrl('experimental/objects', { limit: '1' });
      const headers = this.useProxy ? {} : this.getHeaders();
      
      await getBackendSrv().fetch({
        url,
        method: 'GET',
        headers,
      }).toPromise();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Connection test failed: ${errorMessage}`);
    }
  }

  private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    let baseUrl: string;
    
    if (this.useProxy && this.datasourceId) {
      // Use Grafana's datasource proxy to handle authentication securely
      // The proxy route already includes /api/v2 in plugin.json
      baseUrl = `/api/datasources/proxy/${this.datasourceId}/prtg/${endpoint}`;
    } else {
      // Direct connection (for backwards compatibility or testing)
      baseUrl = `${this.baseUrl}/${endpoint}`;
    }
    
    const url = new URL(baseUrl, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async getMetadata(limit = 1000): Promise<PRTGMetadata> {
    const response = await this.query({
      endpoint: 'experimental/objects',
      limit,
      columns: ['group', 'device', 'kind_name', 'tags'],
    });

    const groups = new Set<string>();
    const devices = new Set<string>();
    const tags = new Set<string>();
    const sensorTypes = new Set<string>();

    response.data.forEach(item => {
      if (item.group) {
        groups.add(item.group);
      }
      if (item.device) {
        devices.add(item.device);
      }
      if (item.kind_name) {
        sensorTypes.add(item.kind_name);
      }
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag) {
            tags.add(tag);
          }
        });
      }
    });

    const toSortedArray = (set: Set<string>) => Array.from(set.values()).filter(Boolean).sort((a, b) => a.localeCompare(b));

    const metadata: PRTGMetadata = {
      groups: toSortedArray(groups),
      devices: toSortedArray(devices),
      tags: toSortedArray(tags),
      sensorTypes: toSortedArray(sensorTypes),
      fetchedAt: Date.now(),
    };

    console.log('PRTG metadata fetched:', {
      groups: metadata.groups.length,
      devices: metadata.devices.length,
      tags: metadata.tags.length,
      sensorTypes: metadata.sensorTypes.length,
      limit,
    });

    return metadata;
  }
}
