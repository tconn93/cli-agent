class CommandHandler {
	constructor() {
		this.commands = new Map();
		this.registerDefaultCommands();
	}

	registerDefaultCommands() {
		this.register('help', {
			description: 'Show available commands',
			usage: '/help [command]',
			handler: (args, context) => {
				if (args.length > 0) {
					const cmdName = args[0];
					const cmd = this.commands.get(cmdName);
					if (cmd) {
						return {
							success: true,
							message: `**/${cmdName}** - ${cmd.description}\n\nUsage: ${cmd.usage}`,
						};
					}

					return {
						success: false,
						message: `Unknown command: /${cmdName}`,
					};
				}

				const commandList = Array.from(this.commands.entries())
					.map(([name, cmd]) => `  **/${name}** - ${cmd.description}`)
					.join('\n');

				return {
					success: true,
					message: `Available commands:\n\n${commandList}\n\nType /help <command> for more info.`,
				};
			},
		});

		this.register('clear', {
			description: 'Clear conversation history',
			usage: '/clear',
			handler: (args, context) => {
				if (context.clearMessages) {
					context.clearMessages();
					return {
						success: true,
						message: 'Conversation history cleared.',
					};
				}

				return {
					success: false,
					message: 'Failed to clear conversation.',
				};
			},
		});

		this.register('exit', {
			description: 'Exit the application',
			usage: '/exit',
			handler: () => {
				return {
					success: true,
					message: 'Goodbye!',
					exit: true,
				};
			},
		});

		this.register('tools', {
			description: 'List all available tools',
			usage: '/tools',
			handler: (args, context) => {
				if (!context.toolExecutor) {
					return {
						success: false,
						message: 'Tool executor not available.',
					};
				}

				const tools = context.toolExecutor.getToolDefinitions();
				const toolList = tools
					.map(tool => `  **${tool.name}** - ${tool.description}`)
					.join('\n');

				return {
					success: true,
					message: `Available tools (${tools.length}):\n\n${toolList}`,
				};
			},
		});

		this.register('stats', {
			description: 'Show session statistics',
			usage: '/stats',
			handler: (args, context) => {
				const {messages = [], fileTracker, config} = context;

				const userMessages = messages.filter(m => m.role === 'user').length;
				const assistantMessages = messages.filter(
					m => m.role === 'assistant',
				).length;
				const toolCalls = messages.filter(
					m => m.role === 'assistant' && m.tool_calls,
				).length;

				let stats = `**Session Statistics**\n\n`;
				stats += `Model: ${config?.model || 'Unknown'}\n`;
				stats += `Working Directory: ${config?.workingDir || 'Unknown'}\n\n`;
				stats += `Total Messages: ${messages.length}\n`;
				stats += `User Messages: ${userMessages}\n`;
				stats += `Assistant Messages: ${assistantMessages}\n`;
				stats += `Tool Executions: ${toolCalls}\n`;

				if (fileTracker) {
					const summary = fileTracker.exportSummary();
					stats += `\n**File Changes**\n`;
					stats += `Files Modified: ${summary.total}\n`;
					stats += `Created: ${summary.created}\n`;
					stats += `Modified: ${summary.modified}\n`;
				}

				return {
					success: true,
					message: stats,
				};
			},
		});

		this.register('reset', {
			description: 'Reset conversation (alias for /clear)',
			usage: '/reset',
			handler: (args, context) => {
				return this.commands.get('clear').handler(args, context);
			},
		});

		this.register('init', {
			description:
				'Initialize project context by exploring structure and creating GROK.md',
			usage: '/init',
			handler: async (args, context) => {
				const {toolExecutor, grokClient, config} = context;

				if (!toolExecutor || !grokClient) {
					return {
						success: false,
						message: 'Tool executor or Grok client not available.',
					};
				}

				try {
					// Return a special marker indicating this is an async command
					return {
						success: true,
						async: true,
						message: 'Initializing project context...',
						executor: async () => {
							return await this.executeInit(toolExecutor, grokClient, config);
						},
					};
				} catch (error) {
					return {
						success: false,
						message: `Failed to initialize: ${error.message}`,
					};
				}
			},
		});

		this.register('approve', {
			description: 'Approve the current plan and exit planning mode',
			usage: '/approve',
			handler: (args, context) => {
				const {planningModeManager} = context;

				if (!planningModeManager) {
					return {
						success: false,
						message: 'Planning mode manager not available.',
					};
				}

				try {
					const result = planningModeManager.approvePlan();
					return result;
				} catch (error) {
					return {
						success: false,
						message: error.message,
					};
				}
			},
		});

		this.register('reject', {
			description: 'Reject the current plan and return to planning mode',
			usage: '/reject',
			handler: (args, context) => {
				const {planningModeManager} = context;

				if (!planningModeManager) {
					return {
						success: false,
						message: 'Planning mode manager not available.',
					};
				}

				try {
					const result = planningModeManager.rejectPlan();
					return result;
				} catch (error) {
					return {
						success: false,
						message: error.message,
					};
				}
			},
		});
	}

	async executeInit(toolExecutor, grokClient, config) {
		try {
			// 1. Execute explore_project tool
			const exploreTool = toolExecutor.tools.get('explore_project');
			if (!exploreTool) {
				throw new Error('explore_project tool not found');
			}

			const projectStructure = await exploreTool.execute({max_depth: 5});

			// 2. Find and read README files
			const readTool = toolExecutor.tools.get('read_file');
			const listTool = toolExecutor.tools.get('list_files');

			let readmeContent = '';
			if (listTool && readTool) {
				const readmeFiles = await listTool.execute({
					pattern: '**/README.md',
					max_results: 10,
				});

				if (readmeFiles.files && readmeFiles.files.length > 0) {
					// Read the first README (usually at root)
					const mainReadme = readmeFiles.files[0];
					try {
						const readmeData = await readTool.execute({
							file_path: mainReadme.path,
						});
						readmeContent = readmeData.content;
					} catch {
						// README not readable
					}
				}
			}

			// 3. Construct prompt for Grok
			const initPrompt = `I need you to analyze this project and create a comprehensive GROK.md file that will help you understand this codebase in future conversations.

## Project Structure
\`\`\`
${projectStructure.tree}
\`\`\`

Statistics:
- Total Files: ${projectStructure.total_files}
- Total Directories: ${projectStructure.total_directories}
- Root Directory: ${projectStructure.root}

${
	readmeContent
		? `## README.md Content\n\`\`\`\n${readmeContent}\n\`\`\`\n`
		: ''
}

Please create a GROK.md file with the following sections:

1. **Project Overview**: What this project does based on the structure and README
2. **Architecture**: High-level code organization and key directories
3. **Key Files**: Important configuration files, entry points, and their purposes
4. **Development Commands**: Any build, test, or development commands found
5. **Technology Stack**: Identified technologies, frameworks, and tools
6. **Notes for Future Reference**: Any patterns, conventions, or important context

Write the complete GROK.md content that I can save. Start with:

\`\`\`markdown
# GROK.md
\`\`\`

Make it concise but informative. Focus on what would be most helpful when working with this codebase.`;

			// 4. Send to Grok API
			const response = await grokClient.sendMessage(
				initPrompt,
				[], // No tools needed
				{model: config.model, newConversation: true},
			);

			// 5. Parse response
			const {output} = response;
			const assistantMessages = output.filter(
				item => item.type === 'message' && item.role === 'assistant',
			);

			let grokMdContent = '';
			if (assistantMessages.length > 0) {
				const content = assistantMessages[0].content || [];
				const textContent = content.find(c => c.type === 'output_text');
				if (textContent) {
					grokMdContent = textContent.text;
				}
			}

			if (!grokMdContent) {
				throw new Error('No response from Grok');
			}

			// 6. Extract markdown content if wrapped in code blocks
			let finalContent = grokMdContent;
			const markdownMatch = grokMdContent.match(/```markdown\n([\s\S]*?)\n```/);
			if (markdownMatch) {
				finalContent = markdownMatch[1];
			}

			// 7. Write GROK.md file
			const writeTool = toolExecutor.tools.get('write_file');
			if (!writeTool) {
				throw new Error('write_file tool not found');
			}

			const grokMdPath = 'GROK.md';
			await writeTool.execute({
				file_path: grokMdPath,
				content: finalContent,
			});

			return {
				success: true,
				message: `✅ Project initialized successfully!\n\nGROK.md has been created with project context.\nFiles analyzed: ${projectStructure.total_files}\nDirectories: ${projectStructure.total_directories}\n\nYou can now reference this file in future conversations.`,
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to initialize project: ${error.message}`,
			};
		}
	}

	register(name, command) {
		this.commands.set(name, command);
	}

	isCommand(input) {
		return input.trim().startsWith('/');
	}

	parse(input) {
		if (!this.isCommand(input)) {
			return null;
		}

		const trimmed = input.trim().slice(1); // Remove '/'
		const parts = trimmed.split(/\s+/);
		const commandName = parts[0].toLowerCase();
		const args = parts.slice(1);

		return {commandName, args};
	}

	execute(input, context = {}) {
		const parsed = this.parse(input);

		if (!parsed) {
			return null;
		}

		const {commandName, args} = parsed;
		const command = this.commands.get(commandName);

		if (!command) {
			return {
				success: false,
				message: `Unknown command: /${commandName}\n\nType /help for a list of available commands.`,
			};
		}

		try {
			return command.handler(args, context);
		} catch (error) {
			return {
				success: false,
				message: `Error executing command: ${error.message}`,
			};
		}
	}
}

export default CommandHandler;
