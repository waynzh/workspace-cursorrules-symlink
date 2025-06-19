#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  useAscii: args.includes("--ascii") || args.includes("-a"),
  help: args.includes("--help") || args.includes("-h"),
  version: args.includes("--version") || args.includes("-v"),
  force: args.includes("--force") || args.includes("-f"),
};

// Version information
const VERSION = "1.0.0";

// Help text
const helpText = `
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
`;

// Show help information
if (options.help) {
  console.log(helpText);
  process.exit(0);
}

// Show version information
if (options.version) {
  console.log(`workspace-cursorrules-symlink version ${VERSION}`);
  process.exit(0);
}

// Define log icons, with ASCII mode support
const icon = {
  rocket: options.useAscii ? ">>" : "🚀",
  check: options.useAscii ? "+" : "✅",
  folder: options.useAscii ? ">" : "📂",
  file: options.useAscii ? ">" : "📁",
  search: options.useAscii ? ">" : "🔍",
  error: options.useAscii ? "x" : "❌",
  info: options.useAscii ? "i" : "ℹ️",
  stats: options.useAscii ? "#" : "📊",
  done: options.useAscii ? "*" : "✨",
};

// Get current workspace root directory
const rootDir = process.cwd();
console.log(`${icon.rocket} Workspace root directory: ${rootDir}`);

// Create .cursor directory structure in the root (if it doesn't exist)
const rootCursorRulesDir = path.join(rootDir, ".cursor", "rules");
if (!fs.existsSync(rootCursorRulesDir)) {
  fs.mkdirSync(rootCursorRulesDir, { recursive: true });
  console.log(
    `${icon.check} Created .cursor/rules directory in workspace root`
  );
}

// Find all directories in the workspace root
const projectDirs = fs
  .readdirSync(rootDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .filter((dir) => !dir.startsWith(".")); // Filter out hidden directories

console.log(
  `${icon.folder} Found ${projectDirs.length} projects: ${projectDirs.join(
    ", "
  )}`
);

// Statistics
let totalRuleFiles = 0;
let createdSymlinks = 0;
let skippedSymlinks = 0;
let errorSymlinks = 0;

// Process each project directory
projectDirs.forEach((projectDir) => {
  const cursorDir = path.join(rootDir, projectDir, ".cursor");
  if (fs.existsSync(cursorDir) && fs.statSync(cursorDir).isDirectory()) {
    console.log(`${icon.file} [${projectDir}] Found cursor directory`);

    // Process rules directory (if it exists)
    const rulesDir = path.join(cursorDir, "rules");

    if (fs.existsSync(rulesDir) && fs.statSync(rulesDir).isDirectory()) {
      console.log(`${icon.file} [${projectDir}] Found rules directory`);

      // Create rules subdirectory for this project in the root
      const targetProjectRulesDir = path.join(
        rootDir,
        ".cursor",
        "rules",
        projectDir
      );
      if (!fs.existsSync(targetProjectRulesDir)) {
        fs.mkdirSync(targetProjectRulesDir, { recursive: true });
      }

      // Get all rule files from the project
      const ruleFiles = getAllFiles(rulesDir);
      totalRuleFiles += ruleFiles.length;
      console.log(
        `${icon.search} [${projectDir}] Found ${ruleFiles.length} rule files`
      );

      // Create symlinks for each file
      ruleFiles.forEach((ruleFile) => {
        const relativePath = path.relative(rulesDir, ruleFile);
        const targetPath = path.join(targetProjectRulesDir, relativePath);

        // Create parent directories if they don't exist
        const targetParentDir = path.dirname(targetPath);
        if (!fs.existsSync(targetParentDir)) {
          fs.mkdirSync(targetParentDir, { recursive: true });
        }

        // If using force option, delete existing symlinks
        if (options.force && fs.existsSync(targetPath)) {
          try {
            fs.unlinkSync(targetPath);
          } catch (err) {
            console.error(
              `${
                icon.error
              } [${projectDir}] Failed to delete existing symlink: ${path.basename(
                ruleFile
              )}`
            );
            errorSymlinks++;
            return;
          }
        }

        // Check if the target path already exists
        if (!fs.existsSync(targetPath)) {
          try {
            // Create symlink
            fs.symlinkSync(ruleFile, targetPath);
            createdSymlinks++;
          } catch (err) {
            console.error(
              `${
                icon.error
              } [${projectDir}] Failed to create symlink: ${path.basename(
                ruleFile
              )} - ${err.message}`
            );
            errorSymlinks++;
          }
        } else {
          skippedSymlinks++;
        }
      });
    }
  } else {
    console.log(`${icon.info} [${projectDir}] No .cursor directory found`);
  }
});

// Helper function to recursively get all files in a directory
function getAllFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Function to create or update VSCode settings.json
function createVSCodeSettings() {
  const vscodeDir = path.join(rootDir, ".vscode");
  const settingsPath = path.join(vscodeDir, "settings.json");

  // ESLint configuration to add
  const eslintConfig = {
    "eslint.workingDirectories": [{ mode: "auto" }],
  };

  // Create .vscode directory if it doesn't exist
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
    console.log(`${icon.check} Created .vscode directory`);
  }

  // Check if settings.json already exists
  if (fs.existsSync(settingsPath)) {
    try {
      // Read existing settings
      const existingContent = fs.readFileSync(settingsPath, "utf8");
      let existingSettings = {};

      // Try to parse existing JSON, handle empty file or invalid JSON
      if (existingContent.trim()) {
        try {
          existingSettings = JSON.parse(existingContent);
        } catch (parseError) {
          console.log(
            `${icon.info} Existing settings.json has invalid JSON format, will be overwritten`
          );
        }
      }

      // Check if eslint.workingDirectories already exists
      if (existingSettings["eslint.workingDirectories"]) {
        console.log(
          `${icon.info} ESLint working directories already configured in .vscode/settings.json`
        );
        return false; // No changes made
      } else {
        // Merge with existing settings
        const mergedSettings = { ...existingSettings, ...eslintConfig };
        fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
        console.log(
          `${icon.check} Updated .vscode/settings.json with ESLint configuration`
        );
        return true; // Changes made
      }
    } catch (err) {
      console.error(
        `${icon.error} Failed to read/update .vscode/settings.json: ${err.message}`
      );
      return false;
    }
  } else {
    // Create new settings.json file
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(eslintConfig, null, 2));
      console.log(
        `${icon.check} Created .vscode/settings.json with ESLint configuration`
      );
      return true; // Changes made
    } catch (err) {
      console.error(
        `${icon.error} Failed to create .vscode/settings.json: ${err.message}`
      );
      return false;
    }
  }
}

// Create or update VSCode settings
console.log(`\n${icon.search} Setting up VSCode configuration...`);
const vscodeSettingsUpdated = createVSCodeSettings();

// Display summary information
console.log(`\n${icon.stats} Sync Results:`);
console.log(`  - Total projects: ${projectDirs.length}`);
console.log(`  - Total rule files: ${totalRuleFiles}`);
console.log(`  - Created symlinks: ${createdSymlinks}`);
console.log(`  - Skipped existing: ${skippedSymlinks}`);
if (errorSymlinks > 0) {
  console.log(`  - Failed: ${errorSymlinks}`);
}
console.log(
  `  - VSCode settings: ${
    vscodeSettingsUpdated ? "Updated" : "No changes needed"
  }`
);
console.log(`${icon.done} Done!`);
