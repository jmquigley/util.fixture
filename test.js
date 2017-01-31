'use strict';

const path = require('path');
const fs = require('fs-extra');
const test = require('ava');
const uuidV4 = require('uuid/v4');
const home = require('expand-home-dir');
const fixture = require('./index');

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
	let id = fixture.copy('test-fixture-1');

	t.true(id && typeof id === 'string');
	t.true(fs.existsSync(id));
	t.true(fs.existsSync(path.join(id, 'test-directory')));
	t.true(fs.existsSync(path.join(id, 'test-file.txt')));
	t.is(fs.readFileSync(path.join(id, 'test-file.txt')).toString(), 'Test information\n');

	fixture.destroy(id);

	t.false(fs.existsSync(id));
});


test('Load test fixture 2', t => {
	let obj = fixture.load('test-fixture-2');

	t.true(obj && typeof obj === 'object');
	t.true(Object.prototype.hasOwnProperty.call(obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(obj, 'testBool'));
	t.true(obj.testBool);
	t.is(obj.testData, 'test data');

	obj = null;
});


test('Load test fixture 3 and perform replacement', t => {
	let obj = fixture.load('test-fixture-3', {
		dataFile: 'somefile.txt',
		templateData: {
			replaceMe: 'test data'
		}
	});

	t.true(obj && typeof obj === 'object');
	t.true(Object.prototype.hasOwnProperty.call(obj, 'testData'));
	t.true(Object.prototype.hasOwnProperty.call(obj, 'testBool'));
	t.true(obj.testBool);
	t.is(obj.testData, 'test data');

	obj = null;
});


test('Load test fixture 4 and perform replacement after copy', t => {
	let id = fixture.copy('test-fixture-4', {
		templateData: {
			replaceMe: 'test data',
			filename: 'test.txt'
		}
	});

	t.true(id && typeof id === 'string');
	t.true(fs.existsSync(id));
	t.true(fs.existsSync(path.join(id, 'test-directory')));
	t.true(fs.existsSync(path.join(id, 'test-file.txt')));

	let f = fs.readFileSync(path.join(id, 'test-file.txt')).toString();
	let s = `Test information\n\ntest data\n\n${id}/test.txt\n`;

	t.is(f, s);

	fixture.destroy(id);

	t.false(fs.existsSync(id));
});


test('Create temporary directory and remove', t => {
	let tmpdir = fixture.tmpdir();

	t.true(tmpdir && typeof tmpdir === 'string');
	t.true(fs.existsSync(tmpdir));

	fixture.destroy(tmpdir);

	t.false(fs.existsSync(tmpdir));
});


test('Bad fixture name with COPY (negative test)', t => {
	try {
		let obj = fixture.copy('aalksdjflaksdjflkasdj');
		console.log(obj);
	} catch (err) {
		t.pass(err.message);
	}
});


test('Bad fixture name with LOAD (negative test)', t => {
	try {
		let obj = fixture.load('asdfasdfasdgasdfad97asdg');
		console.log(obj);
	} catch (err) {
		t.pass(err.message);
	}
});


test('Bad id given to DESTROY (negative test)', t => {
	try {
		let obj = fixture.destroy('asdfasdfasdgasdfad97asdg');
		console.log(obj);
	} catch (err) {
		t.pass(err.message);
	}
});
