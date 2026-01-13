# Grok Coding Agent

A full-featured coding agent CLI application built with Ink (React for terminal) that uses Grok's API. The agent can read and write files, execute bash commands, and assist with coding tasks through an interactive chat interface.

## Features

- **File Operations**: Read and write files with automatic path validation
- **Bash Execution**: Run shell commands safely within your working directory
- **Interactive Chat**: Terminal-based chat interface with real-time status indicators
- **Tool Execution**: Transparent display of agent actions and tool usage
- **Function Calling**: Uses Grok's function calling API for structured tool execution

## Install

```bash
cd agent
npm install
npm run build
```

## Configuration

The agent requires a Grok API token and supports various configuration options. Configuration can be provided through CLI flags, environment variables, or a config file.

### Configuration Priority

Settings are loaded in the following order (later sources override earlier ones):

1. **Config file** (`~/.config/agent/config.json`)
2. **Environment variables** (`GROK_API_TOKEN`, `GROK_MODEL`)
3. **CLI flags** (`--token`, `--model`, `--dir`)

### Available Options

| Option | CLI Flag | Environment Variable | Config File Key | Default | Description |
|--------|----------|---------------------|-----------------|---------|-------------|
| API Token | `--token`, `-t` | `GROK_API_TOKEN` | `apiToken` | **(required)** | Your Grok API token from x.ai |
| Model | `--model`, `-m` | `GROK_MODEL` | `model` | `grok-beta` | The Grok model to use |
| Working Directory | `--dir`, `-d` | - | `workingDir` | Current directory | Project directory for file operations |
| Config File Path | `--config`, `-c` | - | - | `~/.config/agent/config.json` | Custom config file location |
| Input Token Pricing | - | - | `pricing.inputCostPer1M` | `5.0` | Cost in USD per 1M input tokens |
| Output Token Pricing | - | - | `pricing.outputCostPer1M` | `15.0` | Cost in USD per 1M output tokens |

### Configuration Methods

#### 1. CLI Flags

```bash
# Basic usage with token
$ node dist/cli.js --token=xai-your-token-here

# All options
$ node dist/cli.js \
  --token=xai-your-token-here \
  --model=grok-beta \
  --dir=/path/to/project

# Short flags
$ node dist/cli.js -t xai-xxx -m grok-beta -d ~/myproject

# Custom config file
$ node dist/cli.js --config=/path/to/custom-config.json
```

#### 2. Environment Variables

```bash
# Set environment variables
$ export GROK_API_TOKEN=xai-your-token-here
$ export GROK_MODEL=grok-beta

# Run the agent
$ node dist/cli.js

# Or inline
$ GROK_API_TOKEN=xai-xxx node dist/cli.js
```

#### 3. Config File

Create `~/.config/agent/config.json`:

```json
{
  "apiToken": "xai-your-token-here",
  "model": "grok-beta",
  "workingDir": "/path/to/your/project",
  "pricing": {
    "inputCostPer1M": 5.0,
    "outputCostPer1M": 15.0
  }
}
```

The config file is automatically created when you first run the agent. You can edit it manually or use a custom location with the `--config` flag.

**Pricing Configuration:**

The `pricing` object is used to calculate costs based on token usage. Values are in USD per 1 million tokens:
- `inputCostPer1M`: Cost per 1M input tokens (default: $5.00)
- `outputCostPer1M`: Cost per 1M output tokens (default: $15.00)

These defaults are examples and should be updated to match the actual Grok API pricing from x.ai. The agent tracks token usage and displays estimated costs during your session.

### Getting Your API Token

