# Run Configurations Extension

A VS Code extension that provides Run/Debug Configuration management with smart usage tracking and intuitive organization.

## 🌟 Key Features

### ✅ Complete Feature Set (v0.4.0)

#### **🚀 Configuration Management**
1. **Create New Configurations** - Create launch configs and tasks with templates
2. **Edit Configurations** - Full-featured form-based editing with validation
3. **Delete Configurations** - Safe deletion with confirmation dialogs
4. **Run Configurations** - Execute launch configs and tasks directly

#### **📊 Smart Organization** 
- **Usage Tracking** - Automatically tracks how often you use each configuration
- **Smart Sorting** - Most used configurations appear first
- **Usage Indicators** - See usage count in tree view (e.g., "5x")
- **Simple & Intuitive** - No complex grouping, just smart ordering

#### **⚡ Quick Access**
- **Quick Run** (`Ctrl+Alt+Q`) - Fast access to all configurations with usage info
- **Usage-Based Sorting** - Your frequently used configs naturally float to the top
- **Visual Indicators** - Clear usage counts help you identify important configurations

#### **🎯 User Interface**
- **Tree View Integration** - Browse configurations in the Explorer sidebar
- **Webview Editor** - Modern, responsive configuration editing interface
- **Context Menus** - Right-click actions for run and delete operations
- **Clean Design** - Simple, focused interface without overwhelming options

### Key Functionality

- **Edit Configurations Dialog** (`Ctrl+Alt+R` / `Cmd+Alt+R`) - Opens webview with all configurations
- **Create New Configuration** - Template-based creation with immediate editing
- **Delete Configuration** - Safe deletion with confirmation prompts
- **Run/Debug** - Execute configurations directly from tree or webview
- **File Management** - Automatic .vscode/launch.json and tasks.json updates
- **JSON Comment Support** - Handles commented JSON configuration files

## How to Use

### 🚀 Quick Start

#### Access the Configuration Manager
- **Keyboard**: `Ctrl+Alt+R` (Windows/Linux) or `Cmd+Alt+R` (Mac)
- **Quick Run**: `Ctrl+Alt+Q` (Windows/Linux) or `Cmd+Alt+Q` (Mac) - Shows all configs with usage info
- **Tree View**: Click "Edit Configurations..." or use toolbar buttons
- **Command Palette**: "Run Configs: Edit Configurations..."

#### Simple Organization
- **Run configurations** to build usage history - frequently used configs automatically appear first
- **Use Quick Run** (`Ctrl+Alt+Q`) to see all configurations ordered by usage
- **Check usage counts** in tree view to identify your most important configurations

### 🎯 Configuration Management

#### Create New Configurations

**From Tree View:**
- Click ➕ **Create New** button in the Run Configurations tree view
- Select configuration type (Launch Configuration or Task Configuration)
- **Webview opens directly in edit mode** - start editing immediately!

**From Webview:**
- Click ➕ **Create New** button in the webview toolbar  
- Select configuration type (Launch Configuration or Task Configuration)
- **Configuration created and opened in edit mode** - seamless workflow!

### 3. Edit Existing Configurations

- **Webview Interface**: Click ✏️ Edit button for any configuration
- **Form-based Editing**: Interactive input fields for all properties
- **Save Options**: Save, Save & Run, or Cancel changes
- **Real-time Updates**: Changes immediately saved to configuration files

### 4. Tree View Operations

- **Run**: Click any configuration or right-click → "Run Configuration"
- **Delete**: Right-click → "Delete Configuration" (with confirmation)
- **Create**: Click ➕ button in tree view header

### 5. Webview Operations

- **Edit**: Click ✏️ Edit button for detailed form editing
- **Run**: Click ▶ Run button to execute configuration
- **Delete**: Click 🗑️ Delete button (with confirmation)
- **Create**: Click ➕ Create New button in toolbar

## Supported Configuration Types

The extension provides full support for:

