'use strict';

const test = require('ava');
const uuid = require('uuid');
const path = require('path');
const home = require('expand-home-dir');
const fs = require('fs-extra');
const Fixture = require('../index').Fixture;

let pkg = require('../package.json');

// These must be set to empty for testing purposes.  The tests control the
// variables for testing.
process.env.TMP = '';
process.env.TEMP = '';

test.cb.after.always('final cleanup', (t: any) => {
	let directories: string[] = Fixture.cleanup();
	directories.forEach((directory: string) => {
		t.false(fs.existsSync(directory));
	});
	t.end();
});

test.cb('Copy and destroy test fixture 1', (t: any) => {
	let fixture = new Fixture('test-fixture-1');

	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-directory')));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-file.txt')));
	t.is(fs.readFileSync(path.join(fixture.dir, 'test-file.txt')).toString(), 'Test information\n');
	t.end();
});

test.cb('Use TMP variable to set temporary location for base', (t: any) => {
	let saveTMP = (process.env.TMP) ? process.env.TMP : '';
	process.env.TMP = home(path.join('~/', '.tmp'));

	let fixture = new Fixture('test-fixture-1');
	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));

	process.env.TMP = saveTMP;
	t.end();
});

test.cb('Use TEMP variable to set temporary location for base', (t: any) => {
	let saveTEMP = (process.env.TEMP) ? process.env.TEMP : '';
	process.env.TEMP = home(path.join('~/', '.tmp'));

	let fixture = new Fixture('test-fixture-1');
	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));

	process.env.TEMP = saveTEMP;
	t.end();
});

test.cb('Load test fixture 2', (t: any) => {
	let fixture = new Fixture('test-fixture-2');

	t.true(fixture && typeof fixture === 'object');
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');
	t.end();
});

test.cb('Load test fixture 3 and perform replacement', (t: any) => {
	let fixture = new Fixture('test-fixture-3', {
		jsonFile: 'somefile.json',
		templateData: {
			replaceMe: 'test data'
		}
	});

	t.true(fixture && typeof fixture === 'object');
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');
	t.end();
});

test.cb('Load test fixture 4 and perform replacement after copy', (t: any) => {
	let fixture = new Fixture('test-fixture-4', {
		jsonFile: 'test-directory/somefile.json',
		dataFile: 'test-file.txt',
		templateData: {
			replaceMe: 'test data',
			filename: 'test.txt'
		}
	});

	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-directory')));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-file.txt')));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-directory', 'somefile.json')));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.true(fixture.data instanceof Array);
	t.is(fixture.data.length, 3);
	t.is(fixture.data[0], 'Test information');
	t.is(fixture.data[1], 'test data');
	t.is(fixture.data[2], path.join(fixture.dir, 'test.txt'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');

	let f = fs.readFileSync(path.join(fixture.dir, 'test-file.txt')).toString();
	let s = `Test information\n\ntest data\n\n${fixture.dir}test.txt\n`;

	t.is(f, s);
	t.end();
});

test.cb('Change the base directory for testing and clenaup', (t: any) => {
	let newbasedir: string = home(path.join('~/', '.tmp', 'unit-test-data', uuid.v4()));
	let fixture = new Fixture('tmpdir', {
		basedir: newbasedir
	});

	t.true(fs.existsSync(newbasedir));
	t.true(typeof fixture.toString() === 'string');

	fs.removeSync(newbasedir);
	t.end();
});

test.cb('Create temporary directory and remove', (t: any) => {
	let fixture = new Fixture('tmpdir');

	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));
	t.end();
});

test.cb('Create temporary directory using empty constructor', (t: any) => {
	let fixture = new Fixture();
	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));
	t.end();
});

test.cb('Bad fixture name with COPY (negative test)', (t: any) => {
	try {
		let fixture = new Fixture('aalksdjflaksdjflkasdj');
		fixture.toString();
	} catch (err) {
		t.pass(err.message);
	}
	t.end();
});

test.cb('Bad basedir in tempdir (negative test)', (t: any) => {
	try {
		let fixture = new Fixture('test-fixture-1');
		fixture.basedir = 'alskjfalkgjald';
		fixture.toString();
	} catch (err) {
		t.pass(err.message);
	}
	t.end();
});

test.cb('Create a fixture with no section in package.json', (t: any) => {
	delete pkg.fixture;
	let fixture = new Fixture('tmpdir', {
		fixtureDirectory: './lib/test/fixtures'
	});

	t.true(fixture && fixture instanceof Fixture);
	t.true(fs.existsSync(fixture.dir));
	t.end();
});

test.cb('Use a fixture script', (t: any) => {
	let fixture = new Fixture('test-fixture-5');
	t.true(fixture && fixture instanceof Fixture);
	t.true(fs.existsSync(path.join(fixture.dir, 'test.out')));
	t.end();
});
