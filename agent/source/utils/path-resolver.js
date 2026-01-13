import path from 'path';

// Validate that a file path is within the working directory (prevent path traversal)
export function validatePath(filePath, workingDir) {
	const resolved = path.resolve(workingDir, filePath);

	// Ensure path is within working directory
	if (!resolved.startsWith(workingDir)) {
		throw new Error(
			'Path traversal attempt detected. Path must be within working directory.',
		);
	}

	return resolved;
}

// Resolve a relative path to absolute, validating it's within working directory
export function resolvePath(filePath, workingDir) {
	// If already absolute, validate it
	if (path.isAbsolute(filePath)) {
		return validatePath(filePath, workingDir);
	}

	// Resolve relative path
	return validatePath(filePath, workingDir);
}
