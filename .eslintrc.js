module.exports = {
	extends: 'standard',
	rules: {
		'camelcase': [
			'error',
			{
				'properties': 'never',
				'ignoreDestructuring': true,
			},
		],
		'comma-dangle': [
			'error', {
				'arrays': 'always-multiline',
				'objects': 'always-multiline',
				'imports': 'always-multiline',
				'exports': 'always-multiline',
				'functions': 'ignore',
			}
		],
		'consistent-return': 'error',
		'indent': [
			'error',
			'tab',
			{
				'SwitchCase': 1,
				'MemberExpression': 'off',
			},
		],
		'jsx-quotes': [
			'error',
			'prefer-single',
		],
		'max-len': [
			'error',
			160,
			4,
		],
		'no-else-return': 'error',
		'no-multiple-empty-lines': [
			'error',
			{
				'max': 2,
				'maxEOF': 0,
			},
		],
		'no-tabs': 'off',
		'no-var': 'error',
		'object-curly-spacing': 'off',
		'padded-blocks': 'off',
		'prefer-object-spread': 'error',
		'quote-props': 'off',
		'radix': 'error',
	},
}
