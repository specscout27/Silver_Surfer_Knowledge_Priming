// The seven content files this installer vendors, and where each one's
// thin wrapper gets written for each supported tool. Destination paths
// mirror the "Tool Placement Reference" table already embedded in each
// source agent/skill file — this module just realizes that mechanically.

export const SOURCE_FILES = [
  {
    id: 'knowledge_priming',
    kind: 'agent',
    sourcePath: '.github/agents/Silver_Surfer.knowledge_priming.agent.md',
    vendorPath: 'Silver_Surfer.knowledge_priming.agent.md',
    description:
      'Generates the initial structured knowledge base for one or more repositories, writing it to a dedicated sibling Knowledge repo. Invoke when a repo/team has never been primed, or when explicitly asked to "run knowledge priming" / "prime this repo".',
  },
  {
    id: 'update_context',
    kind: 'agent',
    sourcePath: '.github/agents/Silver_Surfer.update_context.agent.md',
    vendorPath: 'Silver_Surfer.update_context.agent.md',
    description:
      'Detects drift since the last known baseline and surgically refreshes an existing knowledge base. Invoke when code has moved on origin/main since knowledge was last generated/updated, or when explicitly asked to "update context" / "refresh the knowledge base".',
  },
  {
    id: 'code_to_knowledge',
    kind: 'skill',
    sourcePath: '.github/agents/skills/code_to_knowledge.skill.md',
    vendorPath: 'skills/code_to_knowledge.skill.md',
  },
  {
    id: 'service_to_knowledge',
    kind: 'skill',
    sourcePath: '.github/agents/skills/service_to_knowledge.skill.md',
    vendorPath: 'skills/service_to_knowledge.skill.md',
  },
  {
    id: 'repo_context_update',
    kind: 'skill',
    sourcePath: '.github/agents/skills/repo_context_update.skill.md',
    vendorPath: 'skills/repo_context_update.skill.md',
  },
  {
    id: 'service_context_update',
    kind: 'skill',
    sourcePath: '.github/agents/skills/service_context_update.skill.md',
    vendorPath: 'skills/service_context_update.skill.md',
  },
  {
    id: 'smart_context_loading',
    kind: 'skill',
    sourcePath: '.github/agents/skills/smart_context_loading.skill.md',
    vendorPath: 'skills/smart_context_loading.skill.md',
  },
];

export const VENDOR_DIR = '.knowledge-priming';

export const TARGETS = {
  claude: {
    label: 'Claude Code',
    destFor: (file) =>
      file.kind === 'agent'
        ? `.claude/agents/${file.id}.md`
        : `.claude/agents/skills/${file.id}.skill.md`,
  },
  cursor: {
    label: 'Cursor',
    destFor: (file) =>
      file.kind === 'agent'
        ? `.cursor/rules/${file.id}.md`
        : `.cursor/rules/skills/${file.id}.skill.md`,
  },
  copilot: {
    label: 'GitHub Copilot',
    // Knowledge Priming is a Copilot custom agent; Update Context is a
    // Copilot chat mode. This asymmetry already exists in the source
    // files' own placement tables — preserved here, not invented.
    destFor: (file) => {
      if (file.id === 'knowledge_priming') return '.github/agents/knowledge_priming.agent.md';
      if (file.id === 'code_to_knowledge' || file.id === 'service_to_knowledge') {
        return `.github/agents/skills/${file.id}.skill.md`;
      }
      if (file.id === 'update_context') return '.github/chatmodes/update_context.chatmode.md';
      return `.github/chatmodes/skills/${file.id}.skill.md`;
    },
  },
};
