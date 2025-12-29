# Grok CLI Agent
## Project Overview

This is a Grok-powered coding agent CLI application built with React and Ink. The agent provides an interactive terminal interface for AI-assisted coding, with capabilities similar to Claude Code CLI. It uses Grok's API with function calling to execute file operations, bash commands, and other tools.

## Architecture

### Technology Stack
- **Ink**: React renderer for building CLI interfaces
- **React**: Component-based UI framework (for terminal rendering)
- **Meow**: CLI argument parser
- **Babel**: Transpiler for JSX to JavaScript
- **AVA**: Test runner
- **XO**: Linter (extends xo-react)

### Project Structure
- `agent/source/`: Source code files (JSX/JS)
  - `cli.js`: Entry point with CLI argument parsing and initialization
  - `app.js`: Main React component that renders ChatInterface
  - `hooks/`: Custom React hooks
    - `useAgentLoop.js`: Core agent conversation loop logic
  - `api/`: API integration
    - `grok-client.js`: HTTP client for Grok API with retry logic
  - `tools/`: Tool implementations
    - `base-tool.js`: Abstract base class for all tools
    - `tool-executor.js`: Tool execution engine
    - `read-file-tool.js`, `write-file-tool.js`, `bash-execute-tool.js`: Tool implementations
  - `components/`: Ink UI components
    - `ChatInterface.js`: Main chat container
    - `MessageList.js`: Display conversation messages
    - `InputBox.js`: Text input with ink-text-input
    - `ThinkingIndicator.js`: Loading spinner
    - `StatusBar.js`: Status information display
  - `config/`: Configuration management
    - `config-manager.js`: Load/save API tokens and settings
  - `utils/`: Utility modules
    - `file-tracker.js`: Track file modifications
    - `path-resolver.js`: Validate file paths
- `agent/dist/`: Compiled output from Babel
- `agent/test.js`: AVA test suite

### Build Process
The project uses Babel to transpile React JSX from `source/` to plain JavaScript in `dist/`. The `@babel/preset-react` preset handles JSX transformation.

## Development Commands

### Running the Agent
```bash
cd agent
# With environment variable
export GROK_API_TOKEN=xai-your-token
node dist/cli.js

# With CLI flag
node dist/cli.js --token=xai-your-token

# With custom working directory
node dist/cli.js --dir=/path/to/project
```

### Build
```bash
cd agent
npm run build
```
Transpiles source files from `source/` to `dist/` using Babel.

### Development Mode
```bash
cd agent
npm run dev
```
Watches source files and automatically rebuilds on changes.

### Testing
```bash
cd agent
npm run test
```
Runs the full test suite:
1. Prettier formatting check
2. XO linting
3. AVA tests

To run only AVA tests:
```bash
cd agent
npx ava
```

To run a single test file:
```bash
cd agent
npx ava test.js
```

### Linting
```bash
cd agent
npx xo
```
XO is configured with xo-react preset and Prettier integration.

### Code Formatting
```bash
cd agent
npx prettier --check .
```

To auto-fix formatting:
```bash
cd agent
npx prettier --write .
```

## Core Architecture

### Agent Loop
User Input → API Call → Loop:  
```
    ├─ If tool calls exist:  
    │  ├─ Execute tools  
    │  ├─ Send results to API  
    │  └─ Check response for more tool calls  
    └─ If no tool calls: Exit loop  
```
  How It Works

  1. Iterative Loop: After executing tools and sending results back to Grok, the agent checks if the new response contains more tool calls
  2. Continuous Execution: Keeps calling tools until Grok stops requesting them
  3. Safety Limit: Maximum 10 iterations to prevent infinite loops
  4. Real-time Updates: Each round of tool calls is displayed to the user as it happens


### Tool System
Tools follow a pluggable architecture:
- All tools extend `BaseTool` abstract class
- Tools define their schema in OpenAI-compatible format
- `ToolExecutor` manages tool registration and execution
- Tool results are formatted as JSON and returned to the API

### Configuration Priority
1. CLI flags (`--token`, `--model`, `--dir`)
2. Environment variables (`GROK_API_TOKEN`, `GROK_MODEL`)
3. Config file (`~/.config/agent/config.json`)

## Testing Architecture

Tests use `ink-testing-library` which provides a `render()` function and `lastFrame()` method to capture terminal output. Tests verify the rendered terminal output matches expected strings including ANSI color codes from chalk.

## Configuration

- **Node version**: >=16 required
- **Module system**: ES modules (`"type": "module"`)
- **Linting**: XO with xo-react preset, Prettier enabled, react/prop-types rule disabled
- **Prettier**: Uses @vdemedes/prettier-config
- **AVA**: Configured with import-jsx loader for JSX test files


