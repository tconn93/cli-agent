import {promises as fs} from 'node:fs';
import path from 'node:path';

class PlanningModeManager {
	constructor(workingDir) {
		this.workingDir = workingDir;
		this.mode = 'idle'; // 'idle' | 'planning' | 'awaiting_approval'
		this.planFilePath = null;
	}

	enterPlanMode() {
		if (this.mode !== 'idle') {
			throw new Error('Already in planning mode or awaiting approval');
		}

		this.mode = 'planning';
		return {
			success: true,
			message: 'Entered planning mode. Only read-only tools are available.',
		};
	}

	async exitPlanMode(planContent) {
		if (this.mode !== 'planning') {
			throw new Error('Not in planning mode');
		}

		// Write plan to file
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, '-')
			.replace(/T/, '_')
			.split('.')[0];
		const planFileName = `PLAN_${timestamp}.md`;
		this.planFilePath = path.join(this.workingDir, planFileName);

		await fs.writeFile(this.planFilePath, planContent, 'utf-8');

		this.mode = 'awaiting_approval';
		return {
			success: true,
			message: `Plan written to ${planFileName}. Awaiting user approval. Use /approve to proceed or /reject to revise.`,
			plan_file: this.planFilePath,
		};
	}

	approvePlan() {
		if (this.mode !== 'awaiting_approval') {
			throw new Error('Not awaiting approval');
		}

		this.mode = 'idle';
		return {
			success: true,
			message: 'Plan approved. Resuming normal operation.',
		};
	}

	rejectPlan() {
		if (this.mode !== 'awaiting_approval') {
			throw new Error('Not awaiting approval');
		}

		this.mode = 'planning';
		return {
			success: true,
			message: 'Plan rejected. Returning to planning mode.',
		};
	}

	isPlanning() {
		return this.mode === 'planning';
	}

	isAwaitingApproval() {
		return this.mode === 'awaiting_approval';
	}

	getMode() {
		return this.mode;
	}

	// Tool filter for planning mode
	isToolAllowed(toolName) {
		if (this.mode !== 'planning') {
			return true; // All tools allowed in non-planning modes
		}

		const readOnlyTools = [
			'read_file',
			'list_files',
			'search_files',
			'explore_project',
			'exit_plan_mode',
		];

		return readOnlyTools.includes(toolName);
	}
}

export default PlanningModeManager;
