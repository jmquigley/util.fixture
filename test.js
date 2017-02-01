'use strict';

const path = require('path');
const fs = require('fs-extra');
const test = require('ava');
const uuidV4 = require('uuid/v4');
const home = require('expand-home-dir');
const Fixture = require('./index');

let unitTestBaseDir = home(path.join('~/', '.tmp', 'unit-test-data'));
let unitTestDir = home(path.join(unitTestBaseDir, uuidV4()));
if (fs.existsSync(unitTestDir)) {
	fs.mkdirsSync(unitTestDir);
}

test.after.always('test cleanup', t => {
	fs.removeSync(unitTestBaseDir);
	t.pass();
});


test('Copy and destroy test fixture 1', t => {
	let fixture = new Fixture('test-fixture-1');

	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-directory')));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-file.txt')));
	t.is(fs.readFileSync(path.join(fixture.dir, 'test-file.txt')).toString(), 'Test information\n');

	fixture.cleanup();

	t.false(fs.existsSync(fixture.dir));
});


test('Copy and destroy test fixture 1 without new', t => {
	let fixture = Fixture('test-fixture-1');  // eslint-disable-line new-cap

	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-directory')));
	t.true(fs.existsSync(path.join(fixture.dir, 'test-file.txt')));
	t.is(fs.readFileSync(path.join(fixture.dir, 'test-file.txt')).toString(), 'Test information\n');

	fixture.cleanup();

	t.false(fs.existsSync(fixture.dir));
});


test('Load test fixture 2', t => {
	let fixture = new Fixture('test-fixture-2');

	t.true(fixture && typeof fixture === 'object');
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
	t.true(fixture.obj.testBool);
	t.is(fixture.obj.testData, 'test data');

	fixture.cleanup();
});


test('Load test fixture 3 and perform replacement', t => {
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

	fixture.cleanup();
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
	let s = `Test information\n\ntest data\n\n${fixture.dir}/test.txt\n`;

	t.is(f, s);

	fixture.cleanup();

	t.false(fs.existsSync(fixture.dir));
});


test('Create temporary directory and remove', t => {
	let fixture = new Fixture('tmpdir');

	t.true(fixture && typeof fixture === 'object');
	t.true(fs.existsSync(fixture.dir));

	fixture.cleanup();

	t.false(fs.existsSync(fixture.dir));
});


test('Bad fixture name with COPY (negative test)', t => {
	try {
		let fixture = new Fixture('aalksdjflaksdjflkasdj');
		fixture.cleanup();
	} catch (err) {
		t.pass(err.message);
	}
});


test('Bad basedir in tempdir (negative test)', t => {
	try {
		let fixture = new Fixture('test-fixture-1');
		fixture.basedir = 'alskjfalkgjald';
		fixture.cleanup();
	} catch (err) {
		t.pass(err.message);
	}
});
