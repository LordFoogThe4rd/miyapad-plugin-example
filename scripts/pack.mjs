import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist');
mkdirSync(outDir, { recursive: true });

const archive = zipSync({
	'manifest.json': new Uint8Array(readFileSync(join(root, 'manifest.json'))),
	'main.js': new Uint8Array(readFileSync(join(root, 'main.js'))),
	'CHANGELOG.md': new Uint8Array(readFileSync(join(root, 'CHANGELOG.md'))),
});

writeFileSync(join(outDir, 'example.miyaplugin'), archive);
