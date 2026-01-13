import SubAgent from './sub-agent.js';

class SubAgentManager {
	constructor(apiToken, toolExecutor, config, grokClientClass) {
		this.apiToken = apiToken;
		this.toolExecutor = toolExecutor;
		this.config = config;
		this.grokClientClass = grokClientClass;
		this.agents = new Map(); // agentId -> SubAgent
		this.activeAgents = new Set();
		this.maxConcurrentAgents = 5;
	}

	async spawnAgent(prompt, parentAgentId = 'main') {
		// Check if we've reached the max concurrent agents limit
		if (this.activeAgents.size >= this.maxConcurrentAgents) {
			throw new Error(
				`Maximum number of active sub-agents (${this.maxConcurrentAgents}) reached. Please wait for some agents to complete.`,
			);
		}

		const agent = new SubAgent(
			this.apiToken,
			this.toolExecutor,
			this.config,
			parentAgentId,
			this.grokClientClass,
		);

		this.agents.set(agent.id, agent);
		this.activeAgents.add(agent.id);

		// Execute asynchronously
		const resultPromise = agent.execute(prompt);

		resultPromise
			.then(() => {
				this.activeAgents.delete(agent.id);
			})
			.catch(() => {
				this.activeAgents.delete(agent.id);
			});

		return {
			agentId: agent.id,
			promise: resultPromise,
		};
	}

	async spawnMultiple(tasks) {
		// Validate we don't exceed max concurrent agents
		if (tasks.length > this.maxConcurrentAgents) {
			throw new Error(
				`Cannot spawn ${tasks.length} agents. Maximum concurrent agents: ${this.maxConcurrentAgents}`,
			);
		}

		if (this.activeAgents.size + tasks.length > this.maxConcurrentAgents) {
			throw new Error(
				`Cannot spawn ${tasks.length} new agents. Currently ${this.activeAgents.size} active, max: ${this.maxConcurrentAgents}`,
			);
		}

		const spawned = await Promise.all(
			tasks.map(task => this.spawnAgent(task.prompt)),
		);

		const results = await Promise.all(spawned.map(s => s.promise));

		return spawned.map((s, index) => ({
			agentId: s.agentId,
			result: results[index],
		}));
	}

	getAgent(agentId) {
		return this.agents.get(agentId);
	}

	getActiveAgents() {
		return Array.from(this.activeAgents).map(id =>
			this.agents.get(id).getStatus(),
		);
	}

	getAllAgents() {
		return Array.from(this.agents.values()).map(a => a.getStatus());
	}

	getActiveAgentCount() {
		return this.activeAgents.size;
	}
}

export default SubAgentManager;