1. Visit [x.ai](https://x.ai) and sign up for an account
2. Navigate to the API section in your account settings
3. Generate a new API token
4. The token will start with `xai-`

### Configuration Examples

**Development workflow:**
```bash
# Store token in config file once
$ node dist/cli.js --token=xai-xxx
# Token is saved, just run normally
$ node dist/cli.js
```

**Multiple projects:**
```bash
# Project A
$ node dist/cli.js --dir=/home/user/project-a

# Project B
$ node dist/cli.js --dir=/home/user/project-b
```

**CI/CD environment:**
```bash
# Use environment variables in automated environments
$ export GROK_API_TOKEN=$SECRET_GROK_TOKEN
$ node dist/cli.js --dir=/workspace
```

**Testing different models:**
```bash
$ node dist/cli.js --model=grok-beta
$ node dist/cli.js --model=grok-2  # when available
```

### Token Usage and Cost Tracking

The agent automatically tracks token usage and calculates costs based on your pricing configuration. During your session, you'll see a real-time display showing:

- **Input tokens**: Tokens sent to the API (prompts, context, tool results)
- **Output tokens**: Tokens received from the API (responses)
- **Total tokens**: Combined input and output
- **Estimated cost**: Calculated using your pricing configuration
- **Number of API requests**: Total requests made to Grok API

**Example display:**
```
┌─────────────────────────────────────────────────────────────┐
│ Tokens: 12.5k in / 3.2k out | Total: 15.7k | Cost: $0.1105 | Requests: 5 │
└─────────────────────────────────────────────────────────────┘
```

To update pricing to match current Grok API rates, edit your config file (`~/.config/agent/config.json`) and update the `pricing` values. Check [x.ai pricing](https://x.ai) for the latest rates.

## Usage

```bash
$ node dist/cli.js --help

Usage
  $ agent [options]

Options
  --token, -t      Grok API token
  --model, -m      Model to use (default: grok-beta)
  --dir, -d        Working directory (default: current directory)
  --config, -c     Path to config file

Examples
  $ node dist/cli.js --token=xai-xxx
  $ node dist/cli.js --dir=/path/to/project
  $ GROK_API_TOKEN=xai-xxx node dist/cli.js
```

## Available Tools

The agent has access to the following tools:

### Project Navigation

- **explore_project**: Get a visual file tree of the project structure, respecting .gitignore patterns. Great for understanding project layout.

### File Operations

- **read_file**: Read the contents of a file
- **write_file**: Create or overwrite a file with new content
- **edit_file**: Edit a file by searching for text and replacing it (search/replace)

### File Discovery

- **list_files**: List files matching glob patterns (e.g., `*.js`, `src/**/*.ts`)
- **search_files**: Search for text or regex patterns in files (grep-style search)

### System

- **bash_execute**: Execute bash commands in the working directory

### Web (Placeholder)

- **web_search**: Web search capability (requires API configuration)

## Slash Commands

The agent supports several built-in commands that you can use by typing `/` followed by the command name:

| Command              | Description                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/init`              | **Initialize project context** - Explores project structure, reads README files, and creates GROK.md with AI-generated project documentation |
| `/help`              | Show all available commands                                                                                                                  |
| `/help <command>`    | Get help for a specific command                                                                                                              |
| `/tools`             | List all available tools                                                                                                                     |
| `/stats`             | Show session statistics (messages, file changes, etc.)                                                                                       |
| `/clear` or `/reset` | Clear conversation history                                                                                                                   |
| `/exit`              | Exit the application                                                                                                                         |

### Special Command: `/init`

The `/init` command is particularly useful when starting work on a new project. It:

1. Explores the entire project structure (respecting .gitignore)
2. Reads README.md files
3. Sends this information to Grok
4. Creates a **GROK.md** file with AI-generated project documentation

This gives the AI persistent context about your project that it can reference in future conversations.

```
> /init
System: Initializing project context...

System: ✅ Project initialized successfully!

GROK.md has been created with project context.
Files analyzed: 42
Directories: 8

You can now reference this file in future conversations.
```

### Other Commands

```
> /help
System: Available commands:
  /init - Initialize project context by exploring structure and creating GROK.md
  /help - Show available commands
  /clear - Clear conversation history
  /exit - Exit the application
  /tools - List all available tools
  /stats - Show session statistics
  /reset - Reset conversation (alias for /clear)

> /tools
System: Available tools (8):
  read_file - Read the contents of a file from the filesystem
  explore_project - Get a visual file tree of the project structure
  write_file - Write content to a file, creating it if it doesn't exist...
  ...

> /stats
System: Session Statistics
Model: grok-beta
Working Directory: /home/user/project
Total Messages: 12
User Messages: 6
Assistant Messages: 5
Tool Executions: 3

File Changes
Files Modified: 2
Created: 1
Modified: 1
```

## Example Sessions

### Exploring a Project

```
> Show me the structure of this project

Agent: I'll explore the project structure for you.
→ Executing: explore_project

Agent: Here's the project structure:
📁 src/
│   ├── 📁 components/
│   │   ├── 📄 App.js
│   │   └── 📄 Header.js
│   ├── 📁 utils/
│   │   └── 📄 helpers.js
│   └── 📄 index.js
📁 tests/
│   └── 📄 app.test.js
📄 package.json
📄 README.md

Total: 7 files, 3 directories
```

### File Operations

```
> Read the package.json file

Agent: I'll read the package.json file for you.
→ Executing: read_file

Agent: The package.json file contains your project configuration...

> Create a new file called hello.js with a simple console.log

Agent: I'll create that file for you.
→ Executing: write_file

Agent: I've created hello.js with the console.log statement.
```

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Run tests
npm run test
```

## Architecture

- **Ink UI**: React components for terminal interface
- **Grok API Client**: HTTP client with retry logic and error handling
- **Tool System**: Pluggable tool architecture with base class
- **Agent Loop**: Multi-turn conversation with function calling support
- **File Tracking**: Tracks all file modifications during session

## Security

- Path traversal protection: All file paths are validated to stay within working directory
- Command timeout: Bash commands have a 30-second timeout
- Safe error handling: Errors are caught and displayed without crashing the app
