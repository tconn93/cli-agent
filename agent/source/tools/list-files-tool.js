import {glob} from 'glob';
import path from 'path';
import BaseTool from './base-tool.js';

class ListFilesTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'list_files';
		this.description =
			'List files and directories matching a glob pattern. Use patterns like "*.js", "src/**/*.ts", or "**/*.json" to find files.';
		this.parameters = {
			type: 'object',
			properties: {
				pattern: {
					type: 'string',
					description:
						'Glob pattern to match files. Examples: "*.js" (all JS files in current dir), "src/**/*.ts" (all TS files in src), "**/*.json" (all JSON files recursively)',
				},
				max_results: {
					type: 'number',
					description: 'Maximum number of results to return (default: 100)',
				},
			},
			required: ['pattern'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['pattern']);

		const maxResults = args.max_results || 100;

		try {
			// Use glob to find matching files
			const files = await glob(args.pattern, {
				cwd: this.workingDir,
				nodir: false, // Include directories
				dot: false, // Don't include hidden files by default
				ignore: ['node_modules/**', '.git/**'], // Common directories to ignore
			});

			// Limit results
			const limitedFiles = files.slice(0, maxResults);

			// Convert to absolute paths and get stats
			const results = limitedFiles.map(file => ({
				path: path.join(this.workingDir, file),
				relativePath: file,
			}));

			return {
				pattern: args.pattern,
				count: results.length,
				total: files.length,
				truncated: files.length > maxResults,
				files: results,
			};
		} catch (error) {
			throw new Error(`Failed to list files: ${error.message}`);
		}
	}
}

export default ListFilesTool;
