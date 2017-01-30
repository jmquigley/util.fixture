'use strict';

const path = require('path');
const fs = require('fs-extra');
const uuidV4 = require('uuid/v4');
const home = require('expand-home-dir');
const objectAssign = require('object-assign');

let unitTestBaseDir = null;

/**
 * Looks in the `./test/fixtures/{name}` directory and copies it to a
 * temporary directory for this test.  The location of the directory is
 * returned by this call (referred to as the id).  The return from this copy
 * operation is later sent to the `destroy` call to remove the temporary
 * fixture.  The id value can be used to reference the items as an absolute
 * path to the items in the fixture.

 * @param name {string} the name of the fixture to copy
 * @param opts {object} optional arguments
 *
 *     - tempDirectory: the base location where the fixtures will copy the data
 *     for the test
 *     - fixtureDirectory: the base location where fixtures can be fond with
 *     the name parameter.
 * @returns {string} the path where the fixture was copied.  This becomes the
 * id value that is passed to destroy.
 */
function copy(name, opts = undefined) {
	opts = objectAssign({
		tempDirectory: home(path.join('~/', '.tmp', 'unit-test-data')),
		fixtureDirectory: './test/fixtures'
	}, opts);

	unitTestBaseDir = opts.tempDirectory;

	let src = path.resolve(path.join(opts.fixtureDirectory, name));
	if (!fs.existsSync(src)) {
		throw new Error(`Invalid fixture name given: ${name}`);
	}

	let dst = home(path.join(unitTestBaseDir, uuidV4()));
	if (!fs.existsSync(dst)) {
		fs.mkdirsSync(dst);
	}

	fs.copySync(src, dst);
	return dst;
}


/**
 * Looks in the `./test/fixtures/{name}` for `obj.json` file.  It reads this
 * file and returns a new reference to this object.  This type doesn't require
 * a destroy operation.
 *
 * @param name {string} the name of the fixture to copy
 * @param opts
 */
function load(name, opts = undefined) {
	opts = objectAssign({
		dataFile: 'obj.json',
		fixtureDirectory: './test/fixtures'
	}, opts);

	let src = path.resolve(path.join(opts.fixtureDirectory, name));
	if (!fs.existsSync(src)) {
		throw new Error(`Invalid fixture name given: ${name}`);
	}

	return JSON.parse(fs.readFileSync(path.join(src, opts.dataFile)));
}


/**
 * Removes a fixture that was created by the copy operation.  This will check
 * to ensure that the base path matches the id.  If that does not match, then
 * an exception will be thrown.
 *
 * @param id {string} the path that should be removed.  It must reside within
 * the unit test base directory.
 */
function destroy(id) {
	if (unitTestBaseDir !== null) {
		if (!id.startsWith(unitTestBaseDir)) {
			throw new Error(`Given ID is NOT within the unit test location: ${id}`);
		}

		fs.removeSync(id);
	}
}


module.exports = {
	copy: copy,
	load: load,
	destroy: destroy
};
