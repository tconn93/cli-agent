import BaseTool from './base-tool.js';

class EnterPlanModeTool extends BaseTool {
	constructor(workingDir, fileTracker, planningModeManager) {
		super(workingDir, fileTracker);
		this.planningModeManager = planningModeManager;

		this.name = 'enter_plan_mode';
		this.description =
			'Enter planning mode to explore the codebase and design an implementation plan. Only read-only tools (read_file, list_files, search_files, explore_project) are available in this mode.';
		this.parameters = {
			type: 'object',
			properties: {},
			required: [],
		};
	}

	async execute(args) {
		return this.planningModeManager.enterPlanMode();
	}
}

export default EnterPlanModeTool;
