'use strict';

import * as fs from 'fs-extra';
import {join} from 'util.join';
import * as uuid from 'uuid';
import {Fixture} from '../index';

const pkg = require('../package.json');

// These must be set to empty for testing purposes.  The tests control the
// variables for testing.
process.env.TMP = '';
process.env.TEMP = '';

afterAll((done) => {
	Fixture.cleanup((err: Error, directories: string[]) => {
		if (err) {
			throw new Error(err.message);
		}

		directories.forEach((directory: string) => {
			expect(fs.existsSync(directory)).toBe(false);
		});

		done();
	});
});

test('Copy and destroy test fixture 1', () => {
	const fixture = new Fixture('test-fixture-1');

	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);
	expect(fs.existsSync(join(fixture.dir, 'test-directory'))).toBe(true);
	expect(fs.existsSync(join(fixture.dir, 'test-file.txt'))).toBe(true);
	expect(fs.readFileSync(join(fixture.dir, 'test-file.txt')).toString()).toBe('Test information\n');
});

test('Use TMP variable to set temporary location for base', () => {
	const saveTMP = (process.env.TMP) ? process.env.TMP : '';
	process.env.TMP = join('~/', '.tmp');

	const fixture = new Fixture('test-fixture-1');
	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);

	process.env.TMP = saveTMP;
});

test('Use TEMP variable to set temporary location for base', () => {
	const saveTEMP = (process.env.TEMP) ? process.env.TEMP : '';
	process.env.TEMP = join('~/', '.tmp');

	const fixture = new Fixture('test-fixture-1');
	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);

	process.env.TEMP = saveTEMP;
});

