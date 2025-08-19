# Simple Usage Guide

## The Problem This Extension Solves

If you have many launch configurations in your VS Code project, it becomes hard to find the ones you use frequently. VS Code's built-in debug dropdown doesn't help with this - it just shows them all in the order they appear in `launch.json`.

## The Simple Solution

This extension provides **automatic usage tracking** - the configurations you use most often automatically appear at the top of the list.

## How It Works

1. **Every time you run a configuration**, the extension tracks it
2. **Configurations automatically sort** by usage count (most used first)
3. **You see usage counts** in the tree view (e.g., "5x" means used 5 times)
4. **Frequently used configs** naturally float to the top

## Quick Access

- **Quick Run** (`Ctrl+Alt+Q` or `Cmd+Alt+Q`): Shows all configurations with usage info
- **Tree View**: Browse configurations in Explorer sidebar, sorted by usage
- **Usage Indicators**: See how many times you've used each configuration

## Perfect For

- **Projects with many configurations** - find your important ones quickly
- **Teams** - see which configurations are actually used vs. abandoned
- **Long-running projects** - configurations you use regularly stay accessible

## No Complex Setup Required

- No pinning, favoriting, or categorization needed
- Just use your configurations normally
- The extension learns your patterns automatically
- Clean, simple interface focused on what you actually need

This approach solves your original problem (frequently used configs on top) without the complexity of manual organization systems.
