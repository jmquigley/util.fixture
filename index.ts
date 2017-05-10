'use strict';

import * as child_process from 'child_process';
import * as events from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as format from 'string-template';
import {popd, pushd} from 'util.chdir';
import {getFileList} from 'util.filelist';
import {join, normalize} from 'util.join';
import {encoding, INilCallback, nil} from 'util.toolbox';
import {Semaphore} from 'util.wait';
import * as uuid from 'uuid';

const walk = require('klaw-sync');
const pkg = require(join(process.cwd(), 'package.json'));

/**
 * A set of base directories that have been created by fixtures.  This is used
 * by the cleanup procedure at the end of all testing.
 * @type {Set}
 */
const tempDirectories = new Set();

export interface IFixtureOpts {
	basedir?: string;
	dataFile?: string;
	fixtureDirectory?: string;
	jsonFile?: string;
	script?: string;
	templateData?: {[name: string]: string};
}

export interface IFixtureCallback extends INilCallback {
	(err: Error | null, directories: string[] | any): void | null;
}

/** Creates an instance of a fixture */
export class Fixture extends events.EventEmitter {

	/**
	 * Removes all of the temporary directories that were created by fixtures
	 * in test cases.  Each fixture registers the directory it created when it
	 * was instantiated.  This will iterate through all of those directories and
	 * remove them.  It should be called as the last step in any testing.
	 * @param [cb] {FixtureCallback} a callback function exectued when the cleanup
	 * procedure is complete.  The callback parameters are:
	 *
	 *     - err {Error}: error object if an error has occurred.  Null if no error has
	 *       occurred.
	 *     - directories {string[]}: a list of the directories that were removed.
	 *
	 */
	public static cleanup(cb: IFixtureCallback = nil) {
		const semaphore = new Semaphore(30);

		tempDirectories.forEach((directory: string) => {
			if (fs.existsSync(directory)) {
				semaphore.increment();
				rimraf(directory, (err: Error) => {
					if (err) {
						cb(err, null);
					}
					semaphore.decrement();
				});
			}
		});

		semaphore.wait()
			.then(() => {
				cb(null, Array.from(tempDirectories));
			})
			.catch((err: string) => {
				cb(new Error(err), ['']);
			});
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

		this._opts = Object.assign({
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
		this._dir = join(this.basedir, uuid.v4());

		if (!fs.existsSync(this.dir)) {
			fs.mkdirsSync(this.dir);
		}
		tempDirectories.add(this.dir);

		if (this.name === 'tmpdir') {
			return this;
		}

		this._src = path.resolve(join(this._opts.fixtureDirectory || './test/fixtures', this.name));
		if (!fs.existsSync(this.src)) {
			throw new Error(`Invalid fixture name given: ${name}`);
		}

		fs.copySync(this.src, this.dir);
		this._opts.templateData['DIR'] = join(this.dir);

		// get the list of all files in the destination and scan them all for
		// replacement values.
		this._files = walk(this.dir, {nodir: true});
		this.files.forEach((file: any) => {
			let inp: any = fs.readFileSync(file.path);
			inp = format(inp.toString(), this._opts.templateData);
			fs.writeFileSync(file.path, inp);

			if (file.path === join(this.dir, this._opts.jsonFile || 'obj.json')) {
				this._obj = JSON.parse(inp);
			}

			if (file.path === join(this.dir, this._opts.dataFile || 'data.list')) {
				this._data = getFileList(file.path);
			}
		}, this);

		pushd(this.dir);
		const script: string = join(this.dir, opts.script || 'fixture.js');
		if (fs.existsSync(script)) {
			child_process.execSync(`node ${script}`);
			fs.removeSync(script);
		}
		popd();

		this.emit('loaded');
	}

	/**
	 * Takes a file name within the fixture, and reads the contents of the
	 * file into a buffer and returns it.  This is the name of the relative path
	 * and file within the fixture.
	 * @param filename {string} the name of the file within the fixture to read.
	 * @returns a string representing the contents of the requested file.
	 */
	public read(filename: string): string {
		filename = join(this.dir, filename);
		if (fs.existsSync(filename)) {
			return fs.readFileSync(filename, encoding);
		} else {
			throw new Error(`Invalid file in fixture read: ${filename}`);
		}
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
			base = join('~/', '.tmp');
		}

		return join(base, 'unit-test-data', path.sep);
	}

	/**
	 * Returns a string representation of the internal object structure of
	 * the Fixture.
	 * @returns {string} the string representing the object.
	 */
	public toString() {
		const obj = {
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
		return normalize(this._basedir);
	}

	public set basedir(val) {
		this._basedir = val;
	}

	public get data() {
		return this._data;
	}

	public get dir() {
		return normalize(this._dir);
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
		return normalize(this._src);
	}
}
