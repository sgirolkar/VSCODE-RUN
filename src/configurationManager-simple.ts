import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LaunchConfiguration, TaskConfiguration, ConfigurationItem } from './types';

export class ConfigurationManager {
    private launchConfigurations: LaunchConfiguration[] = [];
    private taskConfigurations: TaskConfiguration[] = [];
    private usageData: { [configId: string]: { count: number; lastUsed: string } } = {};
    private readonly usageFile: string;

    constructor() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        this.usageFile = workspaceFolder ? 
            path.join(workspaceFolder.uri.fsPath, '.vscode', 'run-config-usage.json') : '';
        this.loadUsageData();
        this.loadConfigurations();
    }

    public async loadConfigurations(): Promise<void> {
        this.launchConfigurations = await this.loadLaunchConfigurations();
        this.taskConfigurations = await this.loadTaskConfigurations();
    }

    private loadUsageData(): void {
        try {
            if (fs.existsSync(this.usageFile)) {
                const content = fs.readFileSync(this.usageFile, 'utf8');
                this.usageData = JSON.parse(content);
            }
        } catch (error) {
            console.error('Error loading usage data:', error);
            this.usageData = {};
        }
    }

    private saveUsageData(): void {
        try {
            const vscodePath = path.dirname(this.usageFile);
            if (!fs.existsSync(vscodePath)) {
                fs.mkdirSync(vscodePath, { recursive: true });
            }
            fs.writeFileSync(this.usageFile, JSON.stringify(this.usageData, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving usage data:', error);
        }
    }

    private updateUsage(configId: string): void {
        if (!this.usageData[configId]) {
            this.usageData[configId] = { count: 0, lastUsed: new Date().toISOString() };
        }
        
        this.usageData[configId].count++;
        this.usageData[configId].lastUsed = new Date().toISOString();
        this.saveUsageData();
    }

    private async loadLaunchConfigurations(): Promise<LaunchConfiguration[]> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
        
        try {
            if (!fs.existsSync(launchJsonPath)) {
                return [];
            }
            
            const content = fs.readFileSync(launchJsonPath, 'utf8');
            const cleanContent = this.stripJsonComments(content);
            const launchConfig = JSON.parse(cleanContent);
            
            return launchConfig.configurations || [];
        } catch (error) {
            console.error('Error loading launch configurations:', error);
            return [];
        }
    }

    private async loadTaskConfigurations(): Promise<TaskConfiguration[]> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const tasksJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'tasks.json');
        
        try {
            if (!fs.existsSync(tasksJsonPath)) {
                return [];
            }
            
            const content = fs.readFileSync(tasksJsonPath, 'utf8');
            const cleanContent = this.stripJsonComments(content);
            const tasksConfig = JSON.parse(cleanContent);
            
            return tasksConfig.tasks || [];
        } catch (error) {
            console.error('Error loading task configurations:', error);
            return [];
        }
    }

    private stripJsonComments(jsonString: string): string {
        // Simple comment removal for JSON with comments
        let result = '';
        let inString = false;
        let inSingleLineComment = false;
        let inMultiLineComment = false;
        let escaped = false;
        
        for (let i = 0; i < jsonString.length; i++) {
            const char = jsonString[i];
            const nextChar = jsonString[i + 1];
            
            if (escaped) {
                result += char;
                escaped = false;
                continue;
            }
            
            if (char === '\\' && inString) {
                escaped = true;
                result += char;
                continue;
            }
            
            if (char === '"' && !inSingleLineComment && !inMultiLineComment) {
                inString = !inString;
                result += char;
                continue;
            }
            
            if (inString) {
                result += char;
                continue;
            }
            
            if (inSingleLineComment) {
                if (char === '\n' || char === '\r') {
                    inSingleLineComment = false;
                    result += char;
                }
                continue;
            }
            
            if (inMultiLineComment) {
                if (char === '*' && nextChar === '/') {
                    inMultiLineComment = false;
                    i++;
                }
                continue;
            }
            
            if (char === '/' && nextChar === '/') {
                inSingleLineComment = true;
                i++;
                continue;
            }
            
            if (char === '/' && nextChar === '*') {
                inMultiLineComment = true;
                i++;
                continue;
            }
            
            result += char;
        }
        
        return result;
    }

    public getAllConfigurations(): ConfigurationItem[] {
        const items: ConfigurationItem[] = [];

        // Add launch configurations
        this.launchConfigurations.forEach((config, index) => {
            const configId = `launch-${index}`;
            const usage = this.usageData[configId];
            
            items.push({
                id: configId,
                name: config.name,
                type: 'launch',
                configuration: config,
                icon: this.getIconForLaunchType(config.type),
                usageCount: usage?.count || 0,
                lastUsed: usage?.lastUsed ? new Date(usage.lastUsed) : undefined
            });
        });

        // Add task configurations
        this.taskConfigurations.forEach((config, index) => {
            const configId = `task-${index}`;
            const usage = this.usageData[configId];
            
            items.push({
                id: configId,
                name: config.label,
                type: 'task',
                configuration: config,
                icon: this.getIconForTaskType(config.type),
                usageCount: usage?.count || 0,
                lastUsed: usage?.lastUsed ? new Date(usage.lastUsed) : undefined
            });
        });

        // Simple sorting: most used first, then alphabetical
        return items.sort((a, b) => {
            const usageA = a.usageCount || 0;
            const usageB = b.usageCount || 0;
            
            // Sort by usage count first (descending)
            if (usageA !== usageB) {
                return usageB - usageA;
            }
            
            // Then alphabetically
            return a.name.localeCompare(b.name);
        });
    }

    private getIconForLaunchType(type: string): string {
        const iconMap: { [key: string]: string } = {
            'node': 'symbol-event',
            'python': 'snake',
            'chrome': 'browser',
            'extensionHost': 'extensions',
            'cppdbg': 'tools',
            'java': 'coffee'
        };
        return iconMap[type] || 'debug-alt';
    }

    private getIconForTaskType(type: string): string {
        const iconMap: { [key: string]: string } = {
            'shell': 'terminal',
            'npm': 'package',
            'typescript': 'symbol-method'
        };
        return iconMap[type] || 'tools';
    }

    public async runConfiguration(item: ConfigurationItem): Promise<void> {
        // Update usage when configuration is run
        this.updateUsage(item.id);
        
        if (item.type === 'launch') {
            await this.runLaunchConfiguration(item.configuration as LaunchConfiguration);
        } else if (item.type === 'task') {
            await this.runTaskConfiguration(item.configuration as TaskConfiguration);
        }
    }

    private async runLaunchConfiguration(config: LaunchConfiguration): Promise<void> {
        try {
            // Ensure required properties for debug configuration
            const debugConfig = {
                ...config,
                request: config.request || 'launch'
            };
            await vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], debugConfig);
            vscode.window.showInformationMessage(`Started debugging: ${config.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start debugging: ${error}`);
        }
    }

    private async runTaskConfiguration(config: TaskConfiguration): Promise<void> {
        try {
            // Safely extract command and args with type checking
            const command = typeof config.command === 'string' ? config.command : String(config.command || '');
            const args = Array.isArray(config.args) ? config.args.map(arg => String(arg)) : [];
            
            const task = new vscode.Task(
                { type: config.type, task: config.label },
                vscode.workspace.workspaceFolders?.[0] || vscode.TaskScope.Workspace,
                config.label,
                config.type,
                new vscode.ShellExecution(command, args)
            );
            
            await vscode.tasks.executeTask(task);
            vscode.window.showInformationMessage(`Started task: ${config.label}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start task: ${error}`);
        }
    }

    public async saveConfiguration(configId: string, updatedConfig: Record<string, unknown>): Promise<void> {
        const config = this.getAllConfigurations().find(c => c.id === configId);
        if (!config) {
            throw new Error(`Configuration with id ${configId} not found`);
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        if (config.type === 'launch') {
            await this.saveLaunchConfiguration(configId, updatedConfig);
        } else if (config.type === 'task') {
            await this.saveTaskConfiguration(configId, updatedConfig);
        }
    }

    public async createNewConfiguration(type: 'launch' | 'task'): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        if (type === 'launch') {
            return await this.createNewLaunchConfiguration();
        } else {
            return await this.createNewTaskConfiguration();
        }
    }

    public async deleteConfiguration(configId: string): Promise<void> {
        const config = this.getAllConfigurations().find(c => c.id === configId);
        if (!config) {
            throw new Error(`Configuration with id ${configId} not found`);
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        if (config.type === 'launch') {
            await this.deleteLaunchConfiguration(configId);
        } else if (config.type === 'task') {
            await this.deleteTaskConfiguration(configId);
        }
        
        // Also remove usage data
        delete this.usageData[configId];
        this.saveUsageData();
    }

    private async createNewLaunchConfiguration(): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
        
        // Create new empty launch configuration
        const newConfig: LaunchConfiguration = {
            name: "New Launch Configuration",
            type: "node", // Default type
            request: "launch",
            program: "${workspaceFolder}/",
            console: "integratedTerminal"
        };

        try {
            let launchJson;
            if (fs.existsSync(launchJsonPath)) {
                const content = fs.readFileSync(launchJsonPath, 'utf8');
                const cleanContent = this.stripJsonComments(content);
                launchJson = JSON.parse(cleanContent);
            } else {
                // Create directory if it doesn't exist
                const vscodePath = path.dirname(launchJsonPath);
                if (!fs.existsSync(vscodePath)) {
                    fs.mkdirSync(vscodePath, { recursive: true });
                }
                // Create new launch.json structure
                launchJson = {
                    version: "0.2.0",
                    configurations: []
                };
            }

            // Add the new configuration
            launchJson.configurations.push(newConfig);

            // Write back to file
            const updatedContent = JSON.stringify(launchJson, null, 4);
            fs.writeFileSync(launchJsonPath, updatedContent, 'utf8');

            // Return the ID that will be assigned to this configuration
            const configIndex = launchJson.configurations.length - 1;
            return `launch-${configIndex}`;
        } catch (error) {
            throw new Error(`Failed to create new launch configuration: ${error}`);
        }
    }

    private async createNewTaskConfiguration(): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const tasksJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'tasks.json');
        
        // Create new empty task configuration
        const newConfig: TaskConfiguration = {
            label: "New Task",
            type: "shell",
            command: "echo",
            args: ["Hello World"],
            group: "build"
        };

        try {
            let tasksJson;
            if (fs.existsSync(tasksJsonPath)) {
                const content = fs.readFileSync(tasksJsonPath, 'utf8');
                const cleanContent = this.stripJsonComments(content);
                tasksJson = JSON.parse(cleanContent);
            } else {
                // Create directory if it doesn't exist
                const vscodePath = path.dirname(tasksJsonPath);
                if (!fs.existsSync(vscodePath)) {
                    fs.mkdirSync(vscodePath, { recursive: true });
                }
                // Create new tasks.json structure
                tasksJson = {
                    version: "2.0.0",
                    tasks: []
                };
            }

            // Add the new configuration
            tasksJson.tasks.push(newConfig);

            // Write back to file
            const updatedContent = JSON.stringify(tasksJson, null, 4);
            fs.writeFileSync(tasksJsonPath, updatedContent, 'utf8');

            // Return the ID that will be assigned to this configuration
            const configIndex = tasksJson.tasks.length - 1;
            return `task-${configIndex}`;
        } catch (error) {
            throw new Error(`Failed to create new task configuration: ${error}`);
        }
    }

    private async saveLaunchConfiguration(configId: string, updatedConfig: Record<string, unknown>): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        
        const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
        
        try {
            let launchJson;
            if (fs.existsSync(launchJsonPath)) {
                const content = fs.readFileSync(launchJsonPath, 'utf8');
                const cleanContent = this.stripJsonComments(content);
                launchJson = JSON.parse(cleanContent);
            } else {
                // Create new launch.json structure
                launchJson = {
                    version: "0.2.0",
                    configurations: []
                };
            }

            // Find and update the configuration
            const configIndex = launchJson.configurations.findIndex((c: LaunchConfiguration) => 
                `launch-${c.name}` === configId
            );

            if (configIndex >= 0) {
                launchJson.configurations[configIndex] = updatedConfig;
            } else {
                launchJson.configurations.push(updatedConfig);
            }

            // Write back to file
            const updatedContent = JSON.stringify(launchJson, null, 4);
            fs.writeFileSync(launchJsonPath, updatedContent, 'utf8');
        } catch (error) {
            throw new Error(`Failed to save launch configuration: ${error}`);
        }
    }

    private async saveTaskConfiguration(configId: string, updatedConfig: Record<string, unknown>): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        
        const tasksJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'tasks.json');
        
        try {
            let tasksJson;
            if (fs.existsSync(tasksJsonPath)) {
                const content = fs.readFileSync(tasksJsonPath, 'utf8');
                const cleanContent = this.stripJsonComments(content);
                tasksJson = JSON.parse(cleanContent);
            } else {
                // Create new tasks.json structure
                tasksJson = {
                    version: "2.0.0",
                    tasks: []
                };
            }

            // Find and update the configuration
            const configIndex = tasksJson.tasks.findIndex((c: TaskConfiguration) => 
                `task-${c.label}` === configId
            );

            if (configIndex >= 0) {
                tasksJson.tasks[configIndex] = updatedConfig;
            } else {
                tasksJson.tasks.push(updatedConfig);
            }

            // Write back to file
            const updatedContent = JSON.stringify(tasksJson, null, 4);
            fs.writeFileSync(tasksJsonPath, updatedContent, 'utf8');
        } catch (error) {
            throw new Error(`Failed to save task configuration: ${error}`);
        }
    }

    private async deleteLaunchConfiguration(configId: string): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        
        const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
        
        try {
            if (!fs.existsSync(launchJsonPath)) {
                throw new Error('launch.json file not found');
            }

            const content = fs.readFileSync(launchJsonPath, 'utf8');
            const cleanContent = this.stripJsonComments(content);
            const launchJson = JSON.parse(cleanContent);

            // Extract index from configId (format: "launch-{index}")
            const configIndex = parseInt(configId.replace('launch-', ''));
            
            if (configIndex >= 0 && configIndex < launchJson.configurations.length) {
                // Remove the configuration at the specified index
                launchJson.configurations.splice(configIndex, 1);

                // Write back to file
                const updatedContent = JSON.stringify(launchJson, null, 4);
                fs.writeFileSync(launchJsonPath, updatedContent, 'utf8');
            } else {
                throw new Error('Configuration index out of bounds');
            }
        } catch (error) {
            throw new Error(`Failed to delete launch configuration: ${error}`);
        }
    }

    private async deleteTaskConfiguration(configId: string): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        
        const tasksJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'tasks.json');
        
        try {
            if (!fs.existsSync(tasksJsonPath)) {
                throw new Error('tasks.json file not found');
            }

            const content = fs.readFileSync(tasksJsonPath, 'utf8');
            const cleanContent = this.stripJsonComments(content);
            const tasksJson = JSON.parse(cleanContent);

            // Extract index from configId (format: "task-{index}")
            const configIndex = parseInt(configId.replace('task-', ''));
            
            if (configIndex >= 0 && configIndex < tasksJson.tasks.length) {
                // Remove the configuration at the specified index
                tasksJson.tasks.splice(configIndex, 1);

                // Write back to file
                const updatedContent = JSON.stringify(tasksJson, null, 4);
                fs.writeFileSync(tasksJsonPath, updatedContent, 'utf8');
            } else {
                throw new Error('Configuration index out of bounds');
            }
        } catch (error) {
            throw new Error(`Failed to delete task configuration: ${error}`);
        }
    }
}
