import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { PRTGDataSourceOptions, PRTGSecureJsonData } from '../types';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<PRTGDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    let url = event.target.value.trim();
    
    // Remove any port that might have been added
    url = url.replace(/:\d+$/, '');
    
    // Ensure protocol
    if (url && !url.match(/^https?:\/\//)) {
      url = `https://${url}`;
    }
    
    const jsonData = {
      ...options.jsonData,
      url: url,
    };
    
    onOptionsChange({ ...options, jsonData });
  };

  onPortChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const port = parseInt(event.target.value, 10) || 1616;
    
    const jsonData = {
      ...options.jsonData,
      port: port,
    };
    
    onOptionsChange({ ...options, jsonData });
  };


  onAllowInsecureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      allowInsecure: event.target.checked,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (password) change handler
  onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: event.target.value,
      },
    });
  };

  onResetAPIKey = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as PRTGSecureJsonData;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="PRTG Server URL"
            labelWidth={10}
            inputWidth={20}
            onChange={this.onURLChange}
            value={jsonData.url || ''}
            placeholder="https://monitoring.prtg.server"
            tooltip="The base URL of your PRTG server (without port)"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Port"
            labelWidth={10}
            inputWidth={20}
            onChange={this.onPortChange}
            value={jsonData.port || 1616}
            placeholder="1616"
            tooltip="The port number for PRTG API v2 (default: 1616)"
            type="number"
          />
        </div>

        <div className="gf-form">
          <div className="gf-form-label width-10">Options</div>
          <div className="gf-form-switch">
            <label className="gf-form-label">
              <input
                type="checkbox"
                checked={jsonData.allowInsecure || false}
                onChange={this.onAllowInsecureChange}
              />
              Allow insecure SSL
            </label>
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.apiKey) as boolean}
              value={secureJsonData.apiKey || ''}
              label="API Key"
              placeholder="Your PRTG API Key"
              labelWidth={10}
              inputWidth={20}
              onReset={this.onResetAPIKey}
              onChange={this.onAPIKeyChange}
              tooltip="The API key for authenticating with PRTG (read-only recommended)"
            />
          </div>
        </div>

        <div className="gf-form-group">
          <div className="gf-form">
            <div className="gf-form-label width-10">Help</div>
            <div className="gf-form-label">
              <p>
                Make sure PRTG API v2 is enabled on your server. 
                You can find the API documentation at: https://your-prtg-server:1616/api/v2/oas/
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
