import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const metaPath = path.resolve(process.cwd(), 'src', 'build-metadata.json');

// Base application version
const baseVersion = "2.4.0";

// Unique build fingerprint/hash
const buildId = crypto.randomBytes(8).toString('hex');
const timestamp = new Date().toISOString();

// Formatted release date (e.g., "August 8, 2026")
const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' };
const formattedReleaseDate = new Date(timestamp).toLocaleDateString('en-US', options) + ' UTC';

const metadata = {
  version: baseVersion,
  buildTimestamp: timestamp,
  buildId: buildId,
  releaseDate: formattedReleaseDate,
  appName: "FORTUNES EDUTECH"
};

// Ensure directories exist
const dir = path.dirname(metaPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
console.log(`[Build Meta] Successfully injected metadata: v${baseVersion} (Build ID: ${buildId}, Timestamp: ${timestamp})`);