### **Launch Configurations** (launch.json)
- **Node.js** - JavaScript/TypeScript debugging and execution
- **Python** - Python script debugging and execution  
- **Chrome** - Web application debugging
- **Extension Host** - VS Code extension debugging
- **Any Type** - Generic support for all launch configuration types

### **Task Configurations** (tasks.json)  
- **Shell Tasks** - Command-line operations
- **NPM Tasks** - Package.json script execution
- **Build Tasks** - Compilation and build processes
- **Any Type** - Generic support for all task types

## VS Code Integration

### Commands

| Command | Keyboard Shortcut | Description |
|---------|------------------|-------------|
| `Edit Configurations...` | `Ctrl+Alt+R` / `Cmd+Alt+R` | Open the main configuration dialog |
| `Create Run Configuration` | `Ctrl+Alt+N` / `Cmd+Alt+N` | Create a new configuration from template |
| `Run Configuration` | - | Execute selected configuration |

### Tree View

The "Run Configurations" tree view in the Explorer sidebar provides:
- Overview of all launch and task configurations
- Quick run buttons for immediate execution
- Context menus for edit, duplicate, delete operations
- Icons indicating configuration types (Node.js, Python, Chrome, etc.)

## Technical Details

### Architecture

- **Modal-based Interface**: Uses VS Code's native QuickPick and InputBox APIs to create modal dialogs
- **launch.json Integration**: Direct read/write operations on .vscode/launch.json files
- **Template System**: Pre-built configuration templates for common development scenarios
- **Real-time Updates**: Automatic tree view refresh when configurations change

### File Operations

- Creates `.vscode/launch.json` if it doesn't exist
- Preserves existing configurations and comments
- Validates configuration properties during editing
- Automatic backup and error handling

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Run Configurations"
4. Click Install

### From Source
1. Clone this repository
2. Run `npm install`
3. Run `npm run package`
4. Install the generated VSIX file

### Usage
1. Open any workspace with configuration files (or create them)
2. Use `Ctrl+Alt+R` / `Cmd+Alt+R` to open the configuration manager
3. Use ➕ buttons to create new configurations

## Development

### Building from Source

```bash
npm install
npm run compile
npm run package  # Creates VSIX file
```

### Extension Structure

```
src/
├── extension.ts              # Main extension activation & commands
├── configurationManager.ts   # CRUD operations for configs  
├── configurationProvider.ts  # Tree view provider
├── types.ts                 # TypeScript definitions
├── webview.js               # Webview frontend logic
└── webview.css             # Webview styling
```

### Key Features Implementation

- **Full CRUD Operations**: Create, Read, Update, Delete for both launch.json and tasks.json
- **Webview Interface**: Modern, responsive UI with VS Code theming
- **Real-time Sync**: Tree view and webview stay synchronized
- **JSON Comment Support**: Handles commented configuration files
- **Error Handling**: Comprehensive error handling and user feedback

## Version History

### v0.4.0 (Current)
- ✅ Complete CRUD operations for launch configs and tasks
- ✅ Streamlined create → edit workflow  
- ✅ Delete functionality with confirmation
- ✅ Dual create buttons (tree view + webview)
- ✅ Real-time synchronization
- ✅ Cancel protection during creation

## Keyboard Shortcuts

- `Ctrl+Alt+R` / `Cmd+Alt+R` - Open Run Configurations Manager
- Standard VS Code debugging shortcuts work with created configurations

---

**Perfect Run Configuration management for VS Code!** 🚀
| Edit Configurations Dialog | ✅ | ✅ |
| Create from Templates | ✅ | ✅ |
| Modal-based Editing | ✅ | ✅ |
| Run Configuration List | ✅ | ✅ |
| Configuration Folders | ✅ | ❌ (Intentionally skipped) |
| Share Configurations | ✅ | ✅ (via launch.json) |
| Before Launch Tasks | ✅ | ✅ (via VS Code tasks) |

## Contributing

This extension is designed to be a faithful recreation of Run/Debug Configuration Modal functionality within VS Code's architecture. Contributions that maintain this design philosophy are welcome.

## License

MIT
