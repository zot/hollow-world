#!/usr/bin/env node
/**
 * Asset watcher for development
 * Watches templates and CSS files and copies them to output directory
 */

import { watch } from 'fs';
import { copyFile, mkdir } from 'fs/promises';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Directories to watch
const watchDirs = [
  { src: 'public/templates', dest: 'hollow-world-p2p/html/templates' },
  { src: 'src/styles', dest: 'hollow-world-p2p/html/styles' }
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

async function copyFileWithDir(srcPath, destPath) {
  try {
    // Ensure destination directory exists
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(srcPath, destPath);
    return true;
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error copying ${srcPath}:${colors.reset}`, error.message);
    return false;
  }
}

function startWatching() {
  console.log(`${colors.blue}👁️  Starting asset watcher...${colors.reset}`);

  watchDirs.forEach(({ src, dest }) => {
    const srcPath = join(projectRoot, src);
    const destPath = join(projectRoot, dest);

    console.log(`${colors.blue}📁 Watching: ${src}${colors.reset}`);

    watch(srcPath, { recursive: true }, async (eventType, filename) => {
      if (!filename) return;

      // Ignore hidden files and temporary files
      if (filename.startsWith('.') || filename.endsWith('~')) return;

      const srcFile = join(srcPath, filename);
      const destFile = join(destPath, filename);
      const relPath = relative(projectRoot, srcFile);

      if (eventType === 'change' || eventType === 'rename') {
        const success = await copyFileWithDir(srcFile, destFile);
        if (success) {
          console.log(`${colors.green}✓ Copied: ${relPath}${colors.reset}`);
        }
      }
    });
  });

  console.log(`${colors.green}✅ Asset watcher ready${colors.reset}\n`);
}

// Start watching
startWatching();

// Keep process alive
process.on('SIGINT', () => {
  console.log(`\n${colors.blue}🛑 Stopping asset watcher...${colors.reset}`);
  process.exit(0);
});
