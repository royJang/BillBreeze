export default {
	input: 'src/index.js',
	output: [
		{
			file: './dist/index.mjs',
			format: 'esm'
		},
		{
			file: './dist/index.mjs',
			format: 'es'
		}
	],
	'external': [
		'dayjs',
		'lodash',
		'id-validator'
	]
};