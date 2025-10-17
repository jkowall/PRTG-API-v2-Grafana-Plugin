import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface PRTGQuery extends DataQuery {
  objectTypes?: string[]; // Multi-select: channel, sensor, device, group, probe
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
