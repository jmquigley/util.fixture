'use strict';

import test from 'ava';
import * as fs from 'fs-extra';
import {join} from 'util.join';
import * as uuid from 'uuid';
import {Fixture} from '../index';

let pkg = require('../package.json');

// These must be set to empty for testing purposes.  The tests control the
// variables for testing.
process.env.TMP = '';
process.env.TEMP = '';

test.after.always.cb(t => {
	Fixture.cleanup((err: Error, directories: string[]) => {
		if (err) {
			t.fail(err.message);
		}

		directories.forEach((directory: string) => {
			t.false(fs.existsSync(directory));
		});

		t.end();
	});
});

test('Copy and destroy test fixture 1', t => {
	let fixture = new Fixture('test-fixture-1');

	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));
	t.true(fs.existsSync(join(fixture.dir, 'test-directory')));
	t.true(fs.existsSync(join(fixture.dir, 'test-file.txt')));
	t.is(fs.readFileSync(join(fixture.dir, 'test-file.txt')).toString(), 'Test information\n');
});

test('Use TMP variable to set temporary location for base', t => {
	let saveTMP = (process.env.TMP) ? process.env.TMP : '';
	process.env.TMP = join('~/', '.tmp');

	let fixture = new Fixture('test-fixture-1');
	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));

	process.env.TMP = saveTMP;
});

test('Use TEMP variable to set temporary location for base', t => {
	let saveTEMP = (process.env.TEMP) ? process.env.TEMP : '';
	process.env.TEMP = join('~/', '.tmp');

	let fixture = new Fixture('test-fixture-1');
	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));

	process.env.TEMP = saveTEMP;
});

test('Load test fixture 2', t => {
	let fixture = new Fixture('test-fixture-2');

	t.truthy(fixture);
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');
});

test('Load test fixture 3 and perform replacement', t => {
	let fixture = new Fixture('test-fixture-3', {
		jsonFile: 'somefile.json',
		templateData: {
			replaceMe: 'test data'
		}
	});

	t.truthy(fixture);
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');
});

test('Load test fixture 4 and perform replacement after copy', t => {
	let fixture = new Fixture('test-fixture-4', {
		jsonFile: 'test-directory/somefile.json',
		dataFile: 'test-file.txt',
		templateData: {
			replaceMe: 'test data',
			filename: 'test.txt'
		}
	});

	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));
	t.true(fs.existsSync(join(fixture.dir, 'test-directory')));
	t.true(fs.existsSync(join(fixture.dir, 'test-file.txt')));
	t.true(fs.existsSync(join(fixture.dir, 'test-directory', 'somefile.json')));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.truthy(fixture.data instanceof Array);
	t.is(fixture.data.length, 3);
	t.is(fixture.data[0], 'Test information');
	t.is(fixture.data[1], 'test data');
	t.is(fixture.data[2], join(fixture.dir, 'test.txt'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');

	let f = fs.readFileSync(join(fixture.dir, 'test-file.txt')).toString();
	let s = `Test information\n\ntest data\n\n${fixture.dir}/test.txt\n`;

	t.is(f, s);
});

test('Change the base directory for testing and clenaup', t => {
	let newbasedir: string = join('~/', '.tmp', 'unit-test-data', uuid.v4());
	let fixture = new Fixture('tmpdir', {
		basedir: newbasedir
	});
	fixture.basedir = newbasedir;

	t.truthy(fixture);
	t.true(fs.existsSync(newbasedir));
	t.is(typeof fixture.toString(), 'string');

	fs.removeSync(newbasedir);
});

test('Create temporary directory and remove', t => {
	let fixture = new Fixture('tmpdir');

	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));
});

test('Create temporary directory using empty constructor', t => {
	let fixture = new Fixture();
	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));
});

test('Bad fixture name with COPY (negative test)', t => {
	try {
		let fixture = new Fixture('aalksdjflaksdjflkasdj');
		t.fail(fixture.toString());
	} catch (err) {
		t.pass(err.message);
	}
});

test('Create a fixture with no section in package.json', t => {
	delete pkg.fixture;
	let fixture = new Fixture('tmpdir', {
		fixtureDirectory: './lib/test/fixtures'
	});

	t.truthy(fixture);
	t.true(fs.existsSync(fixture.dir));
});

test('Use a fixture script', t => {
	let fixture = new Fixture('test-fixture-5');
	t.truthy(fixture);
	t.true(fs.existsSync(join(fixture.dir, 'test.out')));
});
