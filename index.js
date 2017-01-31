'use strict';

const path = require('path');
const fs = require('fs-extra');
const uuidV4 = require('uuid/v4');
const home = require('expand-home-dir');
const objectAssign = require('object-assign');
const format = require('string-template');
const walk = require('klaw-sync');

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
 *     - templateData: a map of data values that are used for replacement
 *     within the files.  The string-template library is used to perform
 *     the replacement
 *
 * @returns {string} the path where the fixture was copied.  This becomes the
 * id value that is passed to destroy.
 */
function copy(name, opts = undefined) {
	opts = objectAssign({
		tempDirectory: home(path.join('~/', '.tmp', 'unit-test-data')),
		fixtureDirectory: './test/fixtures',
		templateData: {
			DIR: ''
		}
	}, opts);

	let src = path.resolve(path.join(opts.fixtureDirectory, name));
	if (!fs.existsSync(src)) {
		throw new Error(`Invalid fixture name given: ${name}`);
	}

	let dst = tmpdir(opts);
	fs.copySync(src, dst);
	opts.templateData.DIR = path.join(dst, path.sep);

	// get the list of all files in the destination and scan them all for
	// replacement values.
	let files = walk(dst, {nodir: true});
	files.forEach(function (file) {
		let inp = fs.readFileSync(file.path);
		inp = format(inp.toString(), opts.templateData);
		fs.writeFileSync(file.path, inp);
	});

	return dst;
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


/**
 * Looks in the `./test/fixtures/{name}` for `obj.json` file.  It reads this
 * file and returns a new reference to this object.  This type doesn't require
 * a destroy operation.
 *
 * @param name {string} the name of the fixture to copy
 * @param opts optional arguments
 *
 *     - dataFile: the name of the JSON file within this fixture.  The default
 *     is 'obj.json'.
 *     - fixtureDirectory: the base location where fixtures can be fond with
 *     the name parameter.
 *     - templateData: a map of data values that are used for replacement
 *     within the JSON file.  The string-template library is used to perform
 *     the replacement
 *
 * @returns {object} a JSON object represented by dataFile.
 */
function load(name, opts = undefined) {
	opts = objectAssign({
		dataFile: 'obj.json',
		fixtureDirectory: './test/fixtures',
		templateData: {
			TMPDIR: ''
		}
	}, opts);

	let src = path.resolve(path.join(opts.fixtureDirectory, name));
	if (!fs.existsSync(src)) {
		throw new Error(`Invalid fixture name given: ${name}`);
	}

	let inp = fs.readFileSync(path.join(src, opts.dataFile));
	inp = format(inp.toString(), opts.templateData);

	return JSON.parse(inp);
}


/**
 * Creates a temporary directory within the unit test data directory.
 *
 * @param opts {object} optional parameters
 *
 *     - tempDirectory: the base location where the fixtures will copy the data
 *     for the test
 *
 * @returns {string} a directory path that can be used for testing.
 */
function tmpdir(opts) {
	opts = objectAssign({
		tempDirectory: home(path.join('~/', '.tmp', 'unit-test-data'))
	}, opts);

	unitTestBaseDir = opts.tempDirectory;
	let dst = home(path.join(unitTestBaseDir, uuidV4()));
	if (!fs.existsSync(dst)) {
		fs.mkdirsSync(dst);
	}

	return dst;
}


module.exports = {
	copy: copy,
	destroy: destroy,
	load: load,
	tmpdir: tmpdir
};