test('Load test fixture 2', () => {
	const fixture = new Fixture('test-fixture-2');

	expect(fixture).toBeDefined();
	expect(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData')).toBe(true);
	expect(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool')).toBe(true);
	expect(fixture.obj.testBool).toBe(true);
	expect(fixture.obj.testData).toBe('test data');
});

test('Load test fixture 3 and perform replacement', () => {
	const fixture = new Fixture('test-fixture-3', {
		jsonFile: 'somefile.json',
		templateData: {
			replaceMe: 'test data'
		}
	});

	expect(fixture).toBeDefined();
	expect(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData')).toBe(true);
	expect(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool')).toBe(true);
	expect(fixture.obj.testBool).toBe(true);
	expect(fixture.obj.testData).toBe('test data');
});

test('Load test fixture 4 and perform replacement after copy', () => {
	const fixture = new Fixture('test-fixture-4', {
		jsonFile: 'test-directory/somefile.json',
		dataFile: 'test-file.txt',
		templateData: {
			replaceMe: 'test data',
			filename: 'test.txt'
		}
	});

	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);
	expect(fs.existsSync(join(fixture.dir, 'test-directory'))).toBe(true);
	expect(fs.existsSync(join(fixture.dir, 'test-file.txt'))).toBe(true);
	expect(fs.existsSync(join(fixture.dir, 'test-directory', 'somefile.json'))).toBe(true);
	expect(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData')).toBe(true);
	expect(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool')).toBe(true);
	expect(fixture.data instanceof Array).toBe(true);
	expect(fixture.data.length).toBe(3);
	expect(fixture.data[0]).toBe('Test information');
	expect(fixture.data[1]).toBe('test data');
	expect(fixture.data[2]).toBe(join(fixture.dir, 'test.txt'));
	expect(fixture.obj.testBool).toBe(true);
	expect(fixture.obj.testData).toBe('test data');

	const f = fs.readFileSync(join(fixture.dir, 'test-file.txt')).toString();
	const s = `Test information\n\ntest data\n\n${fixture.dir}/test.txt\n`;

	expect(f).toBe(s);
});

test('Change the base directory for testing and clenaup', () => {
	const newbasedir: string = join('~/', '.tmp', 'unit-test-data', uuid.v4());
	const fixture = new Fixture('tmpdir', {
		basedir: newbasedir
	});
	fixture.basedir = newbasedir;

	expect(fixture).toBeDefined();
	expect(fs.existsSync(newbasedir)).toBe(true);
	expect(typeof fixture.toString()).toBe('string');

	fs.removeSync(newbasedir);
});

test('Create temporary directory and remove', () => {
	const fixture = new Fixture('tmpdir');
	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);
});

test('Create temporary directory using empty constructor', () => {
	const fixture = new Fixture();
	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);
});

test('Bad fixture name with COPY (negative test)', () => {
	const pass: any = jest.fn();

	try {
		const fixture = new Fixture('aalksdjflaksdjflkasdj');
		throw new Error(fixture.toString())
	} catch (err) {
		pass();
	}

	expect(pass).toHaveBeenCalled();
});

test('Create a fixture with no section in package.json', () => {
	delete pkg.fixture;
	const fixture = new Fixture('tmpdir', {
		fixtureDirectory: './lib/test/fixtures'
	});

	expect(fixture).toBeDefined();
	expect(fs.existsSync(fixture.dir)).toBe(true);
});

test('Use a fixture script', () => {
	const fixture = new Fixture('test-fixture-5');
	expect(fixture).toBeDefined();
	expect(fs.existsSync(join(fixture.dir, 'test.out'))).toBe(true);
});

test('Read a file within the fixture with read()', () => {
	const fixture = new Fixture('test-fixture-1');
	expect(fixture).toBeDefined();
	expect(fs.existsSync(join(fixture.dir, 'test-file.txt'))).toBe(true);

	const f = fixture.read('test-file.txt');
	const s = `Test information\n`;

	expect(f).toBe(s);
});

test(`Try to use read() on a file that doesn't exist`, () => {
	const fixture = new Fixture('test-fixture-1');
	const filename = uuid.v4();
	expect(fixture).toBeDefined();
	expect(fs.existsSync(join(fixture.dir, filename))).toBe(false);

	try {
		fixture.read(filename);
		throw new Error(`Shouldn't get here`);
	} catch (err) {
		expect(err.message).toBe(`Invalid file in fixture read: ${join(fixture.dir, filename)}`);
	}
});

test('Test creation of loremIpsum data with default options', () => {
	const fixture = new Fixture('loremIpsum');
	expect(fixture).toBeDefined();
	expect(typeof fixture.loremIpsum === 'string').toBe(true);

	// one sentence
	const sentences = fixture.loremIpsum.split('. ');
	expect(sentences.length).toBe(1);

	// between 5 and 15 words
	const words = fixture.loremIpsum.split(' ');
	expect(words.length >= 5 && words.length <= 15).toBe(true);
});

test('Test creation of loremIpsum data with custom options', () => {
	const fixture = new Fixture('loremIpsum', {
		loremIpsum: {
			count: 3,
			sentenceLowerBound: 10,
			sentenceUpperBound: 20
		}
	});
	expect(fixture).toBeDefined();
	expect(typeof fixture.loremIpsum === 'string').toBe(true);

	// three sentences
	const sentences = fixture.loremIpsum.split('. ');
	expect(sentences.length).toBe(3);

	// each sentence between 10 and 20 words
	for (const sentence of sentences) {
		const words = sentence.split(' ');
		expect(words.length >= 10 && words.length <= 20).toBe(true);
	}
});

test('Test creation of a test pattern string', () => {
	const fixture = new Fixture('pattern');

	expect(fixture).toBeDefined();
	expect(fixture.pattern).toBeDefined();
	expect(typeof fixture.pattern).toBe('string');

	// (chevrons * columns * repeat) + newlines
	expect(fixture.pattern.length).toBe((26 * 80 * 1) + 26);
});

test('Test creation of a custom test pattern string', () => {
	const fixture = new Fixture('pattern', {
		pattern: {
			chevrons: ['0', '1', '2'],
			columns: 80,
			repeat: 5
		}
	});

	expect(fixture).toBeDefined();
	expect(fixture.pattern).toBeDefined();
	expect(typeof fixture.pattern).toBe('string');

	// (chevrons * columns * repeat) + newlines
	expect(fixture.pattern.length).toBe((3 * 80 * 5) + 15);
});
