class TokenTracker {
	constructor(pricing = {}) {
		this.pricing = {
			inputCostPer1M: pricing.inputCostPer1M || 5.0,
			outputCostPer1M: pricing.outputCostPer1M || 15.0,
		};

		this.totalInputTokens = 0;
		this.totalOutputTokens = 0;
		this.requestCount = 0;
		this.requests = []; // Track individual requests
	}

	trackRequest(usage) {
		if (!usage) return;

		const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
		const outputTokens = usage.output_tokens || usage.completion_tokens || 0;

		this.totalInputTokens += inputTokens;
		this.totalOutputTokens += outputTokens;
		this.requestCount++;

		this.requests.push({
			timestamp: Date.now(),
			inputTokens,
			outputTokens,
			totalTokens: inputTokens + outputTokens,
		});
	}

	getTotalTokens() {
		return this.totalInputTokens + this.totalOutputTokens;
	}

	getTotalCost() {
		const inputCost =
			(this.totalInputTokens / 1_000_000) * this.pricing.inputCostPer1M;
		const outputCost =
			(this.totalOutputTokens / 1_000_000) * this.pricing.outputCostPer1M;
		return inputCost + outputCost;
	}

	getLastRequestUsage() {
		if (this.requests.length === 0) return null;
		return this.requests[this.requests.length - 1];
	}

	getSummary() {
		return {
			requests: this.requestCount,
			totalInputTokens: this.totalInputTokens,
			totalOutputTokens: this.totalOutputTokens,
			totalTokens: this.getTotalTokens(),
			totalCost: this.getTotalCost(),
			avgTokensPerRequest:
				this.requestCount > 0 ? this.getTotalTokens() / this.requestCount : 0,
		};
	}

	reset() {
		this.totalInputTokens = 0;
		this.totalOutputTokens = 0;
		this.requestCount = 0;
		this.requests = [];
	}
}

export default TokenTracker;
