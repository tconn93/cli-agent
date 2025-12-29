class FileTracker {
	constructor() {
		this.changes = new Map();
	}

	recordChange(filePath, type, content = null) {
		if (!this.changes.has(filePath)) {
			this.changes.set(filePath, {
				path: filePath,
				type, // 'created', 'modified', 'deleted'
				timestamp: new Date(),
				content,
			});
		} else {
			const existing = this.changes.get(filePath);
			this.changes.set(filePath, {
				...existing,
				type: existing.type === 'created' ? 'created' : 'modified',
				timestamp: new Date(),
			});
		}
	}

	getChanges() {
		return Array.from(this.changes.values());
	}

	exportSummary() {
		const changes = this.getChanges();
		return {
			total: this.changes.size,
			created: changes.filter((c) => c.type === 'created').length,
			modified: changes.filter((c) => c.type === 'modified').length,
			deleted: changes.filter((c) => c.type === 'deleted').length,
			files: changes,
		};
	}

	clear() {
		this.changes.clear();
	}
}

export default FileTracker;
