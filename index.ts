'use strict';

import * as child_process from 'child_process';
import * as events from 'events';
import * as fs from 'fs-extra';
import * as objectAssign from 'object-assign';
import * as path from 'path';
import * as format from 'string-template';
import * as uuid from 'uuid';

const home = require('expand-home-dir');
const walk = require('klaw-sync');
const chdir = require('util.chdir');
const getFileList = require('util.filelist');

const pkg = require(path.join(process.cwd(), 'package.json'));  // eslint-disable-line import/no-dynamic-require

/**
 * A set of base directories that have been created by fixtures.  This is used
 * by the cleanup procedure at the end of all testing.
 * @type {Set}
 */
let tempDirectories = new Set();

export interface IFixtureOpts {
	basedir?: string;
	dataFile?: string;
	fixtureDirectory?: string;
	jsonFile?: string;
	script?: string;
	templateData?: {[name: string]: string};
}

/** Creates an instance of a fixture */
export class Fixture extends events.EventEmitter {

	/**
	 * Removes the directory associated with this fixture.  This only needs to
	 * be called one time at the end of all testing.
	 * @return {Array} the list of directories that were removed.
	 */
	public static cleanup() {
		tempDirectories.forEach((directory: string) => {
			if (fs.existsSync(directory)) {
				fs.removeSync(directory);
			}
		});

		return Array.from(tempDirectories);
	}

	private _opts: IFixtureOpts;
	private _basedir: string = '';
	private _dir: string = '';
	private _files: string[] = [];
	private _obj: any = {};
	private _data: string[] = [];
	private _src: string = '';
	private _name: string = '';

	/**
	 * Creates an instance of a fixture object for use in a unit test.  By
	 * default it looks lin ./test/fixtures.
	 * @param [name] {string} the name of the fixture to load
	 * @param [opts] {object} optional arguments (see README for details)
	 * @constructor
	 */
	constructor(name?: string, opts: IFixtureOpts = {}) {
		super();

		if (!Object.prototype.hasOwnProperty.call(pkg, 'fixture')) {
			pkg.fixture = {};
		}

		this._opts = objectAssign({
			dataFile: 'data.list',
			fixtureDirectory: './test/fixtures',
			jsonFile: 'obj.json',
			script: 'fixture.js',
			templateDataData: {
				DIR: ''
			}
		}, pkg.fixture, opts);

		if (typeof this._opts.templateData === 'undefined') {
			this._opts.templateData = {};
		}

		this._name = name || 'tmpdir';
		this._basedir = opts.basedir || this.setBaseDirectory();

		if (!fs.existsSync(this.basedir)) {
			fs.mkdirs(this.basedir);
		}
		this._dir = home(path.join(this.basedir, uuid.v4(), path.sep));

		if (!fs.existsSync(this.dir)) {
			fs.mkdirsSync(this.dir);
			tempDirectories.add(this.dir);
		}

		if (this.name === 'tmpdir') {
			return this;
		}

		this._src = path.resolve(path.join(this._opts.fixtureDirectory || './test/fixtures', this.name));
		if (!fs.existsSync(this.src)) {
			throw new Error(`Invalid fixture name given: ${name}`);
		}

		fs.copySync(this.src, this.dir);
		this._opts.templateData['DIR'] = path.join(this.dir, path.sep);

		// get the list of all files in the destination and scan them all for
		// replacement values.
		this._files = walk(this.dir, {nodir: true});
		this.files.forEach((file: any) => {
			let inp: any = fs.readFileSync(file.path);
			inp = format(inp.toString(), this._opts.templateData);
			fs.writeFileSync(file.path, inp);

			if (file.path === path.join(this.dir, this._opts.jsonFile || 'obj.json')) {
				this._obj = JSON.parse(inp);
			}

			if (file.path === path.join(this.dir, this._opts.dataFile || 'data.list')) {
				this._data = getFileList(file.path);
			}
		}, this);

		chdir.pushd(this.dir);
		let script: string = path.join(this.dir, opts.script || 'fixture.js');
		if (fs.existsSync(script)) {
			child_process.execSync(`node ${script}`);
			fs.removeSync(script);
		}
		chdir.popd();

		this.emit('loaded');
	}

	/**
	 * Sets the base location for the temporariy files that this Fixture instance
	 * will use.
	 * @returns {string} the path location for the base directory
	 */
	public setBaseDirectory() {
		let base = '';
		if (process.env.TMP) {
			base = process.env.TMP;
		} else if (process.env.TEMP) {
			base = process.env.TEMP;
		} else {
			base = path.join('~/', '.tmp');
		}

		return home(path.join(base, 'unit-test-data', path.sep));
	}

	/**
	 * Returns a string representation of the internal object structure of
	 * the Fixture.
	 * @returns {string} the string representing the object.
	 */
	public toString() {
		let obj = {
			opts: this._opts,
			basedir: this.basedir,
			dir: this.dir,
			files: this.files,
			obj: this.obj,
			data: this.data,
			src: this.src
		};

		return JSON.stringify(obj, null, 2);
	}

	public get basedir() {
		return this._basedir;
	}

	public set basedir(val) {
		this._basedir = val;
	}

	public get data() {
		return this._data;
	}

	public get dir() {
		return this._dir;
	}

	public get files() {
		return this._files;
	}

	public get name() {
		return this._name;
	}

	public get obj() {
		return this._obj;
	}

	public get src() {
		return this._src;
	}
}
