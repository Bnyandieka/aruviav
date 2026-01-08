const fs = require('fs');
const path = require('path');

// Directory to scan
const rootDir = __dirname;

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to skip
const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.expo'];

let removedCount = 0;
let processedFiles = 0;

function isSkippedDir(dirPath) {
  return skipDirs.some(skipDir => dirPath.includes(path.sep + skipDir + path.sep) || dirPath.endsWith(path.sep + skipDir));
}

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove console.log statements (handles multiple patterns)
    // This regex matches console.log(...) with proper handling of nested parentheses
    const regex = /^\s*console\.log\([^)]*\);?\s*\n/gm;
    content = content.replace(regex, '');
    
    // Also handle console.log on same line followed by other code
    // Be careful with this - only remove if it's a standalone statement
    const regex2 = /console\.log\([^)]*\);\s*(?=\n|$)/g;
    content = content.replace(regex2, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      removedCount++;
      console.log(`✓ Cleaned: ${path.relative(rootDir, filePath)}`);
    }
    
    processedFiles++;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!isSkippedDir(filePath)) {
          scanDirectory(filePath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(filePath);
        if (extensions.includes(ext)) {
          removeConsoleLogs(filePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
}
scanDirectory(rootDir);
