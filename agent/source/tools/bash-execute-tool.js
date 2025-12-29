import {exec} from 'child_process';
import {promisify} from 'util';
import BaseTool from './base-tool.js';

const execAsync = promisify(exec);

class BashExecuteTool extends BaseTool {
	constructor(workingDir, fileTracker = null) {
		super(workingDir, fileTracker);

		this.name = 'bash_execute';
		this.description = 'Execute a bash command and return its output';
		this.parameters = {
			type: 'object',
			properties: {
				command: {
					type: 'string',
					description: 'The bash command to execute',
				},
			},
			required: ['command'],
		};
		this.timeout = 30000; // 30 second timeout
	}

	async execute(args) {
		this.validateArgs(args, ['command']);

		try {
			const {stdout, stderr} = await execAsync(args.command, {
				cwd: this.workingDir,
				timeout: this.timeout,
				maxBuffer: 1024 * 1024, // 1MB max output
			});

			return {
				command: args.command,
				stdout: stdout || '',
				stderr: stderr || '',
				exitCode: 0,
			};
		} catch (error) {
			// exec throws on non-zero exit codes
			return {
				command: args.command,
				stdout: error.stdout || '',
				stderr: error.stderr || error.message,
				exitCode: error.code || 1,
			};
		}
	}
}

export default BashExecuteTool;
