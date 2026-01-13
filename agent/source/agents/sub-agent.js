import {randomBytes} from 'node:crypto';

function generateUniqueId() {
	return randomBytes(4).toString('hex');
}

class SubAgent {
	constructor(apiToken, toolExecutor, config, parentId, grokClientClass) {
		this.id = generateUniqueId();
		this.parentId = parentId;
		this.grokClient = new grokClientClass(apiToken);
		this.toolExecutor = toolExecutor;
		this.config = config;
		this.status = 'idle'; // 'idle' | 'running' | 'completed' | 'error'
		this.result = null;
		this.error = null;
		this.messages = [];
	}

	async execute(prompt) {
		this.status = 'running';

		try {
			// 1. Send initial prompt to Grok API
			let response = await this.grokClient.sendMessage(
				prompt,
				this.toolExecutor.getToolDefinitions(),
				{model: this.config.model},
			);

			// 2. Process response and handle tool calls iteratively
			let continueLoop = true;
			let maxIterations = 10; // Safety limit
			let iteration = 0;

			while (continueLoop && iteration < maxIterations) {
				iteration++;

				const {output} = response;

				// Extract assistant message and tool calls
				const assistantMessages = output.filter(
					item => item.type === 'message' && item.role === 'assistant',
				);
				const toolCalls = output.filter(item => item.type === 'function_call');

				// Extract text content from assistant message
				let assistantText = '';
				if (assistantMessages.length > 0) {
					const content = assistantMessages[0].content || [];
					const textContent = content.find(c => c.type === 'output_text');
					if (textContent) {
						assistantText = textContent.text;
					}
				}

				// Store message
				if (assistantText || toolCalls.length > 0) {
					this.messages.push({
						role: 'assistant',
						content: assistantText || '(Using tools...)',
						tool_calls: toolCalls.length > 0 ? toolCalls : null,
						timestamp: Date.now(),
					});
				}

				// Check if there are tool calls to execute
				if (toolCalls.length > 0) {
					// Execute all tools in parallel
					const toolResults = await this.toolExecutor.executeAll(toolCalls);

					// Store tool results
					this.messages.push(
						...toolResults.map(result => ({
							role: 'tool',
							content: result.output,
							call_id: result.call_id,
							timestamp: Date.now(),
						})),
					);

					// Send tool results back to API
					response = await this.grokClient.sendMessage(
						toolResults,
						this.toolExecutor.getToolDefinitions(),
						{model: this.config.model},
					);

					// Loop continues to check if there are more tool calls
				} else {
					// No more tool calls, exit the loop
					continueLoop = false;
				}
			}

			// Extract final output
			const lastMessage = this.messages[this.messages.length - 1];
			const finalOutput = lastMessage?.content || '';

			this.result = {
				success: true,
				output: finalOutput,
				messages: this.messages,
			};
			this.status = 'completed';

			return this.result;
		} catch (error) {
			this.error = error.message;
			this.status = 'error';
			this.result = {success: false, error: error.message};
			return this.result;
		}
	}

	getStatus() {
		return {
			id: this.id,
			parentId: this.parentId,
			status: this.status,
			result: this.result,
			error: this.error,
			messageCount: this.messages.length,
		};
	}
}

export default SubAgent;
