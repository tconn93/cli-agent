import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';

function ThinkingIndicator({status}) {
	const messages = {
		calling_api: 'Calling Grok API...',
		executing_tools: 'Executing tools...',
	};

	const message = messages[status];

	if (!message) {
		return null;
	}

	return (
		<Box>
			<Text color="gray">
				<Spinner type="dots" /> {message}
			</Text>
		</Box>
	);
}

export default ThinkingIndicator;
