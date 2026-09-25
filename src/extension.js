const vscode = require('vscode');
const { CopilotAssetsProvider } = require('./assets/assetProvider');
const { openAgentEditor, createAgent } = require('./editors/agentEditor');
const { openSkillEditor, createSkill } = require('./editors/skillEditor');
const { openPromptEditor, createPrompt } = require('./editors/promptEditor');
const { openFrontmatterEditor } = require('./editors/frontmatterEditor');

function activate(context) {
  const provider = new CopilotAssetsProvider(context);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('copilotAssets', provider),
    vscode.commands.registerCommand('copilotAssetsStudio.openAgent', (uri) => openAgentEditor(context, uri, provider)),
    vscode.commands.registerCommand('copilotAssetsStudio.createAgent', () => createAgent(context, provider)),
    vscode.commands.registerCommand('copilotAssetsStudio.openSkill', (uri) => openSkillEditor(context, uri, provider)),
    vscode.commands.registerCommand('copilotAssetsStudio.createSkill', () => createSkill(context, provider)),
    vscode.commands.registerCommand('copilotAssetsStudio.openPrompt', (uri) => openPromptEditor(context, uri, provider)),
    vscode.commands.registerCommand('copilotAssetsStudio.createPrompt', () => createPrompt(context, provider)),
    vscode.commands.registerCommand('copilotAssetsStudio.openFrontmatter', (uri) => openFrontmatterEditor(context, uri, provider)),
    vscode.workspace.onDidCreateFiles(() => provider.refresh()),
    vscode.workspace.onDidDeleteFiles(() => provider.refresh()),
    vscode.workspace.onDidRenameFiles(() => provider.refresh()),
    vscode.workspace.onDidSaveTextDocument(() => provider.refresh())
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
