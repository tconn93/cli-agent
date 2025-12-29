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

The agent requires a Grok API token. You can provide it in three ways (in order of priority):

### 1. CLI Flag
```bash
$ node dist/cli.js --token=xai-your-token-here
```

### 2. Environment Variable
```bash
$ export GROK_API_TOKEN=xai-your-token-here
$ node dist/cli.js
```

### 3. Config File
Create `~/.config/agent/config.json`:
```json
{
  "apiToken": "xai-your-token-here",
  "model": "grok-beta",
  "workingDir": "/path/to/your/project"
}
```

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

## Example Session

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
