import {promises as fs} from 'node:fs';
import path from 'node:path';

export class TodoReader {
	static async readTodoFile(workingDir) {
		const todoPath = path.join(workingDir, 'TODO.md');

		try {
			const content = await fs.readFile(todoPath, 'utf-8');
			return this.parseTodoContent(content);
		} catch (error) {
			if (error.code === 'ENOENT') {
				return []; // No todo file yet
			}

			throw error;
		}
	}

	static parseTodoContent(content) {
		const lines = content.split('\n');
		const todos = [];

		for (const line of lines) {
			const match = line.match(/^- \[(.)\] (.+)$/);
			if (match) {
				const [, statusChar, text] = match;

				const status =
					{
						' ': 'pending',
						'→': 'in_progress',
						x: 'completed',
					}[statusChar] || 'pending';

				todos.push({
					content: text,
					status,
				});
			}
		}

		return todos;
	}
}
