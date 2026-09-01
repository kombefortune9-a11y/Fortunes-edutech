import fs from 'fs';
import path from 'path';

const distPath = path.resolve(process.cwd(), 'dist');
const swPath = path.resolve(distPath, 'sw.js');

if (!fs.existsSync(distPath)) {
  console.error('[SW Asset Injection] dist directory does not exist. Run vite build first.');
  process.exit(1);
}

if (!fs.existsSync(swPath)) {
  console.error('[SW Asset Injection] dist/sw.js does not exist.');
  process.exit(1);
}

// Recursively walk through dist/ to find all assets
function getFilesRecursively(dir, relativeTo = distPath) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, relativeTo));
    } else {
      // Get the URL relative to the dist directory
      let relativeUrl = '/' + path.relative(relativeTo, filePath).replace(/\\/g, '/');
      results.push(relativeUrl);
    }
  }
  return results;
}

try {
  const allFiles = getFilesRecursively(distPath);
  
  // Filter out assets we do not want to precache
  // - skip .map files (sourcemaps)
  // - skip FORTUNES_EDUTECH.apk (too large, downloaded on demand)
  // - skip sw.js itself (handled separately or not precached inside itself to avoid update issues)
  const precacheList = allFiles.filter(file => {
    const isMap = file.endsWith('.map');
    const isApk = file.endsWith('.apk');
    const isSw = file === '/sw.js';
    return !isMap && !isApk && !isSw;
  });

  // Always include standard entry points
  if (!precacheList.includes('/')) {
    precacheList.unshift('/');
  }
  if (!precacheList.includes('/index.html')) {
    precacheList.unshift('/index.html');
  }

  console.log(`[SW Asset Injection] Found ${precacheList.length} assets to pre-cache.`);

  // Read sw.js from dist/
  let swContent = fs.readFileSync(swPath, 'utf-8');

  // Replace PRECACHE_ASSETS placeholder
  const placeholderRegex = /const\s+PRECACHE_ASSETS\s*=\s*\[[^\]]*\];/;
  const replacementString = `const PRECACHE_ASSETS = ${JSON.stringify(precacheList, null, 2)};`;

  if (placeholderRegex.test(swContent)) {
    swContent = swContent.replace(placeholderRegex, replacementString);
    fs.writeFileSync(swPath, swContent, 'utf-8');
    console.log(`[SW Asset Injection] Successfully injected asset array into dist/sw.js!`);
  } else {
    console.warn('[SW Asset Injection] Warning: Could not find PRECACHE_ASSETS placeholder in dist/sw.js. Appending asset list instead.');
    swContent += `\n\n// Fallback injected assets\nconst PRECACHE_INJECTED = ${JSON.stringify(precacheList, null, 2)};`;
    fs.writeFileSync(swPath, swContent, 'utf-8');
  }

} catch (error) {
  console.error('[SW Asset Injection] Failed to inject static assets:', error);
  process.exit(1);
}
