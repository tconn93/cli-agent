import fs from 'fs/promises';
import path from 'path';
import {glob} from 'glob';
import BaseTool from './base-tool.js';

class ExploreProjectTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'explore_project';
		this.description = 'Get a file tree structure of the project. Shows directories and files with their hierarchy, excluding .gitignore patterns.';
		this.parameters = {
			type: 'object',
			properties: {
				max_depth: {
					type: 'number',
					description: 'Maximum depth to traverse (default: 5). Use lower values for large projects.',
				},
				include_hidden: {
					type: 'boolean',
					description: 'Include hidden files/directories starting with . (default: false)',
				},
			},
			required: [],
		};
	}

	async execute(args) {
		const maxDepth = args.max_depth || 5;
		const includeHidden = args.include_hidden || false;

		try {
			// Read .gitignore patterns
			const ignorePatterns = await this.readGitignore();

			// Build file tree
			const tree = await this.buildTree(this.workingDir, '', 0, maxDepth, ignorePatterns, includeHidden);

			// Format tree as string
			const treeString = this.formatTree(tree);

			// Count files and directories
			const stats = this.countNodes(tree);

			return {
				tree: treeString,
				root: this.workingDir,
				max_depth: maxDepth,
				total_files: stats.files,
				total_directories: stats.directories,
			};
		} catch (error) {
			throw new Error(`Failed to explore project: ${error.message}`);
		}
	}

	async readGitignore() {
		const gitignorePath = path.join(this.workingDir, '.gitignore');
		const patterns = [
			// Always ignore these
			'.git',
			'node_modules',
			'.DS_Store',
		];

		try {
			const content = await fs.readFile(gitignorePath, 'utf-8');
			const lines = content.split('\n');

			for (const line of lines) {
				const trimmed = line.trim();
				// Skip empty lines and comments
				if (trimmed && !trimmed.startsWith('#')) {
					patterns.push(trimmed);
				}
			}
		} catch {
			// No .gitignore file, use defaults
		}

		return patterns;
	}

	shouldIgnore(filePath, ignorePatterns, includeHidden) {
		const basename = path.basename(filePath);

		// Check if hidden file/directory
		if (!includeHidden && basename.startsWith('.')) {
			return true;
		}

		// Check against ignore patterns
		for (const pattern of ignorePatterns) {
			// Simple pattern matching (you could use a library like 'ignore' for full gitignore support)
			if (pattern.endsWith('/')) {
				// Directory pattern
				if (basename === pattern.slice(0, -1)) {
					return true;
				}
			} else if (pattern.includes('*')) {
				// Glob pattern - simple matching
				const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
				if (regex.test(basename)) {
					return true;
				}
			} else {
				// Exact match
				if (basename === pattern || filePath.includes(pattern)) {
					return true;
				}
			}
		}

		return false;
	}

	async buildTree(dirPath, prefix, depth, maxDepth, ignorePatterns, includeHidden) {
		if (depth >= maxDepth) {
			return null;
		}

		try {
			const entries = await fs.readdir(dirPath, {withFileTypes: true});
			const tree = [];

			// Sort: directories first, then files, alphabetically
			const sorted = entries.sort((a, b) => {
				if (a.isDirectory() && !b.isDirectory()) return -1;
				if (!a.isDirectory() && b.isDirectory()) return 1;
				return a.name.localeCompare(b.name);
			});

			for (const entry of sorted) {
				const fullPath = path.join(dirPath, entry.name);

				// Check if should be ignored
				if (this.shouldIgnore(fullPath, ignorePatterns, includeHidden)) {
					continue;
				}

				const node = {
					name: entry.name,
					type: entry.isDirectory() ? 'directory' : 'file',
					children: null,
				};

				if (entry.isDirectory()) {
					// Recursively build tree for subdirectories
					node.children = await this.buildTree(
						fullPath,
						prefix + '  ',
						depth + 1,
						maxDepth,
						ignorePatterns,
						includeHidden,
					);
				}

				tree.push(node);
			}

			return tree;
		} catch (error) {
			// Permission denied or other error
			return null;
		}
	}

	formatTree(nodes, prefix = '', isLast = true) {
		if (!nodes || nodes.length === 0) {
			return '';
		}

		let result = '';

		nodes.forEach((node, index) => {
			const isLastNode = index === nodes.length - 1;
			const connector = isLastNode ? '└── ' : '├── ';
			const icon = node.type === 'directory' ? '📁 ' : '📄 ';

			result += prefix + connector + icon + node.name + '\n';

			if (node.children && node.children.length > 0) {
				const childPrefix = prefix + (isLastNode ? '    ' : '│   ');
				result += this.formatTree(node.children, childPrefix, isLastNode);
			}
		});

		return result;
	}

	countNodes(nodes) {
		if (!nodes) {
			return {files: 0, directories: 0};
		}

		let files = 0;
		let directories = 0;

		for (const node of nodes) {
			if (node.type === 'directory') {
				directories++;
				if (node.children) {
					const childStats = this.countNodes(node.children);
					files += childStats.files;
					directories += childStats.directories;
				}
			} else {
				files++;
			}
		}

		return {files, directories};
	}
}

export default ExploreProjectTool;
