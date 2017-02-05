'use strict';

const path = require('path');
const fs = require('fs-extra');
const uuidV4 = require('uuid/v4');
const home = require('expand-home-dir');
const objectAssign = require('object-assign');
const format = require('string-template');
const walk = require('klaw-sync');
const getFileList = require('util.filelist');


let currentBaseDir = home(path.join('~/', '.tmp', 'unit-test-data'));

/**
 * A set of base directories that have been created by fixtures.  This is used
 * by the cleanup procedure at the end of all testing.
 * @type {Set}
 */
let tempDirectories = new Set();


/** Creates an instance of a fixture */
class Fixture {

	/**
	 * Creates an instance of a fixture object for use in a unit test.  By
	 * default it looks lin ./test/fixtures.
	 * @param name {string} the name of the fixture to load
	 * @param [opts] {object} optional arguments (see README for details)
	 * @constructor
	 */
	constructor(name, opts = null) {
		opts = objectAssign({
			basedir: currentBaseDir,
			dataFile: 'data.list',
			fixtureDirectory: './test/fixtures',
			jsonFile: 'obj.json',
			templateData: {
				DIR: ''
			}
		}, opts);

		this.opts = opts;
		this.basedir = currentBaseDir = opts.basedir;
		this.dir = '';
		this.files = [];
		this.obj = {};
		this.data = [];
		this.src = '';

		if (!fs.existsSync(this.basedir)) {
			fs.mkdirs(this.basedir);
			tempDirectories.add(this.basedir);
		}

		this.dir = home(path.join(this.basedir, uuidV4()));
		if (!fs.existsSync(this.dir)) {
			fs.mkdirsSync(this.dir);
		}

		if (name === 'tmpdir') {
			return this;
		}

		this.src = path.resolve(path.join(opts.fixtureDirectory, name));
		if (!fs.existsSync(this.src)) {
			throw new Error(`Invalid fixture name given: ${name}`);
		}

		fs.copySync(this.src, this.dir);
		opts.templateData.DIR = path.join(this.dir, path.sep);

		// get the list of all files in the destination and scan them all for
		// replacement values.
		this.files = walk(this.dir, {nodir: true});
		this.files.forEach(function (file) {
			let inp = fs.readFileSync(file.path);
			inp = format(inp.toString(), opts.templateData);
			fs.writeFileSync(file.path, inp);

			if (file.path === path.join(this.dir, opts.jsonFile)) {
				this.obj = JSON.parse(inp);
			}

			if (file.path === path.join(this.dir, opts.dataFile)) {
				this.data = getFileList(file.path);
			}
		}, this);
	}

	/**
	 * Returns a string representation of the internal object structure of
	 * the Fixture.
	 * @returns {string} the string representing the object.
	 */
	toString() {
		let obj = {
			opts: this.opts,
			basedir: this.basedir,
			dir: this.dir,
			files: this.files,
			obj: this.obj,
			data: this.data,
			src: this.src
		};

		return JSON.stringify(obj, null, 2);
	}

	/**
	 * Removes the directory associated with this fixture.  This only needs to
	 * be called one time at the end of all testing.
	 * @return {Array} the list of directories that were removed.
	 */
	static cleanup() {
		tempDirectories.forEach(directory => {
			if (fs.existsSync(directory)) {
				fs.removeSync(directory);
			}
		});

		return Array.from(tempDirectories);
	}
}

module.exports = Fixture;
