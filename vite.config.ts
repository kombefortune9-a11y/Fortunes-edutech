import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { defineConfig, Plugin } from 'vite';

function buildMetadataPlugin(): Plugin {
  return {
    name: 'build-metadata-plugin',
    buildStart() {
      try {
        const metaPath = path.resolve(process.cwd(), 'src', 'build-metadata.json');
        const baseVersion = "2.4.0";
        const buildId = crypto.randomBytes(8).toString('hex');
        const timestamp = new Date().toISOString();
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' };
        const formattedReleaseDate = new Date(timestamp).toLocaleDateString('en-US', options) + ' UTC';

        const metadata = {
          version: baseVersion,
          buildTimestamp: timestamp,
          buildId: buildId,
          releaseDate: formattedReleaseDate,
          appName: "FORTUNES EDUTECH"
        };

        const dir = path.dirname(metaPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`[Build Meta Plugin] Injected metadata: v${baseVersion} (${buildId})`);
      } catch (err) {
        console.warn('[Build Meta Plugin] Warning generating metadata:', err);
      }
    }
  };
}

function swAssetsPlugin(): Plugin {
  return {
    name: 'sw-assets-plugin',
    closeBundle() {
      try {
        const distPath = path.resolve(process.cwd(), 'dist');
        const swPath = path.resolve(distPath, 'sw.js');
        if (!fs.existsSync(swPath)) {
          return;
        }

        function getFilesRecursively(dir: string, relativeTo = distPath): string[] {
          let results: string[] = [];
          const list = fs.readdirSync(dir);
          for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
              results = results.concat(getFilesRecursively(filePath, relativeTo));
            } else {
              const relativeUrl = '/' + path.relative(relativeTo, filePath).replace(/\\/g, '/');
              results.push(relativeUrl);
            }
          }
          return results;
        }

        const allFiles = getFilesRecursively(distPath);
        const precacheList = allFiles.filter(file => {
          const isMap = file.endsWith('.map');
          const isApk = file.endsWith('.apk');
          const isSw = file === '/sw.js';
          return !isMap && !isApk && !isSw;
        });

        if (!precacheList.includes('/')) precacheList.unshift('/');
        if (!precacheList.includes('/index.html')) precacheList.unshift('/index.html');

        let swContent = fs.readFileSync(swPath, 'utf-8');
        const placeholderRegex = /const\s+PRECACHE_ASSETS\s*=\s*\[[^\]]*\];/;
        const replacementString = `const PRECACHE_ASSETS = ${JSON.stringify(precacheList, null, 2)};`;

        if (placeholderRegex.test(swContent)) {
          swContent = swContent.replace(placeholderRegex, replacementString);
          fs.writeFileSync(swPath, swContent, 'utf-8');
        } else {
          swContent += `\n\nconst PRECACHE_INJECTED = ${JSON.stringify(precacheList, null, 2)};`;
          fs.writeFileSync(swPath, swContent, 'utf-8');
        }
        console.log(`[SW Assets Plugin] Injected ${precacheList.length} assets into dist/sw.js`);
      } catch (err) {
        console.warn('[SW Assets Plugin] Non-blocking SW asset injection notice:', err);
      }
    }
  };
}

function mirrorBuildPlugin(): Plugin {
  return {
    name: 'mirror-build-plugin',
    closeBundle() {
      try {
        const distPath = path.resolve(process.cwd(), 'dist');
        const buildPath = path.resolve(process.cwd(), 'build');
        if (fs.existsSync(distPath)) {
          if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath, { recursive: true });
          }
          fs.cpSync(distPath, buildPath, { recursive: true });
          console.log('[Mirror Build Plugin] Successfully mirrored dist/ to build/');
        }
      } catch (err) {
        console.warn('[Mirror Build Plugin] Non-blocking notice:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['lucide-react', 'motion', 'react-hot-toast'],
            'vendor-charts': ['recharts'],
          },
        },
      },
    },
    plugins: [react(), tailwindcss(), buildMetadataPlugin(), swAssetsPlugin(), mirrorBuildPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
