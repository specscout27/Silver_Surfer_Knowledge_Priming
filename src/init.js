import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE_FILES, TARGETS, VENDOR_DIR } from './targets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const TOOL_SUBSTITUTION_NOTE = [
  "That file was originally written against GitHub Copilot's tool names",
  '(e.g. `search/codebase`, `execute/runInTerminal`, `edit/editFiles`).',
  'Use your native equivalents instead: `Grep`/`Glob` for search, `Bash`',
  'for terminal commands, `Read`/`Write`/`Edit` for file operations.',
  'Everything else — the workflow steps, approval gates, and',
  'behavioural rules — applies to you unchanged.',
].join(' ');

function wrapperBody(vendorRelPathPosix, tool) {
  const note =
    tool === 'copilot'
      ? 'This file is already written in your native tool conventions — nothing to translate.'
      : TOOL_SUBSTITUTION_NOTE;
  return [
    `Read the file \`${vendorRelPathPosix}\` in this project, in full, and follow`,
    'its instructions exactly as your own operating instructions for this',
    'run — including all approval gates, git guardrails, and behavioural',
    `rules it defines.\n\n${note}\n`,
  ].join(' ');
}

function claudeAgentFrontmatter(file) {
  return `---\nname: ${file.id.replace(/_/g, '-')}\ndescription: ${file.description}\ntools: [Read, Write, Edit, Bash, Grep, Glob]\nmodel: inherit\n---\n\n`;
}

export async function init(targetArg = 'all', { cwd = process.cwd(), log = console.log } = {}) {
  const targetKeys = targetArg === 'all' ? Object.keys(TARGETS) : [targetArg];
  const unknown = targetKeys.filter((t) => !TARGETS[t]);
  if (unknown.length) {
    throw new Error(
      `Unknown target(s): ${unknown.join(', ')}. Valid targets: ${Object.keys(TARGETS).join(', ')}, all`
    );
  }

  // Step 1 — vendor the source content into the target project.
  const vendorRoot = path.join(cwd, VENDOR_DIR);
  for (const file of SOURCE_FILES) {
    const src = path.join(REPO_ROOT, file.sourcePath);
    const dest = path.join(vendorRoot, file.vendorPath);
    await mkdir(path.dirname(dest), { recursive: true });
    const content = await readFile(src, 'utf8');
    await writeFile(dest, content, 'utf8');
  }
  log(`Vendored ${SOURCE_FILES.length} files into ${VENDOR_DIR}/`);

  // Step 2 — write a thin wrapper per file, per selected target, pointing
  // back at the vendored copy (never duplicating the actual content).
  for (const targetKey of targetKeys) {
    const target = TARGETS[targetKey];
    for (const file of SOURCE_FILES) {
      const destRelPath = target.destFor(file);
      const destPath = path.join(cwd, destRelPath);
      const vendorRelPath = path.relative(
        path.dirname(destPath),
        path.join(vendorRoot, file.vendorPath)
      );
      const vendorRelPathPosix = vendorRelPath.split(path.sep).join('/');

      let content = wrapperBody(vendorRelPathPosix, targetKey);
      if (targetKey === 'claude' && file.kind === 'agent') {
        content = claudeAgentFrontmatter(file) + content;
      }

      await mkdir(path.dirname(destPath), { recursive: true });
      await writeFile(destPath, content, 'utf8');
    }
    const firstDest = target.destFor(SOURCE_FILES[0]);
    log(`Wired up ${target.label}: ${SOURCE_FILES.length} files under ${firstDest.split('/')[0]}/`);
  }
}
