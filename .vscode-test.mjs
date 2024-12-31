import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/src/test/**/*.test.js',
	workspaceFolder: "workspaces/with-references",
	mocha: {
		parallel: false
	},
	coverage: {
		include: "src/*.ts",
		reporter: ["html", "json-summary"],
	}
});
