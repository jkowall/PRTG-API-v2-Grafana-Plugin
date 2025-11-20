import { DataQuery, DataSourceJsonData } from '@grafana/data';

export type PRTGColumnPreset = 'essential' | 'network' | 'full' | 'troubleshooting' | 'custom';

export type PRTGQueryViewMode = 'table' | 'heatmap';

export interface PRTGQuery extends DataQuery {
  queryName?: string; // Optional friendly name for the query
  viewMode?: PRTGQueryViewMode; // Table (default) or status heatmap aggregation
  columnPreset?: PRTGColumnPreset; // Column preset selection
  objectTypes?: string[]; // Multi-select: channel, sensor, device, group, probe
  sensorTypes?: string[]; // Sensor type filter (kind/kind_name)
  groups?: string[]; // Group filter values
  devices?: string[]; // Device filter values
  tags?: string[]; // Tag filter values
  statuses?: string[]; // Multi-select: up, down, warning, paused
  filter?: string; // Custom filter using PRTG API v2 filter syntax
  limit?: number;
  offset?: number;
  columns?: string[];
  format?: 'table' | 'timeseries';
}

export interface PRTGDataSourceOptions extends DataSourceJsonData {
  url?: string;
  port?: number;
  allowInsecure?: boolean;
}

export interface PRTGSecureJsonData {
  apiKey?: string;
}

export interface PRTGMetadata {
  groups: string[];
  devices: string[];
  tags: string[];
  sensorTypes: string[];
  fetchedAt: number;
}

export interface PRTGObject {
  objid: number;
  name: string;
  type: string;
  tags: string[];
  active: boolean;
  status: string;
  status_raw: number;
  message: string;
  message_raw: string;
  lastcheck: string;
  lastup: string;
  lastdown: string;
  device: string;
  group: string;
  probe: string;
  grpdev: string;
  notifiesx: string;
  intervalx: string;
  access: string;
  dependency: string;
  position: string;
  icon: string;
  comments: string;
  host: string;
  condition: string;
  basetype: string;
  baselink: string;
  parentid: number;
  location: string;
  fold: boolean;
  foldername: string;
  groupnum: number;
  devicenum: number;
  favorite: boolean;
  usergroup: string;
  readonly: boolean;
  upsens: number;
  downsens: number;
  downacksens: number;
  partialdownsens: number;
  warnsens: number;
  pausedsens: number;
  unusualsens: number;
  undefinedsens: number;
  totalsens: number;
  schedule: string;
  period: string;
  email: string;
  emailx: string;
  pushx: string;
  ticketx: string;
  sms: string;
  snmpx: string;
  httpx: string;
  programx: string;
  amazonx: string;
  kind: string;
  kind_name: string;
  kind_raw: number;
  parent?: {
    name: string;
    objid: number;
  };
}
