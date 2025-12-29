class GrokClient {
	constructor(apiToken, baseURL = 'https://api.x.ai/v1') {
		this.apiToken = apiToken;
		this.baseURL = baseURL;
		this.maxRetries = 3;
		this.previousResponseId = null;
	}

	async sendMessage(userMessage, tools, options = {}) {
		// Format input based on whether it's a new message or tool results
		let input;

		if (typeof userMessage === 'string') {
			// New user message
			input = userMessage;
		} else if (Array.isArray(userMessage)) {
			// Tool results (array of function_call_output)
			input = userMessage;
		} else {
			throw new Error('Invalid input format');
		}

		const requestBody = {
			input,
			model: options.model || 'grok-beta',
			temperature: options.temperature ?? 0.7,
			stream: options.stream ?? false,
		};

		// Include previous response ID if continuing conversation
		if (this.previousResponseId && !options.newConversation) {
			requestBody.previous_response_id = this.previousResponseId;
		}

		// Only include tools if they exist and have length
		if (tools && tools.length > 0) {
			requestBody.tools = tools;
			requestBody.tool_choice = 'auto';
		}

		const response = await this._makeRequest(requestBody);

		// Store response ID for next turn
		if (response.id) {
			this.previousResponseId = response.id;
		}

		return response;
	}

	resetConversation() {
		this.previousResponseId = null;
	}

	async _makeRequest(body, retryCount = 0) {
		try {
			// Log the request for debugging
			console.log('Request to Grok API:', JSON.stringify(body, null, 2));

			const response = await fetch(`${this.baseURL}/responses`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiToken}`,
				},
				body: JSON.stringify(body),
			});

			// Log response status
			console.log('Response status:', response.status);

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
				throw new Error('Invalid API token. Please check your configuration.');
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
				console.log('Error response body:', responseText);

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

			const responseData = await response.json();
			console.log('Success response:', JSON.stringify(responseData, null, 2));
			return responseData;
		} catch (error) {
			console.error('Request error:', error);

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

export default GrokClient;
