class BaseTool {
	constructor(workingDir, fileTracker = null) {
		this.workingDir = workingDir;
		this.fileTracker = fileTracker;

		// These must be defined by subclasses
		this.name = '';
		this.description = '';
		this.parameters = {};
	}

	// Returns tool definition for Grok /v1/responses API
	getDefinition() {
		return {
			type: 'function',
			name: this.name,
			description: this.description,
			parameters: this.parameters,
		};
	}

	// Execute the tool - must be implemented by subclasses
	async execute(args) {
		throw new Error(
			`execute() must be implemented by ${this.constructor.name}`,
		);
	}

	// Helper to validate required arguments
	validateArgs(args, requiredFields) {
		for (const field of requiredFields) {
			if (!(field in args)) {
				throw new Error(`Missing required argument: ${field}`);
			}
		}
	}
}

export default BaseTool;
