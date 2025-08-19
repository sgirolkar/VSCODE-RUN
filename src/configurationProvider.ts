import * as vscode from 'vscode';
import { ConfigurationManager } from './configurationManager';
import { ConfigurationItem } from './types';

export class ConfigurationTreeItem extends vscode.TreeItem {
    constructor(public readonly configItem: ConfigurationItem) {
        super(configItem.name, vscode.TreeItemCollapsibleState.None);
        
        let description = configItem.type;
        
        // Show usage count if > 0
        if (configItem.usageCount && configItem.usageCount > 0) {
            description += ` (${configItem.usageCount}x)`;
        }
        
        this.tooltip = `${configItem.name} (${configItem.type})`;
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(configItem.icon || 'gear');
        this.contextValue = `config-${configItem.type}`;
        
        this.command = {
            command: 'runConfigs.runConfiguration',
            title: 'Run Configuration',
            arguments: [configItem]
        };
    }
}

export class ConfigurationProvider implements vscode.TreeDataProvider<ConfigurationTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigurationTreeItem | undefined | null | void> = 
        new vscode.EventEmitter<ConfigurationTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigurationTreeItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    constructor(private configManager: ConfigurationManager) {}

    refresh(): void {
        this.configManager.loadConfigurations().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: ConfigurationTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigurationTreeItem): Promise<ConfigurationTreeItem[]> {
        if (!element) {
            // Root level - return all configurations sorted by usage
            const configurations = this.configManager.getAllConfigurations();
            return Promise.resolve(
                configurations.map((config: ConfigurationItem) => new ConfigurationTreeItem(config))
            );
        }
        
        return Promise.resolve([]);
    }

    getParent(): vscode.ProviderResult<ConfigurationTreeItem> {
        return null;
    }
}
