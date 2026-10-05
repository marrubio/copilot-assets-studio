const path = require('path');
const vscode = require('vscode');
const instructionArtifact = require('../artifacts/instructionArtifact');
const { discoverFiles, CATEGORY_DEFINITIONS } = require('../assets/assetProvider');
const { openArtifactEditor } = require('./artifactEditor');

async function openInstructionEditor(context, uri, provider) {
  if (!uri) {
    const definition = CATEGORY_DEFINITIONS.find((entry) => entry.key === 'instructions');
    const resources = await discoverFiles(definition.patterns);
    if (!resources.length) {
      vscode.window.showInformationMessage('No instruction files were found. Create one from the Copilot Assets view.');
      return;
    }

    const picked = await vscode.window.showQuickPick(
      resources.map((resource) => ({
        label: path.basename(resource.fsPath),
        description: vscode.workspace.asRelativePath(resource, false),
        resource
      })),
      { placeHolder: 'Select an instruction to open in the form editor' }
    );
    if (!picked) {
      return;
    }
    uri = picked.resource;
  }

  await openArtifactEditor(context, uri, provider, instructionArtifact);
}

function toSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'new-instruction';
}

async function createInstruction(context, provider) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Open a workspace folder before creating an instruction.');
    return;
  }

  const suggestedName = await vscode.window.showInputBox({
    prompt: 'Instruction file name',
    value: 'new-instruction',
    validateInput(value) {
      return value?.trim() ? null : 'File name is required.';
    }
  });
  if (!suggestedName) {
    return;
  }

  const fileName = suggestedName.endsWith('.instructions.md') ? suggestedName : `${toSlug(suggestedName)}.instructions.md`;
  const targetDir = vscode.Uri.joinPath(workspaceFolder.uri, '.github', 'instructions');
  await vscode.workspace.fs.createDirectory(targetDir);
  const fileUri = vscode.Uri.joinPath(targetDir, fileName);

  try {
    await vscode.workspace.fs.stat(fileUri);
    const action = await vscode.window.showWarningMessage(`${fileName} already exists.`, 'Open existing', 'Overwrite');
    if (action === 'Open existing') {
      await openInstructionEditor(context, fileUri, provider);
      return;
    }
    if (action !== 'Overwrite') {
      return;
    }
  } catch (error) {
    if (!(error && typeof error === 'object' && error.code === 'FileNotFound')) {
      throw error;
    }
  }

  const state = instructionArtifact.createState(fileUri.fsPath);
  state.fields.name = { enabled: true, value: path.basename(fileName, '.instructions.md') };
  state.fields.description = { enabled: true, value: 'Describe when these instructions apply.' };
  state.fields.applyTo = { enabled: true, value: '**' };
  state.body = '# Instructions\n\nDescribe the conventions for matching files here.\n';
  await vscode.workspace.fs.writeFile(fileUri, Buffer.from(instructionArtifact.createContent(state), 'utf8'));
  provider.refresh();
  await openInstructionEditor(context, fileUri, provider);
}

module.exports = {
  openInstructionEditor,
  createInstruction
};
