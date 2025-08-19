import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigurationProvider } from './configurationProvider';
import { ConfigurationManager } from './configurationManager';
import { ConfigurationItem } from './types';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Run Configurations extension is now active!');

    // Initialize the configuration manager
    const configManager = new ConfigurationManager();
    
    // Initialize the tree view provider
    const configProvider = new ConfigurationProvider(configManager);
    
    // Register the tree view
    const treeView = vscode.window.createTreeView('runConfigs', {
        treeDataProvider: configProvider,
        showCollapseAll: true
    });

    // Register the main command to show configurations modal
    const editConfigurationsCommand = vscode.commands.registerCommand('runConfigs.editConfigurations', () => {
        showConfigurationsModal(configManager, context);
    });

    const runConfigurationCommand = vscode.commands.registerCommand('runConfigs.runConfiguration', (item) => {
        if (item && item.configuration) {
            configManager.runConfiguration(item);
        }
    });

    // Add refresh capability
    const refreshCommand = vscode.commands.registerCommand('runConfigs.refresh', () => {
        configProvider.refresh();
    });

    // Add create new configuration command
    const createNewConfigCommand = vscode.commands.registerCommand('runConfigs.createNew', async () => {
        // Show a quick picker for configuration type
        const configType = await vscode.window.showQuickPick([
            { label: 'Launch Configuration', description: 'Debug/Run configuration', value: 'launch' },
            { label: 'Task Configuration', description: 'Build/Custom task', value: 'task' }
        ], { placeHolder: 'Select configuration type to create' });
        
        if (configType && (configType.value === 'launch' || configType.value === 'task')) {
            try {
                // Create a new configuration with empty fields
                const newConfigId = await configManager.createNewConfiguration(configType.value as 'launch' | 'task');
                await configManager.loadConfigurations();
                configProvider.refresh();
                
                // Directly open webview in edit mode for the new configuration
                showConfigurationsModal(configManager, context, false, newConfigId);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create configuration: ${error}`);
            }
        }
    });

    // Add delete configuration command
    const deleteConfigCommand = vscode.commands.registerCommand('runConfigs.deleteConfiguration', async (item) => {
        if (item && item.configItem) {
            const result = await vscode.window.showWarningMessage(
                `Are you sure you want to delete the configuration "${item.configItem.name}"?`,
                { modal: true },
                'Delete'
            );
            
            if (result === 'Delete') {
                try {
                    await configManager.deleteConfiguration(item.configItem.id);
                    await configManager.loadConfigurations();
                    configProvider.refresh();
                    vscode.window.showInformationMessage('Configuration deleted successfully!');
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to delete configuration: ${error}`);
                }
            }
        }
    });

    // Add simple quick run command for recent configurations
    const quickRunCommand = vscode.commands.registerCommand('runConfigs.quickRun', async () => {
        const allConfigs = configManager.getAllConfigurations();
        
        if (allConfigs.length === 0) {
            vscode.window.showInformationMessage('No configurations available');
            return;
        }

        // Show all configurations with usage info
        const quickPickItems = allConfigs.map(config => ({
            label: config.name,
            description: `${config.type}${config.usageCount ? ` • Used ${config.usageCount} times` : ''}`,
            config: config
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a configuration to run',
            matchOnDescription: true
        });

        if (selected) {
            await configManager.runConfiguration(selected.config);
            configProvider.refresh();
        }
    });

    // Watch for configuration file changes
    const launchWatcher = vscode.workspace.createFileSystemWatcher('**/.vscode/launch.json');
    const tasksWatcher = vscode.workspace.createFileSystemWatcher('**/.vscode/tasks.json');
    
    const refreshConfigs = () => {
        console.log('🔄 Configuration files changed, refreshing...');
        configProvider.refresh();
    };
    
    launchWatcher.onDidChange(refreshConfigs);
    launchWatcher.onDidCreate(refreshConfigs);
    launchWatcher.onDidDelete(refreshConfigs);
    
    tasksWatcher.onDidChange(refreshConfigs);
    tasksWatcher.onDidCreate(refreshConfigs);
    tasksWatcher.onDidDelete(refreshConfigs);

    context.subscriptions.push(
        editConfigurationsCommand,
        runConfigurationCommand,
        refreshCommand,
        createNewConfigCommand,
        deleteConfigCommand,
        quickRunCommand,
        treeView,
        launchWatcher,
        tasksWatcher
    );
}

let currentPanel: vscode.WebviewPanel | undefined = undefined;

