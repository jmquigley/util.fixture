module.exports = {
	bail: true,
	collectCoverage: true,
	coveragePathIgnorePatterns: [
		"<rootDir>/__tests__/helpers",
		"<rootDir>/__tests__/fixtures",
		"<rootDir>/node_modules"
	],
	moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
	notify: false,
	testPathIgnorePatterns: [
		"<rootDir>/__tests__/helpers",
		"<rootDir>/__tests__/fixtures",
		"<rootDir>/node_modules"
	],
	verbose: true
};
