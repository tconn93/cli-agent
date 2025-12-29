import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';

function InputBox({onSubmit, disabled}) {
	const [value, setValue] = useState('');

	const handleSubmit = () => {
		if (value.trim()) {
			onSubmit(value);
			setValue('');
		}
	};

	return (
		<Box>
			<Text bold color="cyan">
				{disabled ? '[Thinking...] ' : '> '}
			</Text>
			<TextInput
				value={value}
				onChange={setValue}
				onSubmit={handleSubmit}
				placeholder={disabled ? '' : 'Type your message...'}
				showCursor={!disabled}
			/>
		</Box>
	);
}

export default InputBox;
