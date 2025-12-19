// ABOUTME: Tests for the build process
// ABOUTME: Verifies build outputs are correct and all required files exist

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const publicDir = path.join(buildDir, 'public');
const backendDir = path.join(buildDir, 'backend');
const extensionDir = path.join(buildDir, 'extension');

describe('Build Process', () => {
  beforeAll(() => {
    // Run a fresh build before tests
    execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
  }, 60000);

  describe('Directory Structure', () => {
    it('creates build directory', () => {
      expect(fs.existsSync(buildDir)).toBe(true);
    });

    it('creates build/public directory', () => {
      expect(fs.existsSync(publicDir)).toBe(true);
    });

    it('creates build/backend directory', () => {
      expect(fs.existsSync(backendDir)).toBe(true);
    });

    it('creates build/extension directory', () => {
      expect(fs.existsSync(extensionDir)).toBe(true);
    });
  });

  describe('Shared Assets (build/public)', () => {
    it('builds kawaii.js', () => {
      const kawaiiPath = path.join(publicDir, 'kawaii.js');
      expect(fs.existsSync(kawaiiPath)).toBe(true);
    });

    it('kawaii.js exports makeKawaii globally', () => {
      const kawaiiPath = path.join(publicDir, 'kawaii.js');
      const content = fs.readFileSync(kawaiiPath, 'utf-8');
      expect(content).toContain('window.makeKawaii');
      expect(content).toContain('KawaiiModule');
    });

    it('copies icon files', () => {
      expect(fs.existsSync(path.join(publicDir, 'icon16.png'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'icon48.png'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'icon128.png'))).toBe(true);
    });

    it('copies missinfo_bg.jpg', () => {
      expect(fs.existsSync(path.join(publicDir, 'missinfo_bg.jpg'))).toBe(true);
    });

    it('creates extension zip', () => {
      const zipPath = path.join(publicDir, 'sanitycheck-extension.zip');
      expect(fs.existsSync(zipPath)).toBe(true);
      // Should be a reasonable size (at least 1KB)
      const stats = fs.statSync(zipPath);
      expect(stats.size).toBeGreaterThan(1024);
    });
  });

  describe('Backend Build', () => {
    it('compiles index.js', () => {
      expect(fs.existsSync(path.join(backendDir, 'index.js'))).toBe(true);
    });

    it('compiles shared modules', () => {
      const sharedDir = path.join(backendDir, 'shared');
      expect(fs.existsSync(sharedDir)).toBe(true);
      expect(fs.existsSync(path.join(sharedDir, 'kawaii.js'))).toBe(true);
      expect(fs.existsSync(path.join(sharedDir, 'colors.js'))).toBe(true);
      expect(fs.existsSync(path.join(sharedDir, 'constants.js'))).toBe(true);
    });

    it('compiles backend pages', () => {
      const pagesDir = path.join(backendDir, 'backend', 'pages');
      expect(fs.existsSync(pagesDir)).toBe(true);
      expect(fs.existsSync(path.join(pagesDir, 'homepage.js'))).toBe(true);
      expect(fs.existsSync(path.join(pagesDir, 'faq.js'))).toBe(true);
    });
  });

  describe('Extension Build', () => {
    it('bundles content.js', () => {
      expect(fs.existsSync(path.join(extensionDir, 'content.js'))).toBe(true);
    });

    it('bundles popup.js', () => {
      expect(fs.existsSync(path.join(extensionDir, 'popup.js'))).toBe(true);
    });

    it('bundles background.js', () => {
      expect(fs.existsSync(path.join(extensionDir, 'background.js'))).toBe(true);
    });

    it('bundles welcome.js', () => {
      expect(fs.existsSync(path.join(extensionDir, 'welcome.js'))).toBe(true);
    });

    it('copies manifest.json', () => {
      const manifestPath = path.join(extensionDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeDefined();
    });

    it('copies HTML files', () => {
      expect(fs.existsSync(path.join(extensionDir, 'popup.html'))).toBe(true);
      expect(fs.existsSync(path.join(extensionDir, 'welcome.html'))).toBe(true);
    });

    it('extension JS files import shared kawaii module correctly', () => {
      // The bundled extension files should have kawaii inlined, not as separate import
      const contentJs = fs.readFileSync(path.join(extensionDir, 'content.js'), 'utf-8');
      // Should contain the makeKawaii function code (bundled in)
      expect(contentJs).toContain('makeKawaii');
    });
  });
});

describe('Dev vs Production Path Resolution', () => {
  it('index.ts handles dev mode path correctly', () => {
    const indexPath = path.join(rootDir, 'src', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Should detect dev mode and use build/public
    expect(content).toContain('isDevMode');
    expect(content).toContain('../build/public');
    expect(content).toContain('../public');
  });
});