function showConfigurationsModal(configManager: ConfigurationManager, context: vscode.ExtensionContext, createNew: boolean = false, editConfigId?: string) {
    const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

    if (currentPanel) {
        currentPanel.reveal(column);
        return;
    }

    currentPanel = vscode.window.createWebviewPanel(
        'runConfigs',
        'Run/Debug Configurations',
        column || vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });

    updateWebviewContent(currentPanel, configManager, context, createNew, undefined, editConfigId);

    currentPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'refresh': {
                    await configManager.loadConfigurations();
                    updateWebviewContent(currentPanel!, configManager, context, false);
                    break;
                }
                case 'runConfiguration': {
                    const config = configManager.getAllConfigurations().find(c => c.id === message.id);
                    if (config) {
                        await configManager.runConfiguration(config);
                    }
                    break;
                }
                case 'createNew': {
                    // Show a quick picker for configuration type
                    const configType = await vscode.window.showQuickPick([
                        { label: 'Launch Configuration', description: 'Debug/Run configuration', value: 'launch' },
                        { label: 'Task Configuration', description: 'Build/Custom task', value: 'task' }
                    ], { placeHolder: 'Select configuration type to create' });
                    
                    if (configType && (configType.value === 'launch' || configType.value === 'task')) {
                        // Create a new configuration with empty fields
                        const newConfigId = await configManager.createNewConfiguration(configType.value as 'launch' | 'task');
                        await configManager.loadConfigurations();
                        updateWebviewContent(currentPanel!, configManager, context, true, configType.value);
                        
                        // Send message to immediately enter edit mode for the new configuration
                        setTimeout(() => {
                            currentPanel!.webview.postMessage({
                                command: 'enterEditMode',
                                configId: newConfigId
                            });
                        }, 200);
                    }
                    break;
                }
                case 'saveConfiguration': {
                    await configManager.saveConfiguration(message.configId, message.updatedConfig);
                    await configManager.loadConfigurations();
                    updateWebviewContent(currentPanel!, configManager, context, false);
                    vscode.window.showInformationMessage('Configuration saved successfully!');
                    break;
                }
                case 'saveAndRunConfiguration': {
                    await configManager.saveConfiguration(message.configId, message.updatedConfig);
                    await configManager.loadConfigurations();
                    const savedConfig = configManager.getAllConfigurations().find(c => c.id === message.configId);
                    if (savedConfig) {
                        await configManager.runConfiguration(savedConfig);
                    }
                    updateWebviewContent(currentPanel!, configManager, context, false);
                    break;
                }
                case 'deleteConfiguration': {
                    const result = await vscode.window.showWarningMessage(
                        `Are you sure you want to delete the configuration "${message.configName}"?`,
                        { modal: true },
                        'Delete'
                    );
                    
                    if (result === 'Delete') {
                        await configManager.deleteConfiguration(message.configId);
                        await configManager.loadConfigurations();
                        updateWebviewContent(currentPanel!, configManager, context, false);
                        vscode.window.showInformationMessage('Configuration deleted successfully!');
                    }
                    break;
                }
            }
        }
    );
}

function updateWebviewContent(panel: vscode.WebviewPanel, configManager: ConfigurationManager, context: vscode.ExtensionContext, createNew: boolean = false, newConfigType?: string, selectConfigId?: string) {
    const configurations = configManager.getAllConfigurations();
    
    panel.webview.html = getWebviewContent(configurations, context);
    
    // Send a message to ensure buttons are properly initialized
    setTimeout(() => {
        panel.webview.postMessage({ 
            command: 'ensureButtonsVisible',
            configurationsCount: configurations.length,
            createNew: createNew,
            newConfigType: newConfigType,
            selectConfigId: selectConfigId
        });
        
        // Also send the fresh configurations data
        panel.webview.postMessage({
            command: 'updateConfigurations',
            configurations: configurations
        });
        
        // If we have a specific config to edit, select and edit it
        if (selectConfigId) {
            setTimeout(() => {
                panel.webview.postMessage({
                    command: 'selectAndEdit',
                    configId: selectConfigId
                });
            }, 200);
        }
    }, 100);
}

