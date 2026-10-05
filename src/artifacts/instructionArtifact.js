const path = require('path');
const {
  createEmptyInstructionState,
  parseInstructionDocument,
  serializeInstructionDocument,
  validateInstructionState
} = require('../frontmatter');

const instructionArtifact = {
  key: 'instruction',
  title: 'Instruction',
  description: 'Visual editor for *.instructions.md frontmatter.',
  rendererPath: path.join('media', 'artifacts', 'instruction', 'editor.js'),
  parse(content, filePath) {
    return parseInstructionDocument(content, filePath);
  },
  serialize(state) {
    return serializeInstructionDocument(state);
  },
  validate(state) {
    return validateInstructionState(state);
  },
  createState(filePath) {
    return createEmptyInstructionState(filePath);
  },
  createContent(state) {
    return serializeInstructionDocument(state);
  }
};

module.exports = instructionArtifact;
