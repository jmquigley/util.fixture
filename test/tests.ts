'use strict';

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import {expandHomeDirectory as home} from 'util.home';
import {failure} from 'util.toolbox';
import * as uuid from 'uuid';
import {Fixture} from '../index';

const normalize = require('normalize-path');

let pkg = require('../package.json');

// These must be set to empty for testing purposes.  The tests control the
// variables for testing.
process.env.TMP = '';
process.env.TEMP = '';

describe(path.basename(__filename), () => {

	after('final cleanup', (done) => {
		Fixture.cleanup((err: Error, directories: string[]) => {
			if (err) {
				done(failure);
			}

			directories.forEach((directory: string) => {
				assert(!fs.existsSync(directory));
			});

			done();
		});
	});

	it('Copy and destroy test fixture 1', () => {
		let fixture = new Fixture('test-fixture-1');

		assert(fixture && typeof fixture === 'object');
		assert(fs.existsSync(fixture.dir));
		assert(fs.existsSync(path.join(fixture.dir, 'test-directory')));
		assert(fs.existsSync(path.join(fixture.dir, 'test-file.txt')));
		assert.equal(fs.readFileSync(path.join(fixture.dir, 'test-file.txt')).toString(), 'Test information\n');
	});

	it('Use TMP variable to set temporary location for base', () => {
		let saveTMP = (process.env.TMP) ? process.env.TMP : '';
		process.env.TMP = home(path.join('~/', '.tmp'));

		let fixture = new Fixture('test-fixture-1');
		assert(fixture && typeof fixture === 'object');
		assert(fs.existsSync(fixture.dir));

		process.env.TMP = saveTMP;
	});

	it('Use TEMP variable to set temporary location for base', () => {
		let saveTEMP = (process.env.TEMP) ? process.env.TEMP : '';
		process.env.TEMP = home(path.join('~/', '.tmp'));

		let fixture = new Fixture('test-fixture-1');
		assert(fixture && typeof fixture === 'object');
		assert(fs.existsSync(fixture.dir));

		process.env.TEMP = saveTEMP;
	});

	it('Load test fixture 2', () => {
		let fixture = new Fixture('test-fixture-2');

		assert(fixture && typeof fixture === 'object');
		assert(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
		assert(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
		assert(fixture.obj.testBool);
		assert.equal(fixture.obj.testData, 'test data');
	});

	it('Load test fixture 3 and perform replacement', () => {
		let fixture = new Fixture('test-fixture-3', {
			jsonFile: 'somefile.json',
			templateData: {
				replaceMe: 'test data'
			}
		});

		assert(fixture && typeof fixture === 'object');
		assert(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
		assert(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
		assert(fixture.obj.testBool);
		assert.equal(fixture.obj.testData, 'test data');
	});

	it('Load test fixture 4 and perform replacement after copy', () => {
		let fixture = new Fixture('test-fixture-4', {
			jsonFile: 'test-directory/somefile.json',
			dataFile: 'test-file.txt',
			templateData: {
				replaceMe: 'test data',
				filename: 'test.txt'
			}
		});

		assert(fixture && typeof fixture === 'object');
		assert(fs.existsSync(fixture.dir));
		assert(fs.existsSync(path.join(fixture.dir, 'test-directory')));
		assert(fs.existsSync(path.join(fixture.dir, 'test-file.txt')));
		assert(fs.existsSync(path.join(fixture.dir, 'test-directory', 'somefile.json')));
		assert(Object.prototype.hasOwnProperty.call(fixture.obj, 'testData'));
		assert(Object.prototype.hasOwnProperty.call(fixture.obj, 'testBool'));
		assert(fixture.data instanceof Array);
		assert.equal(fixture.data.length, 3);
		assert.equal(fixture.data[0], 'Test information');
		assert.equal(fixture.data[1], 'test data');
		assert.equal(fixture.data[2], normalize(path.join(fixture.dir, 'test.txt')));
		assert(fixture.obj.testBool);
		assert.equal(fixture.obj.testData, 'test data');

		let f = fs.readFileSync(path.join(fixture.dir, 'test-file.txt')).toString();
		let s = `Test information\n\ntest data\n\n${fixture.dir}/test.txt\n`;

		assert.equal(f, s);
	});

	it('Change the base directory for testing and clenaup', () => {
		let newbasedir: string = home(path.join('~/', '.tmp', 'unit-test-data', uuid.v4()));
		let fixture = new Fixture('tmpdir', {
			basedir: newbasedir
		});

		assert(fs.existsSync(newbasedir));
		assert(typeof fixture.toString() === 'string');

		fs.removeSync(newbasedir);
	});

	it('Create temporary directory and remove', () => {
		let fixture = new Fixture('tmpdir');

		assert(fixture && typeof fixture === 'object');
		assert(fs.existsSync(fixture.dir));
	});

	it('Create temporary directory using empty constructor', () => {
		let fixture = new Fixture();
		assert(fixture && typeof fixture === 'object');
		assert(fs.existsSync(fixture.dir));
	});

	it('Bad fixture name with COPY (negative test)', () => {
		try {
			let fixture = new Fixture('aalksdjflaksdjflkasdj');
			assert(false, fixture.toString());
		} catch (err) {
			assert(true, err.message);
		}
	});

	it('Bad basedir in tempdir (negative test)', () => {
		try {
			let fixture = new Fixture('test-fixture-1');
			fixture.basedir = 'alskjfalkgjald';
			assert(false, fixture.toString());
		} catch (err) {
			assert(true, err.message);
		}
	});

	it('Create a fixture with no section in package.json', () => {
		delete pkg.fixture;
		let fixture = new Fixture('tmpdir', {
			fixtureDirectory: './lib/test/fixtures'
		});

		assert(fixture && fixture instanceof Fixture);
		assert(fs.existsSync(fixture.dir));
	});

	it('Use a fixture script', () => {
		let fixture = new Fixture('test-fixture-5');
		assert(fixture && fixture instanceof Fixture);
		assert(fs.existsSync(path.join(fixture.dir, 'test.out')));
	});
});
