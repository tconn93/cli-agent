import BaseTool from './base-tool.js';

class ExitPlanModeTool extends BaseTool {
	constructor(workingDir, fileTracker, planningModeManager) {
		super(workingDir, fileTracker);
		this.planningModeManager = planningModeManager;

		this.name = 'exit_plan_mode';
		this.description =
			'Exit planning mode by writing the plan to a file. The plan will be presented to the user for approval. Include the complete implementation plan in markdown format.';
		this.parameters = {
			type: 'object',
			properties: {
				plan_content: {
					type: 'string',
					description:
						'The complete plan content in markdown format with implementation details',
				},
			},
			required: ['plan_content'],
		};
	}

	async execute(args) {
		this.validateArgs(args, ['plan_content']);
		return await this.planningModeManager.exitPlanMode(args.plan_content);
	}
}

export default ExitPlanModeTool;
