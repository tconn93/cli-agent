import BaseTool from './base-tool.js';

class TaskTool extends BaseTool {
	constructor(workingDir, fileTracker, subAgentManager) {
		super(workingDir, fileTracker);
		this.subAgentManager = subAgentManager;

		this.name = 'task';
		this.description =
			'Spawn a sub-agent to work on a specific task in parallel. The sub-agent has full access to tools and returns its final result. Use this for complex multi-step tasks that can run independently.';
		this.parameters = {
			type: 'object',
			properties: {
				prompt: {
					type: 'string',
					description:
						'The task prompt for the sub-agent. Be specific and include all necessary context, goals, and constraints.',
				},
				description: {
					type: 'string',
					description:
						'Brief description of the task for tracking and display (optional)',
				},
			},
			required: ['prompt'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['prompt']);

		try {
			const {agentId, promise} = await this.subAgentManager.spawnAgent(
				args.prompt,
			);

			// Wait for the sub-agent to complete
			const result = await promise;

			return {
				agent_id: agentId,
				success: result.success,
				output: result.output || '',
				error: result.error || null,
				message_count: result.messages?.length || 0,
			};
		} catch (error) {
			return {
				agent_id: null,
				success: false,
				output: '',
				error: error.message,
				message_count: 0,
			};
		}
	}
}

export default TaskTool;
