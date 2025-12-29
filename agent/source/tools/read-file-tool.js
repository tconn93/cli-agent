import fs from 'fs/promises';
import BaseTool from './base-tool.js';
import {resolvePath} from '../utils/path-resolver.js';

class ReadFileTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'read_file';
		this.description = 'Read the contents of a file from the filesystem';
		this.parameters = {
			type: 'object',
			properties: {
				file_path: {
					type: 'string',
					description: 'The path to the file to read (absolute or relative to working directory)',
				},
			},
			required: ['file_path'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['file_path']);

		// Resolve and validate path
		const resolvedPath = resolvePath(args.file_path, this.workingDir);

		try {
			// Check if file exists and is a file (not directory)
			const stats = await fs.stat(resolvedPath);

			if (!stats.isFile()) {
				throw new Error('Path is not a file');
			}

			// Read file contents
			const content = await fs.readFile(resolvedPath, 'utf-8');

			return {
				path: resolvedPath,
				content,
				size: stats.size,
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

export default ReadFileTool;
