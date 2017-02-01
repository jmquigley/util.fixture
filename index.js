'use strict';

const path = require('path');
const fs = require('fs-extra');
const uuidV4 = require('uuid/v4');
const home = require('expand-home-dir');
const objectAssign = require('object-assign');
const format = require('string-template');
const walk = require('klaw-sync');
const getFileList = require('util.filelist');


function Fixture (name, opts = null) {
	if (!(this instanceof Fixture)) {
		return new Fixture(name, opts);
	}

	opts = objectAssign({
		basedir: home(path.join('~/', '.tmp', 'unit-test-data')),
		dataFile: 'data.list',
		fixtureDirectory: './test/fixtures',
		jsonFile: 'obj.json',
		templateData: {
			DIR: ''
		}
	}, opts);

	let fixture = {
		basedir: opts.basedir,
		dir: '',
		files: [],
		obj: {},
		data: [],
		src: '',
		cleanup: function () {
			if (this.dir !== '') {
				if (!this.dir.startsWith(this.basedir)) {
					throw new Error(`Given ID is NOT within the unit test location: ${this.basedir}`);
				}

				fs.removeSync(this.dir);
			}
		}
	};

	if (!fs.existsSync(opts.basedir)) {
		fs.mkdirs(opts.basedir);
	}

	fixture.dir = home(path.join(opts.basedir, uuidV4()));
	if (!fs.existsSync(fixture.dir)) {
		fs.mkdirsSync(fixture.dir);
	}

	if (name === 'tmpdir') {
		return fixture;
	}

	fixture.src = path.resolve(path.join(opts.fixtureDirectory, name));
	if (!fs.existsSync(fixture.src)) {
		throw new Error(`Invalid fixture name given: ${name}`);
	}

	fs.copySync(fixture.src, fixture.dir);
	opts.templateData.DIR = path.join(fixture.dir, path.sep);

	// get the list of all files in the destination and scan them all for
	// replacement values.
	fixture.files = walk(fixture.dir, {nodir: true});
	fixture.files.forEach(function (file) {
		let inp = fs.readFileSync(file.path);
		inp = format(inp.toString(), opts.templateData);
		fs.writeFileSync(file.path, inp);

		if (file.path === path.join(fixture.dir, opts.jsonFile)) {
			fixture.obj = JSON.parse(inp);
		}

		if (file.path === path.join(fixture.dir, opts.dataFile)) {
			fixture.data = getFileList(file.path);
		}
	});

	return fixture;
}

module.exports = Fixture;
