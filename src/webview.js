/* eslint-env browser */
/* global acquireVsCodeApi */

// VS Code API
const vscode = acquireVsCodeApi();

// Global variables
let configurations = [];
let selectedConfigId = null;
let isEditMode = false;
let originalConfig = null;

// Initialize with data passed from extension
function initialize(configData) {
    configurations = configData;
    selectedConfigId = configurations.length > 0 ? configurations[0].id : null;
}

// Utility functions
// Utility functions

function formatPropertyLabel(key) {
    // Convert camelCase to Title Case
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function formatPropertyValue(value) {
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
            '<div style="margin-bottom: 4px; padding-left: 12px;"><strong>' + k + ':</strong> ' + v + '</div>'
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

function generateConfigurationDetails(config) {
    const container = document.createElement('div');
    
    // Name property
    const nameProperty = document.createElement('div');
    nameProperty.className = 'property';
    
    const nameLabel = document.createElement('div');
    nameLabel.className = 'property-label';
    nameLabel.textContent = 'Name:';
    nameProperty.appendChild(nameLabel);
    
    const nameValue = document.createElement('div');
    nameValue.className = 'property-value';
    nameValue.textContent = config.name;
    nameProperty.appendChild(nameValue);
    
    container.appendChild(nameProperty);
    
    // Type property
    const typeProperty = document.createElement('div');
    typeProperty.className = 'property';
    
    const typeLabel = document.createElement('div');
    typeLabel.className = 'property-label';
    typeLabel.textContent = 'Type:';
    typeProperty.appendChild(typeLabel);
    
    const typeValue = document.createElement('div');
    typeValue.className = 'property-value';
    typeValue.textContent = config.type;
    typeProperty.appendChild(typeValue);
    
    container.appendChild(typeProperty);
    
    // Generic property display - automatically show all properties
    const configuration = config.configuration;
    
    // Skip the properties we already displayed (name, type)
    const skipProperties = ['name', 'type'];
    
    for (const [key, value] of Object.entries(configuration)) {
        if (skipProperties.includes(key) || value === undefined || value === null) {
            continue;
        }
        
        const property = document.createElement('div');
        property.className = 'property';
        
        const label = document.createElement('div');
        label.className = 'property-label';
        label.textContent = formatPropertyLabel(key) + ':';
        property.appendChild(label);
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'property-value';
        valueDiv.innerHTML = formatPropertyValue(value);
        property.appendChild(valueDiv);
        
        container.appendChild(property);
    }
    
    return container;
}

// Main UI interaction functions
function selectConfiguration(id, index) {
    console.log('selectConfiguration called with ID:', id, 'index:', index);
    
    // Exit edit mode if switching configurations
    if (isEditMode) {
        cancelEdit();
    }
    
    selectedConfigId = id;
    
    // Update selection in UI
    document.querySelectorAll('.config-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Update details panel
    const config = configurations.find(c => c.id === id);
    if (config) {
        console.log('Selecting configuration:', config.name, 'Type:', config.type, 'ID:', id);
        
        document.getElementById('selectedConfigName').textContent = config.name;
        
        // Always show edit, delete and run buttons for valid configurations
        const editButton = document.getElementById('editButton');
        const deleteButton = document.getElementById('deleteButton');
        const runButton = document.getElementById('runButton');
        
        console.log('Edit button element:', editButton);
        console.log('Delete button element:', deleteButton);
        console.log('Run button element:', runButton);
        
        if (editButton) {
            editButton.style.display = 'inline-block';
            console.log('Edit button shown for', config.name);
        } else {
            console.error('Edit button not found!');
        }
        
        if (deleteButton) {
            deleteButton.style.display = 'inline-block';
            console.log('Delete button shown for', config.name);
        } else {
            console.error('Delete button not found!');
        }
        
        if (runButton) {
            runButton.style.display = 'inline-block';
            console.log('Run button shown for', config.name);
        } else {
            console.error('Run button not found!');
        }
        
        // Hide save buttons (in case we're exiting edit mode)
        document.getElementById('saveButton').style.display = 'none';
        document.getElementById('saveRunButton').style.display = 'none';
        document.getElementById('cancelButton').style.display = 'none';
        
        const configDetailsPanel = document.getElementById('configDetailsPanel');
        configDetailsPanel.innerHTML = '';
        configDetailsPanel.appendChild(generateConfigurationDetails(config));
        
        console.log('Configuration selection complete');
    } else {
        console.error('Configuration not found for ID:', id);
    }
}

function refresh() {
    vscode.postMessage({
        command: 'refresh'
    });
}

function createNewConfiguration() {
    // For now, we'll let the extension handle showing the picker
    vscode.postMessage({
        command: 'createNew'
    });
}

function deleteConfiguration() {
    if (selectedConfigId) {
        const config = configurations.find(c => c.id === selectedConfigId);
        if (config) {
            vscode.postMessage({
                command: 'deleteConfiguration',
                configId: selectedConfigId,
                configName: config.name
            });
        }
    }
}

function toggleEditMode() {
    if (isEditMode) {
        exitEditMode();
    } else {
        enterEditMode();
    }
}

function runSelectedConfiguration() {
    if (selectedConfigId) {
        vscode.postMessage({
            command: 'runConfiguration',
            id: selectedConfigId
        });
    }
}

// Edit mode functions
function enterEditMode() {
    isEditMode = true;
    const config = configurations.find(c => c.id === selectedConfigId);
    if (!config) {
        return;
    }
    
    originalConfig = JSON.parse(JSON.stringify(config));
    
    // Update button visibility
    document.getElementById('editButton').style.display = 'none';
    document.getElementById('deleteButton').style.display = 'none';
    document.getElementById('runButton').style.display = 'none';
    document.getElementById('saveButton').style.display = 'inline-block';
    document.getElementById('saveRunButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
    
    // Convert to edit form
    const configDetailsPanel = document.getElementById('configDetailsPanel');
    configDetailsPanel.innerHTML = ''; // Clear existing content
    const editForm = generateEditForm(config);
    configDetailsPanel.appendChild(editForm);
}

function exitEditMode() {
    isEditMode = false;
    
    // Update button visibility
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('deleteButton').style.display = 'inline-block';
    document.getElementById('runButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('saveRunButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
    
    // Restore view mode
    const config = configurations.find(c => c.id === selectedConfigId);
    if (config) {
        const configDetailsPanel = document.getElementById('configDetailsPanel');
        configDetailsPanel.innerHTML = '';
        configDetailsPanel.appendChild(generateConfigurationDetails(config));
    }
}

function cancelEdit() {
    exitEditMode();
    originalConfig = null;
}

function saveConfiguration() {
    const updatedConfig = collectFormData();
    vscode.postMessage({
        command: 'saveConfiguration',
        configId: selectedConfigId,
        updatedConfig: updatedConfig
    });
}

function saveAndRunConfiguration() {
    const updatedConfig = collectFormData();
    vscode.postMessage({
        command: 'saveAndRunConfiguration',
        configId: selectedConfigId,
        updatedConfig: updatedConfig
    });
}

// Form handling functions
function collectFormData() {
    const formData = {};
    const inputs = document.querySelectorAll('.property-input, .property-textarea');
    
    inputs.forEach(input => {
        const key = input.dataset.key;
        let value = input.value;
        
        // Try to parse as JSON for arrays and objects
        if (value.startsWith('[') || value.startsWith('{')) {
            try {
                value = JSON.parse(value);
            } catch {
                // Keep as string if not valid JSON
            }
        } else if (value === 'true' || value === 'false') {
            value = value === 'true';
        } else if (!isNaN(value) && value !== '') {
            value = Number(value);
        }
        
        formData[key] = value;
    });
    
    return formData;
}

function formatInputValue(value) {
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return JSON.stringify(value);
    }
    return String(value);
}

function generateEditForm(config) {
    // Create the main edit container
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-mode';
    
    // Skip the properties we already displayed (name, type)
    const skipProperties = [];
    
    for (const [key, value] of Object.entries(config.configuration)) {
        if (skipProperties.includes(key) || value === undefined || value === null) {
            continue;
        }
        
        // Create property container
        const propertyDiv = document.createElement('div');
        propertyDiv.className = 'property';
        
        // Create and append label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'property-label';
        labelDiv.textContent = formatPropertyLabel(key) + ':';
        propertyDiv.appendChild(labelDiv);
        
        // Create input element
        const formattedValue = formatInputValue(value);
        const isMultiline = formattedValue.includes('\n') || formattedValue.length > 100;
        
        let inputElement;
        if (isMultiline) {
            inputElement = document.createElement('textarea');
            inputElement.className = 'property-textarea';
            inputElement.value = formattedValue;
        } else {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'property-input';
            inputElement.value = formattedValue;
        }
        
        inputElement.dataset.key = key;
        propertyDiv.appendChild(inputElement);
        editContainer.appendChild(propertyDiv);
    }
    
    // Add new field section
    const addFieldSection = document.createElement('div');
    addFieldSection.className = 'add-field-section';
    
    const addFieldTitle = document.createElement('h4');
    addFieldTitle.textContent = 'Add New Field';
    addFieldSection.appendChild(addFieldTitle);
    
    const addFieldRow = document.createElement('div');
    addFieldRow.className = 'add-field-row';
    
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'add-field-input';
    keyInput.id = 'newFieldKey';
    keyInput.placeholder = 'Field name';
    addFieldRow.appendChild(keyInput);
    
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'add-field-input';
    valueInput.id = 'newFieldValue';
    valueInput.placeholder = 'Field value';
    addFieldRow.appendChild(valueInput);
    
    const addButton = document.createElement('button');
    addButton.className = 'add-field-button';
    addButton.textContent = '+ Add';
    addButton.onclick = addNewField;
    addFieldRow.appendChild(addButton);
    
    addFieldSection.appendChild(addFieldRow);
    editContainer.appendChild(addFieldSection);
    
    return editContainer;
}

function addNewField() {
    const keyInput = document.getElementById('newFieldKey');
    const valueInput = document.getElementById('newFieldValue');
    
    const key = keyInput.value.trim();
    const value = valueInput.value.trim();
    
    if (!key) {
        alert('Please enter a field name');
        return;
    }
    
    // Add new property input
    const addFieldSection = document.querySelector('.add-field-section');
    const newProperty = document.createElement('div');
    newProperty.className = 'property';
    
    // Create label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'property-label';
    labelDiv.textContent = formatPropertyLabel(key) + ':';
    newProperty.appendChild(labelDiv);
    
    // Create input element
    const isMultiline = value.includes('\n') || value.length > 100;
    let inputElement;
    
    if (isMultiline) {
        inputElement = document.createElement('textarea');
        inputElement.className = 'property-textarea';
        inputElement.value = value;
    } else {
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.className = 'property-input';
        inputElement.value = value;
    }
    
    inputElement.setAttribute('data-key', key);
    newProperty.appendChild(inputElement);
    
    addFieldSection.parentNode.insertBefore(newProperty, addFieldSection);
    
    // Clear inputs
    keyInput.value = '';
    valueInput.value = '';
}

// Initialization and message handling
function initializeUI() {
    console.log('Initializing UI with', configurations.length, 'configurations');
    console.log('Selected config ID:', selectedConfigId);
    
    if (configurations.length > 0) {
        // If no config is selected, select the first one
        if (!selectedConfigId && configurations.length > 0) {
            selectedConfigId = configurations[0].id;
            console.log('Auto-selecting first config:', selectedConfigId);
        }
        
        const config = configurations.find(c => c.id === selectedConfigId);
        if (config) {
            console.log('Found config:', config.name);
            document.getElementById('selectedConfigName').textContent = config.name;
            
            // Always show edit and run buttons for valid configurations
            const editButton = document.getElementById('editButton');
            const runButton = document.getElementById('runButton');
            
            if (editButton) {
                editButton.style.display = 'inline-block';
                console.log('Edit button shown for', config.name);
            } else {
                console.error('Edit button not found!');
            }
            
            if (runButton) {
                runButton.style.display = 'inline-block';
                console.log('Run button shown for', config.name);
            } else {
                console.error('Run button not found!');
            }
        } else {
            console.error('Configuration not found for ID:', selectedConfigId);
        }
    } else {
        console.log('No configurations available');
    }
}

function ensureButtonsVisible() {
    console.log('ensureButtonsVisible called');
    
    if (configurations.length > 0) {
        // Ensure a configuration is selected
        if (!selectedConfigId && configurations.length > 0) {
            selectedConfigId = configurations[0].id;
            console.log('Auto-selecting first config:', selectedConfigId);
        }
        
        const config = configurations.find(c => c.id === selectedConfigId);
        if (config) {
            console.log('Ensuring buttons for config:', config.name);
            
            const editButton = document.getElementById('editButton');
            const deleteButton = document.getElementById('deleteButton');
            const runButton = document.getElementById('runButton');
            
            if (editButton) {
                editButton.style.display = 'inline-block';
                console.log('Edit button forced visible for', config.name);
            } else {
                console.error('Edit button not found during enforcement!');
            }
            
            if (deleteButton) {
                deleteButton.style.display = 'inline-block';
                console.log('Delete button forced visible for', config.name);
            } else {
                console.error('Delete button not found during enforcement!');
            }
            
            if (runButton) {
                runButton.style.display = 'inline-block';
                console.log('Run button forced visible for', config.name);
            } else {
                console.error('Run button not found during enforcement!');
            }
            
            // Update the header text
            const nameElement = document.getElementById('selectedConfigName');
            if (nameElement) {
                nameElement.textContent = config.name;
            }
        } else {
            console.error('No valid configuration found during button enforcement');
        }
    }
}

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'ensureButtonsVisible': {
            console.log('Ensuring buttons are visible after content update');
            console.log('Message data:', message);
            
            // Update configurations if provided
            if (message.configurationsCount !== undefined) {
                console.log('Configurations count from message:', message.configurationsCount);
            }
            
            ensureButtonsVisible();
            
            // If there's a config to select, try to do it
            if (message.selectConfigId) {
                console.log('Attempting to select config from ensureButtonsVisible:', message.selectConfigId);
                window.setTimeout(() => {
                    const configIndex = configurations.findIndex(c => c.id === message.selectConfigId);
                    if (configIndex >= 0) {
                        selectConfiguration(message.selectConfigId, configIndex);
                        window.setTimeout(() => {
                            enterEditMode();
                        }, 100);
                    }
                }, 200);
            }
            break;
        }
        case 'updateConfigurations': {
            console.log('Updating configurations with fresh data:', message.configurations);
            configurations = message.configurations;
            console.log('Configurations updated, new count:', configurations.length);
            break;
        }
        case 'enterEditMode': {
            console.log('Entering edit mode for config:', message.configId);
            // Find the configuration and select it
            const configIndex = configurations.findIndex(c => c.id === message.configId);
            if (configIndex >= 0) {
                selectConfiguration(message.configId, configIndex);
                // Add a small delay to ensure the configuration is selected before entering edit mode
                window.setTimeout(() => {
                    enterEditMode();
                }, 100);
            }
            break;
        }
        case 'selectAndEdit': {
            console.log('Selecting and editing config:', message.configId);
            console.log('Current configurations:', configurations);
            
            // Function to try selecting the config
            const trySelectAndEdit = () => {
                const configIndex = configurations.findIndex(c => c.id === message.configId);
                console.log('Found config at index:', configIndex);
                
                if (configIndex >= 0) {
                    console.log('Selecting configuration:', configurations[configIndex]);
                    selectConfiguration(message.configId, configIndex);
                    // Add a delay to ensure the configuration is selected and UI is updated
                    window.setTimeout(() => {
                        console.log('Entering edit mode...');
                        enterEditMode();
                    }, 150);
                    return true;
                } else {
                    console.error('Configuration not found for selectAndEdit:', message.configId);
                    return false;
                }
            };
            
            // Try immediately, and if it fails, retry after a short delay
            if (!trySelectAndEdit()) {
                console.log('Retrying selectAndEdit after delay...');
                window.setTimeout(() => {
                    trySelectAndEdit();
                }, 500);
            }
            break;
        }
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeUI);
// Also call immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
} else {
    initializeUI();
}
