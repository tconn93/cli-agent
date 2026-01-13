class ToolExecutor {
	constructor(
		workingDirectory,
		fileTracker = null,
		planningModeManager = null,
	) {
		this.workingDir = workingDirectory;
		this.fileTracker = fileTracker;
		this.planningModeManager = planningModeManager;
		this.tools = new Map();
	}

	// Register a tool
	registerTool(tool) {
		this.tools.set(tool.name, tool);
	}

	// Get all tool definitions for API
	getToolDefinitions() {
		return Array.from(this.tools.values()).map(tool => tool.getDefinition());
	}

	// Execute a single tool call from the API (for /v1/responses format)
	async execute(toolCall) {
		const toolName = toolCall.name;
		const tool = this.tools.get(toolName);

		if (!tool) {
			return {
				type: 'function_call_output',
				call_id: toolCall.call_id,
				output: JSON.stringify({
					error: true,
					message: `Unknown tool: ${toolName}`,
				}),
			};
		}

		// Check if tool is allowed in current mode
		if (
			this.planningModeManager &&
			!this.planningModeManager.isToolAllowed(toolName)
		) {
			return {
				type: 'function_call_output',
				call_id: toolCall.call_id,
				output: JSON.stringify({
					error: true,
					message: `Tool '${toolName}' is not allowed in planning mode. Only read-only tools (read_file, list_files, search_files, explore_project, exit_plan_mode) are permitted.`,
				}),
			};
		}

		try {
			// Parse arguments
			const args = JSON.parse(toolCall.arguments);

			// Execute the tool
			const result = await tool.execute(args);

			// Return formatted result for /v1/responses API
			return {
				type: 'function_call_output',
				call_id: toolCall.call_id,
				output: JSON.stringify({
					success: true,
					result,
				}),
			};
		} catch (error) {
			// Return error result
			return {
				type: 'function_call_output',
				call_id: toolCall.call_id,
				output: JSON.stringify({
					error: true,
					message: error.message,
					tool: toolName,
				}),
			};
		}
	}

	// Execute multiple tool calls in parallel
	async executeAll(toolCalls) {
		return Promise.all(toolCalls.map(call => this.execute(call)));
	}
}

export default ToolExecutor;
