class OpenAIClient {
	constructor(apiToken, apiUrl) {
		this.apiToken = apiToken;
		this.apiUrl = apiUrl;
		this.maxRetries = 3;
		this.messageHistory = [];
	}

	addUserMessage(content) {
		this.messageHistory.push({
			role: 'user',
			content,
		});
	}

	addAssistantMessage(content, toolCalls = null) {
		const message = {
			role: 'assistant',
			content: content || null,
		};

		if (toolCalls && toolCalls.length > 0) {
			message.tool_calls = toolCalls;
		}

		this.messageHistory.push(message);
	}

	addToolResults(toolResults) {
		// toolResults format: [{call_id, output}, ...]
		for (const result of toolResults) {
			this.messageHistory.push({
				role: 'tool',
				tool_call_id: result.call_id,
				content: result.output,
			});
		}
	}

	async sendMessage(tools, options = {}) {
		// Validate we have messages to send
		if (this.messageHistory.length === 0) {
			throw new Error('No messages in history. Call addUserMessage() first.');
		}

		const requestBody = {
			messages: this.messageHistory,
			model: options.model || 'gpt-4',
			temperature: options.temperature ?? 0.7,
		};

		if (tools && tools.length > 0) {
			requestBody.tools = tools;
			requestBody.tool_choice = 'auto';
		}

		const response = await this._makeRequest(requestBody);

		// Extract the assistant's response
		const choice = response.choices?.[0];
		if (!choice) {
			throw new Error('No response from API');
		}

		return {
			content: choice.message.content,
			tool_calls: choice.message.tool_calls || [],
			finish_reason: choice.finish_reason,
		};
	}

	resetConversation() {
		this.messageHistory = [];
	}

	async _makeRequest(body, retryCount = 0) {
		try {
			const response = await fetch(`${this.apiUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiToken}`,
				},
				body: JSON.stringify(body),
			});

			// Handle different HTTP status codes
			if (response.status === 429) {
				// Rate limit
				const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);

				if (retryCount < this.maxRetries) {
					await this._sleep(retryAfter * 1000);
					return this._makeRequest(body, retryCount + 1);
				}

				throw new Error('Rate limit exceeded. Please try again later.');
			}

			if (response.status === 401) {
				throw new Error('Invalid API token. Please check your API_TOKEN configuration.');
			}

			if (response.status === 404) {
				throw new Error(
					'API endpoint not found. Please check your API_URL.\n' +
					'Expected format: https://api.provider.com/v1\n' +
					'Actual: ' + this.apiUrl,
				);
			}

			if (response.status >= 500) {
				// Server error - retry with exponential backoff
				if (retryCount < this.maxRetries) {
					const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
					await this._sleep(delay);
					return this._makeRequest(body, retryCount + 1);
				}

				throw new Error(`Server error (${response.status}). Please try again later.`);
			}

			if (!response.ok) {
				// Try to get the error response body
				const responseText = await response.text();

				let errorData = {};
				try {
					errorData = JSON.parse(responseText);
				} catch {
					// Not JSON, use the raw text
					throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
				}

				const errorMessage = errorData.error?.message
					|| errorData.message
					|| errorData.detail
					|| (errorData.error ? JSON.stringify(errorData.error) : null)
					|| JSON.stringify(errorData)
					|| `HTTP ${response.status}: ${response.statusText}`;

				throw new Error(errorMessage);
			}

			return response.json();
		} catch (error) {

			// Network errors - retry
			if (error.name === 'TypeError' && retryCount < this.maxRetries) {
				const delay = Math.pow(2, retryCount) * 1000;
				await this._sleep(delay);
				return this._makeRequest(body, retryCount + 1);
			}

			throw error;
		}
	}

	_sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default OpenAIClient;
