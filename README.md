# Workspace Cursorrules Symlink

A simple tool to symlink Cursor rules from multiple projects in a workspace to the root directory.

## Background

[Cursor](https://cursor.sh/) is an AI-powered code editor that enhances its AI capabilities through rule files located in the `.cursor/rules` directory. However, when multiple projects are placed in the same workspace, Cursor can only read rule files from the workspace root directory, not from individual projects.

This tool creates symbolic links from each project's rules to the workspace root, allowing Cursor to find and use all rules from all projects in the workspace.

## Features

- Automatically scans all projects in the workspace folder
- Identifies `.cursor/rules` directories in each project
- Creates organized symbolic links categorized by project name in the root directory
- Provides detailed synchronization reports

## Installation

### Global Installation

```bash
npm install -g workspace-cursorrules-symlink

# Run in your workspace root directory:
workspace-cursorrules-symlink
```

### Use Without Installation

```bash
npx workspace-cursorrules-symlink
```

## Command Line Options

```
workspace-cursorrules-symlink - Symlink Cursor rules from multiple projects in a workspace

Usage:
  npx workspace-cursorrules-symlink [options]

Options:
  -h, --help      Show help information
  -v, --version   Show version information
  -a, --ascii     Use ASCII characters instead of emoji (Windows compatible)
  -f, --force     Force recreate existing symlinks

Examples:
  npx workspace-cursorrules-symlink
  npx workspace-cursorrules-symlink --ascii
```

## Example

The result creates a structure like this in the workspace root:

```
.cursor/rules/
├── project-A/
│   └── rule1.mdc (symlink)
├── project-B/
│   ├── rule2.mdc (symlink)
│   └── subfolder/
│       └── rule3.mdc (symlink)
└── project-C/
    └── rule4.mdc (symlink)
```
