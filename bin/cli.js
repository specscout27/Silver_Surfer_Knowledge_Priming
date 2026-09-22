#!/usr/bin/env node
import { init } from '../src/init.js';
import { TARGETS } from '../src/targets.js';

const [, , command, ...rest] = process.argv;

function getFlag(name, fallback) {
  const idx = rest.indexOf(`--${name}`);
  if (idx !== -1 && rest[idx + 1]) return rest[idx + 1];
  const eq = rest.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1];
  return fallback;
}

function usage() {
  console.log(`
Usage: knowledge-priming init [--target ${Object.keys(TARGETS).join('|')}|all]

Scaffolds the Knowledge Priming and Update Context agents into the
current project: vendors the content into .knowledge-priming/, then
writes a thin wrapper file per tool target pointing at it.

Examples:
  npx github:specscout27/Silver_Surfer_Knowledge_Priming init
  npx github:specscout27/Silver_Surfer_Knowledge_Priming init --target claude
`);
}

async function main() {
  if (command !== 'init') {
    usage();
    process.exit(command ? 1 : 0);
  }
  const target = getFlag('target', 'all');
  try {
    await init(target);
    console.log('\nDone.');
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

main();
