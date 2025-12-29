import fs from 'fs/promises';
import BaseTool from './base-tool.js';
import {resolvePath} from '../utils/path-resolver.js';

class EditFileTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'edit_file';
		this.description = 'Edit a file by searching for old text and replacing it with new text. Use this for targeted edits to existing files.';
		this.parameters = {
			type: 'object',
			properties: {
				file_path: {
					type: 'string',
					description: 'The path to the file to edit (absolute or relative to working directory)',
				},
				old_string: {
					type: 'string',
					description: 'The exact text to search for in the file. Must match exactly including whitespace.',
				},
				new_string: {
					type: 'string',
					description: 'The text to replace the old_string with',
				},
			},
			required: ['file_path', 'old_string', 'new_string'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['file_path', 'old_string', 'new_string']);

		// Resolve and validate path
		const resolvedPath = resolvePath(args.file_path, this.workingDir);

		try {
			// Read the current file contents
			const content = await fs.readFile(resolvedPath, 'utf-8');

			// Check if old_string exists in the file
			if (!content.includes(args.old_string)) {
				throw new Error(
					`Could not find the specified text in ${args.file_path}. Make sure old_string matches exactly.`,
				);
			}

			// Count occurrences
			const occurrences = content.split(args.old_string).length - 1;

			if (occurrences > 1) {
				throw new Error(
					`Found ${occurrences} occurrences of the text. The old_string must be unique in the file. Please provide more context to make it unique.`,
				);
			}

			// Replace the text
			const newContent = content.replace(args.old_string, args.new_string);

			// Write the updated content
			await fs.writeFile(resolvedPath, newContent, 'utf-8');

			// Track the change
			if (this.fileTracker) {
				this.fileTracker.recordChange(resolvedPath, 'modified', newContent);
			}

			return {
				path: resolvedPath,
				action: 'edited',
				occurrences: 1,
				old_length: args.old_string.length,
				new_length: args.new_string.length,
			};
		} catch (error) {
			if (error.code === 'ENOENT') {
				throw new Error(`File not found: ${args.file_path}`);
			}

			if (error.code === 'EACCES') {
				throw new Error(`Permission denied: ${args.file_path}`);
			}

			throw error;
		}
	}
}

export default EditFileTool;
