export interface LaunchConfiguration {
    name: string;
    type: string;
    request?: 'launch' | 'attach';
    // Make it completely generic to handle any launch configuration type
    [key: string]: unknown;
}

export interface TaskConfiguration {
    label: string;
    type: string;
    // Make it completely generic to handle any task configuration type
    [key: string]: unknown;
}

export interface ConfigurationItem {
    id: string;
    name: string;
    type: 'launch' | 'task';
    configuration: LaunchConfiguration | TaskConfiguration;
    icon?: string;
    usageCount?: number;
    lastUsed?: Date;
}
