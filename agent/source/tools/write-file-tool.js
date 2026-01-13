import fs from 'fs/promises';
import path from 'path';
import BaseTool from './base-tool.js';
import {resolvePath} from '../utils/path-resolver.js';

class WriteFileTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'write_file';
		this.description =
			"Write content to a file, creating it if it doesn't exist or overwriting if it does";
		this.parameters = {
			type: 'object',
			properties: {
				file_path: {
					type: 'string',
					description:
						'The path to the file to write (absolute or relative to working directory)',
				},
				content: {
					type: 'string',
					description: 'The content to write to the file',
				},
			},
			required: ['file_path', 'content'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['file_path', 'content']);

		// Resolve and validate path
		const resolvedPath = resolvePath(args.file_path, this.workingDir);

		try {
			// Check if file exists
			const exists = await fs
				.access(resolvedPath)
				.then(() => true)
				.catch(() => false);

			// Create directory if it doesn't exist
			const dir = path.dirname(resolvedPath);
			await fs.mkdir(dir, {recursive: true});

			// Write file
			await fs.writeFile(resolvedPath, args.content, 'utf-8');

			// Track the change
			if (this.fileTracker) {
				this.fileTracker.recordChange(
					resolvedPath,
					exists ? 'modified' : 'created',
					args.content,
				);
			}

			return {
				path: resolvedPath,
				action: exists ? 'modified' : 'created',
				size: Buffer.byteLength(args.content, 'utf-8'),
			};
		} catch (error) {
			if (error.code === 'EACCES') {
				throw new Error(`Permission denied: ${args.file_path}`);
			}

			throw error;
		}
	}
}

export default WriteFileTool;
