# util.fixture [![Build Status](https://travis-ci.org/jmquigley/util.fixture.svg?branch=master)](https://travis-ci.org/jmquigley/util.fixture) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo) [![NPM](https://img.shields.io/npm/v/util.fixture.svg)](https://www.npmjs.com/package/util.fixture) [![Coverage Status](https://coveralls.io/repos/github/jmquigley/util.fixture/badge.svg?branch=master)](https://coveralls.io/github/jmquigley/util.fixture?branch=master)

> Test fixture library

A testing fixture class to simplify managing the lifecycle of a test.  A testing fixture in this context is set of static artifacts or templates that are copied/loaded into a test, used for that test, and then destroyed when complete.  The class looks for fixtures in `./test/fixtures`.  This directory contains a set of additional directories where each of these sub directories represent a fixture that can be used by name in a test.  e.g.  

    ./test/fixtures/some-test

This would contain a usable fixture named `some-test`.  The name of the fixture is a parameter to the function constructor.  The usage below explains how.

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
Copies the contents of a fixture to a temporary directory.  When a new fixture is created it returns a new object with details about that fixture:
```
const Fixture = require('util.fixture');

let fixture = new Fixture('test-fixture-1');

... // your test

fixture.cleanup();
```
This will expose the fixture location with `fixture.dir`.  That is the temporary location of the files that were copied.  The creation of the fixture always results in template replacement.  In this example there are no custom templates variables; only builtins (see below).  Once the test is complete this fixture should be destroyed with the cleanup method.

#### Simple JSON
Loads a JSON file saved in a fixture location for use as an object:
```
const Fixture = require('util.fixture');

let fixture = new Fixture('simple-json');

... // your test

fixture.cleanup();
```
This will load the fixture like the first example.  However, the fixture object also contains `fixture.obj` which is the JSON file parsed and stored as an object.

#### JSON with Template Replacement
Loads a JSON file saved in a fixture location and replaces text strings within it:
```
const Fixture = require('util.fixture');

let fixture = new Fixture('some-fixture', {
   	templateData: {
   	    replaceMe: 'test data'
   	}
});

... // your test

fixture.cleanup();
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

It will lead to a fixture object returned like the previous two examples.  Also

#### Fixture with Template replacement
Loads a fixture and then searches through all of the files in that fixture for replacement values.

```
const Fixture = require('util.fixture');

let fixture = Fixture('test-fixture-4', {
	jsonFile: 'test-directory/somefile.json',
    dataFile: 'test-file.txt',
    templateData: {
        replaceMe: 'test data'
    }
});

... // your test

fixture.destroy(id);
```

An example directory structure for `test-fixture-4` within the temporary location would be:

```
test-directory/
   somefile.json
test-file.txt
```

The creation of the constructor would copy the fixture to the temporary location, perform a string replacement on each of the files (ignoring directories), save them to their temporary versions, and then parse the `dataFile` parameter into `fixture.data`.  The example text file above named `test-file.txt` would be:

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

### Fixture({name}, opts)

This is a single constructor function exposed by the module.

##### parameters

- `name {string}`: The name of the fixture to use.
- `opts: {object}`: optional parameters (below)

##### options

- `basedir {string}`: The base location where the fixture will be temporarily located. The default location is `~/.tmp/unit-test-data/`.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.  The default is `./test/fixtures`.
- `templateData {object}`: a map of key/value pairs that are used for replacement within each fixture file. The [string-template](https://www.npmjs.com/package/string-template) library is used to perform the replacement. All files are checked.
- `dataFile {string}`: The name of the data list file, within the fixture location, that will be parsed and saved into `fixture.data`. By default this file is `data.list`.  It is parsed by the [util.filelist](https://www.npmjs.com/package/util.filelist) module.  This is a way to get a large list of information into the fixture.
- `jsonFile {string}`: The name of a JSON data file that will be parsed and saved into `fixture.obj`.  By default this file is `obj.json`.

##### attributes
Instantiation of the class returns an object with the following attributes:

- `.basedir` - the root directory for all tests.  This can be changed as an option to the function constructor
- `.cleanup()` - removes the temporary directory and all artifacts copied there.  Generally this would be used at the end of a test.
- `.dir` - the location of the temporary directory created for this fixture.
- `.files` - an array of files that were found within the fixture.
- `.obj` - if the fixture contains `obj.json` or a JSON file named by the `dataFile` option, then it is parsed and the contents of that JSON are stored here.  The JSON file will go through template replacement before it is parsed.
- `.src` - the absolue path directory for the fixture files.

## Template Data Variables
The following are template variables that automatically added to the variable expansion list (templateData).

- `DIR`: the location where the fixture will be copied.
