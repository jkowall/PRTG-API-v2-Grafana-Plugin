import { getBackendSrv } from '@grafana/runtime';
import { PRTGObject } from './types';

export interface PRTGApiClientOptions {
  url: string;
  port: number;
  apiKey: string;
  allowInsecure: boolean;
}

export interface PRTGQueryOptions {
  endpoint: string;
  filter?: string;
  limit?: number;
  offset?: number;
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
  // private allowInsecure: boolean; // TODO: Implement SSL verification settings

  constructor(options: PRTGApiClientOptions) {
    this.baseUrl = `${options.url}:${options.port}/api/v2`;
    this.apiKey = options.apiKey || '';
    
    // Validate required configuration
    if (!options.url) {
      console.warn('PRTG API: URL is not configured');
    }
    if (!this.apiKey) {
      console.warn('PRTG API: API Key is not configured');
    }
    // this.allowInsecure = options.allowInsecure; // TODO: Implement SSL verification
  }

  async query(options: PRTGQueryOptions): Promise<PRTGApiResponse<PRTGObject>> {
    const { endpoint, filter, limit, offset } = options;
    
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

    const url = this.buildUrl(endpoint, params);
    
    try {
      const response = await getBackendSrv().fetch<PRTGObject[]>({
        url,
        method: 'GET',
        headers: this.getHeaders(),
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
    if (!this.apiKey) {
      throw new Error('API Key is not configured. Please configure the API Key in the datasource settings.');
    }
    
    if (!this.baseUrl || this.baseUrl.includes('undefined')) {
      throw new Error('Server URL is not configured. Please configure the PRTG server URL in the datasource settings.');
    }

    // Test the connection by making a simple API call
    try {
      const url = this.buildUrl('experimental/objects', { limit: '1' });
      await getBackendSrv().fetch({
        url,
        method: 'GET',
        headers: this.getHeaders(),
      }).toPromise();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Connection test failed: ${errorMessage}`);
    }
  }

  async getObjects(filter?: string, limit?: number, offset?: number): Promise<PRTGApiResponse<PRTGObject>> {
    return this.query({
      endpoint: 'experimental/objects',
      filter,
      limit,
      offset,
    });
  }

  async getObjectsDown(limit?: number): Promise<PRTGApiResponse<PRTGObject>> {
    return this.getObjects('status = down', limit);
  }

  async getObjectsWarning(limit?: number): Promise<PRTGApiResponse<PRTGObject>> {
    return this.getObjects('status = warning', limit);
  }

  async getObjectsPaused(limit?: number): Promise<PRTGApiResponse<PRTGObject>> {
    return this.getObjects('status = paused', limit);
  }

  private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
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
}
