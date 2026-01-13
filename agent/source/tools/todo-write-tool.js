import {promises as fs} from 'node:fs';
import path from 'node:path';
import BaseTool from './base-tool.js';

class TodoWriteTool extends BaseTool {
	constructor(workingDir, fileTracker) {
		super(workingDir, fileTracker);

		this.name = 'todo_write';
		this.description =
			'Manage TODO.md file with task tracking. Use this proactively for multi-step tasks to track progress. Tasks appear in real-time in the UI.';
		this.parameters = {
			type: 'object',
			properties: {
				todos: {
					type: 'array',
					description:
						'Array of todo items with content, status, and activeForm',
					items: {
						type: 'object',
						properties: {
							content: {
								type: 'string',
								description:
									'Task description in imperative form (e.g., "Run tests")',
							},
							status: {
								type: 'string',
								enum: ['pending', 'in_progress', 'completed'],
								description: 'Task status: pending, in_progress, or completed',
							},
							activeForm: {
								type: 'string',
								description: 'Present continuous form (e.g., "Running tests")',
							},
						},
						required: ['content', 'status', 'activeForm'],
					},
				},
			},
			required: ['todos'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['todos']);

		const todoPath = path.join(this.workingDir, 'TODO.md');

		// Validate all todo statuses
		for (const todo of args.todos) {
			if (!['pending', 'in_progress', 'completed'].includes(todo.status)) {
				throw new Error(
					`Invalid status: ${todo.status}. Must be pending, in_progress, or completed.`,
				);
			}
		}

		// Build markdown content
		let content = '# Tasks\n\n';

		for (const todo of args.todos) {
			const statusChar = {
				pending: ' ',
				in_progress: '→',
				completed: 'x',
			}[todo.status];

			const displayText =
				todo.status === 'in_progress' ? todo.activeForm : todo.content;

			content += `- [${statusChar}] ${displayText}\n`;
		}

		await fs.writeFile(todoPath, content, 'utf-8');

		if (this.fileTracker) {
			this.fileTracker.recordChange(todoPath, 'modified', content);
		}

		return {
			path: todoPath,
			task_count: args.todos.length,
			pending: args.todos.filter(t => t.status === 'pending').length,
			in_progress: args.todos.filter(t => t.status === 'in_progress').length,
			completed: args.todos.filter(t => t.status === 'completed').length,
		};
	}
}

export default TodoWriteTool;
