# util.fixture [![Build Status](https://travis-ci.org/jmquigley/util.fixture.svg?branch=master)](https://travis-ci.org/jmquigley/util.fixture) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo) [![NPM](https://img.shields.io/npm/v/util.fixture.svg)](https://www.npmjs.com/package/util.fixture) [![Coverage Status](https://coveralls.io/repos/github/jmquigley/util.fixture/badge.svg?branch=master)](https://coveralls.io/github/jmquigley/util.fixture?branch=master)

> Test fixture library

A testing fixture library to simplify managing the lifecycle of a test.  A testing fixture in this context is set of static artifacts or templates that are copied/loaded into a test, used for that test, and then destroyed when complete.  The library looks for fixtures in `./test/fixtures`.  This directory contains a set of additional directories where each of these sub directories represent a fixture that can be used by name in a test.  e.g.  

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

#### Simple Fixture
Copies the contents of a fixture to a temporary directory:
```
const fixture = require('util.fixture');

let id = fixture.copy('simple-test');

... // your test

fixture.destroy(id);
```
The `id` value returned is the temporary directory location where the fixture resides for this test.  Once the test is complete this fixture should be destroyed.

#### Simple JSON
Loads a JSON file saved in a fixture location for use as an object:
```
const fixture = require('util.fixture');

let obj = fixture.load('simple-json');

... // your test

obj = null;
```
The `obj` is an object with whatever properties were defined in the fixture JSON file.  When the test is complete it can be set to `null`.

#### JSON with Template Replacement
Loads a JSON file saved in a fixture location and replaces text strings within it:
```
const fixture = require('util.fixture');

let obj = fixture.load('some-fixture', {
   	templateData: {
   	    replaceMe: 'test data'
   	}
});

... // your test

obj = null;
```

This would search the given JSON file for all instances of the string `{replaceMe}` and substitute the given value in the template (`test data`).  The example JSON in this case would be:

```
{
	"testData": "{replaceMe}",
	"testBool": true
}
```
resulting in:
```
{
	"testData": "test data",
	"testBool": true
}
```

#### Fixture with Template replacement
Loads a fixture and then searches through all of the files for replacement values.

```
const fixture = require('util.fixture');

let id = fixture.copy('test-fixture-4', {
    templateData: {
        replaceMe: 'test data'
    }
});

... // your test

fixture.destroy(id);
```

An example directory structure for `test-fixture-4` would be:

```
test-directory/
   somefile.txt
test-file.txt
```

The `.copy` process above would copy the fixture to the temporary location, perform a string replacement on each of the files (ignoring directories), and then save them to their temporary versions.  The example text file above named `test-file` would be:

```
Test information

{replaceMe}
```

And after replacement would be:

```
Test information

test data
```

## API
The library contains four methods:

- `.copy`
- `.load`
- `.destroy`
- `.tmpdir`

### copy({name}, opts)
Looks in the `./test/fixtures/{name}` directory and copies it to a temporary directory for this test.  The location of the directory is returned by this call (referred to as the id).  The return from this copy operation is later sent to the `destroy` call to remove the temporary fixture.  The id value can be used to reference the items as an absolute path to the items in the fixture.

###### parameters
- `name {string}`: The name of the fixture to use.
- `opts: {object}`: optional parameters (below)

###### options
- `tempDirectory {string}`: The base location where the fixture will be temporarily located.  The default location is `~/.tmp/unit-test-data`.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.
- `templateData {object}`: a map/object of data values that are used for replacement within each file.  The string-template library is used to perform the replacement.  All files are checked for replacement if this is used.

### load({name}, opts)
Looks in the `./test/fixtures/{name}` for `obj.json` file.  It reads this file and returns a new reference to this object.  This type doesn't require a destroy operation.

###### parameters
- `name {string}`: The name of the fixture to use.
- `opts: {object}`: optional parameters (below)

###### options
- `dataFile {string}`: The name of the JSON file within the fixture location.  By default this value is `obj.json`.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.
- `templateData {object}`: a map/object of data values that are used for replacement within the JSON file.  The string-template library is used to perform the replacement.

### destroy({id})
Takes a location that was returned by the `copy` operation and removes it.

###### parameters
- `id {string}`: The location returned by copy that should be destroyed.

### tmpdir(opts)
Creates a temporary directory within the unit test data directory.  The default base directory is `~/.tmp/unit-test/data`.  This can be changed with an optional parameter.  The directory location is returned by this call.  It must be sent to the `destroy` method when finished (like the copy method).

###### parameters
- `opts: {object}`: optional parameters (below)

###### options:
- `tempDirectory {string}`: The base location where the fixture will be temporarily located.  The default location is `~/.tmp/unit-test-data`.


## Template Data Variables
The following are template variables that automatically added to the variable expansion list (templateData).

- `DIR`: the location where the fixture will be copied.