function generateConfigurationDetails(config: ConfigurationItem): string {
    let html = '<div class="property">';
    html += '<div class="property-label">Name:</div>';
    html += '<div class="property-value">' + config.name + '</div>';
    html += '</div>';
    
    html += '<div class="property">';
    html += '<div class="property-label">Type:</div>';
    html += '<div class="property-value">' + config.type + '</div>';
    html += '</div>';
    
    // Generic property display - automatically show all properties
    const configuration = config.configuration as Record<string, unknown>;
    
    // Skip the properties we already displayed (name, type)
    const skipProperties = ['name', 'type'];
    
    for (const [key, value] of Object.entries(configuration)) {
        if (skipProperties.includes(key) || value === undefined || value === null) {
            continue;
        }
        
        html += '<div class="property">';
        html += '<div class="property-label">' + formatPropertyLabel(key) + ':</div>';
        html += '<div class="property-value">' + formatPropertyValue(value) + '</div>';
        html += '</div>';
    }
    
    return html;
}

function formatPropertyLabel(key: string): string {
    // Convert camelCase to Title Case
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function formatPropertyValue(value: unknown): string {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '<em>empty array</em>';
        }
        return value.map(item => 
            typeof item === 'string' ? item : JSON.stringify(item)
        ).join(', ');
    } else if (typeof value === 'object' && value !== null) {
        // Format objects (like env variables) nicely
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return '<em>empty object</em>';
        }
        return entries.map(([k, v]) => 
            `<div style="margin-bottom: 4px; padding-left: 12px;"><strong>${k}:</strong> ${v}</div>`
        ).join('');
    } else if (typeof value === 'boolean') {
        return value ? '✓ true' : '✗ false';
    } else if (typeof value === 'string') {
        // Handle long strings by truncating if needed
        if (value.length > 100) {
            return value.substring(0, 100) + '...';
        }
        return value;
    } else {
        return String(value);
    }
}

function getWebviewContent(configurations: ConfigurationItem[], context: vscode.ExtensionContext): string {
    try {
        // Read CSS and JS files
        const cssPath = path.join(context.extensionPath, 'src', 'webview.css');
        const jsPath = path.join(context.extensionPath, 'src', 'webview.js');
        
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Run/Debug Configurations</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    <div class="container">
        <div class="left-panel">
            <div class="toolbar">
                <button onclick="refresh()">🔄 Refresh</button>
                <button onclick="createNewConfiguration()">➕ Create New</button>
            </div>
            <div class="config-list">
                ${configurations.length === 0 ? `
                    <div class="empty-state">
                        <p><strong>No configurations found</strong></p>
                        <p>Create launch.json or tasks.json files to get started</p>
                    </div>
                ` : configurations.map((config, index) => `
                    <div class="config-item ${index === 0 ? 'selected' : ''}" 
                         onclick="selectConfiguration('${config.id}', ${index})">
                        <div class="config-icon">${config.type === 'launch' ? '🚀' : config.type === 'task' ? '⚙️' : '📋'}</div>
                        <div class="config-details">
                            <div class="config-name">${config.name}</div>
                            <div class="config-type">${config.type}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="right-panel">
            <div class="right-panel-header">
                <span id="selectedConfigName">Configuration Details</span>
                <div class="header-buttons">
                    <button class="edit-button" onclick="toggleEditMode()" id="editButton" style="display: none;">
                        ✏️ Edit
                    </button>
                    <button class="delete-button" onclick="deleteConfiguration()" id="deleteButton" style="display: none;">
                        🗑️ Delete
                    </button>
                    <button class="save-button" onclick="saveConfiguration()" id="saveButton" style="display: none;">
                        💾 Save
                    </button>
                    <button class="save-run-button" onclick="saveAndRunConfiguration()" id="saveRunButton" style="display: none;">
                        ▶️ Save & Run
                    </button>
                    <button class="cancel-button" onclick="cancelEdit()" id="cancelButton" style="display: none;">
                        ❌ Cancel
                    </button>
                    <button class="run-button" onclick="runSelectedConfiguration()" id="runButton" style="display: none;">
                        ▶ Run
                    </button>
                </div>
            </div>
            <div class="config-details-panel" id="configDetailsPanel">${configurations.length === 0 ? `
                    <div class="empty-state">
                        <p><strong>No configuration selected</strong></p>
                        <p>Select a configuration from the list to view its details</p>
                    </div>
                ` : generateConfigurationDetails(configurations[0])}
            </div>
        </div>
    </div>

    <script>
        ${jsContent}
        
        // Initialize with the configurations data
        initialize(${JSON.stringify(configurations)});
    </script>
</body>
</html>`;
    } catch (error) {
        console.error('Error loading webview files:', error);
        return `<!DOCTYPE html>
<html><body><h1>Error loading webview content</h1><p>${error}</p></body></html>`;
    }
}

export function deactivate() {}
