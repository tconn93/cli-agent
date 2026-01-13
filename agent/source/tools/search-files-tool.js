import {glob} from 'glob';
import fs from 'fs/promises';
import path from 'path';
import BaseTool from './base-tool.js';

class SearchFilesTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'search_files';
		this.description =
			'Search for text or regex patterns in files. Returns matching lines with line numbers.';
		this.parameters = {
			type: 'object',
			properties: {
				pattern: {
					type: 'string',
					description: 'Text or regex pattern to search for',
				},
				file_pattern: {
					type: 'string',
					description:
						'Glob pattern for files to search (e.g., "**/*.js"). Defaults to all files.',
				},
				case_sensitive: {
					type: 'boolean',
					description:
						'Whether the search should be case-sensitive (default: false)',
				},
				max_results: {
					type: 'number',
					description:
						'Maximum number of matching files to return (default: 50)',
				},
			},
			required: ['pattern'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['pattern']);

		const filePattern = args.file_pattern || '**/*';
		const caseSensitive = args.case_sensitive ?? false;
		const maxResults = args.max_results || 50;

		try {
			// Create regex for searching
			const flags = caseSensitive ? 'g' : 'gi';
			const searchRegex = new RegExp(args.pattern, flags);

			// Find files to search
			const files = await glob(filePattern, {
				cwd: this.workingDir,
				nodir: true,
				dot: false,
				ignore: ['node_modules/**', '.git/**', '**/dist/**', '**/build/**'],
			});

			const results = [];

			// Search through files
			for (const file of files) {
				if (results.length >= maxResults) {
					break;
				}

				const filePath = path.join(this.workingDir, file);

				try {
					// Skip binary files (basic check)
					const stats = await fs.stat(filePath);
					if (stats.size > 1024 * 1024) {
						// Skip files larger than 1MB
						continue;
					}

					const content = await fs.readFile(filePath, 'utf-8');
					const lines = content.split('\n');
					const matches = [];

					lines.forEach((line, index) => {
						if (searchRegex.test(line)) {
							matches.push({
								line_number: index + 1,
								content: line.trim(),
							});
						}
					});

					if (matches.length > 0) {
						results.push({
							file: file,
							absolute_path: filePath,
							matches: matches.slice(0, 10), // Limit to 10 matches per file
							total_matches: matches.length,
						});
					}
				} catch (error) {
					// Skip files that can't be read (binary, permission issues, etc.)
					continue;
				}
			}

			return {
				pattern: args.pattern,
				file_pattern: filePattern,
				case_sensitive: caseSensitive,
				files_searched: files.length,
				files_with_matches: results.length,
				results,
			};
		} catch (error) {
			throw new Error(`Search failed: ${error.message}`);
		}
	}
}

export default SearchFilesTool;
