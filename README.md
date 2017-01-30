# util.fixture [![Build Status](https://travis-ci.org/jmquigley/util.fixture.svg?branch=master)](https://travis-ci.org/jmquigley/util.fixture) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo) [![NPM](https://img.shields.io/npm/v/util.fixture.svg)](https://www.npmjs.com/package/util.fixture) [![Coverage Status](https://coveralls.io/repos/github/jmquigley/util.fixture/badge.svg?branch=master)](https://coveralls.io/github/jmquigley/util.fixture?branch=master)

> Test fixture library

A testing fixture library to simplify managing the lifecycle of a test.  A testing fixture in this context is set of static artifacts that are copied/loaded into a test, used for that test, and then destroyed when complete.  The library looks for fixtures in `./test/fixtures`.  This directory contains a set of additional directories.  Each of these represent a fixture that can be used by name in a test.  e.g.  

    ./test/fixtures/some-test
     
This would contain a usable fixture named `some-test`.  The name of the fixture is used by the library to copy/load it.  The usage below explains how.

## Installation

To install as a global package and cli:
```
$ npm install --global util.fixture
```

To install as an application dependency with cli:
```
$ npm install --save-dev util.fixture
```

## Usage

To copy the contents of a fixture use:
```
const fixture = require('util.fixture');

let id = fixture.copy('simple-test');

... // your test

fixture.destroy(id);
```
The `id` value returned is the temporary directory location where the fixture resides for this test.


To load a JSON object saved in a fixture location use:
```
const fixture = require('util.fixture');

let obj = fixture.load('simple-json');

... // your test

obj = null;
``` 
The `obj` is an object with whatever properties were defined in the fixture JSON file.


## API
The library contains three methods:

- `.copy({name})`
- `.load({name})`
- `.destroy({id})`

### copy({name}, opts)
Looks in the `./test/fixtures/{name}` directory and copies it to a temporary directory for this test.  The location of the directory is returned by this call (referred to as the id).  The return from this copy operation is later sent to the `destroy` call to remove the temporary fixture.  The id value can be used to reference the items as an absolute path to the items in the fixture.

##### parameters
- `name {string}`: The name of the fixture to use.

##### options
- `tempDirectory {string}`: The base location where the fixture will be temporarily located.  The default location is `~/.tmp/unit-test-data`.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.

### load({name}, opts)
Looks in the `./test/fixtures/{name}` for `obj.json` file.  It reads this file and returns a new reference to this object.  This type doesn't require a destroy operation.

##### parameters
- `name {string}`: The name of the fixture to use.

##### options
- `dataFile {string}`: The name of the JSON file within the fixture location.  By default this value is `obj.json`.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.

### destroy({id})
Takes a location that was returned by the `copy` operation and removes it.  The location is the `id` parameter returned by `copy`.
