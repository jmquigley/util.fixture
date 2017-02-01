# util.fixture [![Build Status](https://travis-ci.org/jmquigley/util.fixture.svg?branch=master)](https://travis-ci.org/jmquigley/util.fixture) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo) [![NPM](https://img.shields.io/npm/v/util.fixture.svg)](https://www.npmjs.com/package/util.fixture) [![Coverage Status](https://coveralls.io/repos/github/jmquigley/util.fixture/badge.svg?branch=master)](https://coveralls.io/github/jmquigley/util.fixture?branch=master)

> Test fixture library

A testing fixture constructor function to simplify managing testing artifacts.  A testing fixture in this context is set of files and directories that are copied/loaded into a temporary location, named template values within the files are replaced, the fixture is used for that test, and then it is destroyed when complete.  The constructor looks for fixtures from the root of the project in `./test/fixtures`.  This directory contains a set of additional directories.  Each subdirectory represents a named fixture that can be used in a test.  e.g.  

    ./test/fixtures/some-test

This would contain a usable fixture named `some-test`.  The name of the fixture is a parameter to the function constructor.  Within these named fixture directories one can place files and directories used by a test.  See the usage section below on how to use this within a test.

#### Features
- Template replacement
- Automatic parsing of a JSON file within the fixture
- Parsing of a data file list

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
```
const Fixture = require('util.fixture');

let fixture = new Fixture('test-fixture-1');

... // your test

fixture.cleanup();
```

This will copy the contents of the named fixture `test-fixture-1` to a temporary location.  When a new fixture is created it returns an object with attributes relate to that fixture (the *attributes* are listed below).  The structure could be something like:

```
./test/fixtures/test-fixture-1/
    somefile.txt
    somedirectory/
        ...
```

In this example the temporary location `fixture.dir` represents the temporary directory where the fixture was copied and expanded.  From this location one would see the structure above.  The creation of the fixture also results in template replacement.  In this example there are no custom templates variables; only builtins (see below).  Once the test is complete this fixture should be destroyed with the `cleanup` method.


#### Simple JSON
```
const Fixture = require('util.fixture');

let fixture = new Fixture('simple-json');

... // your test

fixture.cleanup();
```

Similar to a simple fixture above.  If the fixture contains a file with the name `obj.json` then it will load the fixture, parse this JSON, perform template replacement, and save it within the fixture in an exposed field named `fixture.obj`.  The structure of the fixture would be:

```
./test/fixtures/simple-json/
    obj.json
    somedirectory/
        ...
```


#### JSON with Template Replacement
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

Loads a JSON file saved in a fixture location and replaces custom text strings using template replacement.  This would search the given JSON file for all instances of the string `{replaceMe}` and substitute the given value in the template (`test data`).  An example JSON in this case would be:

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

It will lead to a fixture object returned like the previous two examples.


#### Fixture with Template replacement
```
const Fixture = require('util.fixture');

let fixture = Fixture('test-fixture', {
	jsonFile: 'test-directory/somefile.json',
    dataFile: 'test-file.txt',
    templateData: {
        replaceMe: 'test data'
    }
});

... // your test

fixture.destroy(id);
```

Loads a fixture and then searches through all of the files in that fixture for template replacement values.  The same replacements are applied to all files.  This example also demonstrates the use of optional parameters to change the names of the JSON file and data file name.  An example directory structure for `test-fixture` within the temporary location would be:

```
./test/fixtures/test-fixture/
    test-directory/
       somefile.json
    test-file.txt
```

The constructor would copy the fixture to the temporary location, perform template replacement on each of the files (ignoring directories), save them to their temporary versions, and then parse the `jsonFile` and `dataFile` parameters into `fixture.obj` and `fixture.data`.  The example text file above named `test-file.txt` would be:

```
Test information

{replaceMe}
```

And after replacement would be:

```
Test information

test data
```

This sample file would also be [parsed as a file list](https://www.npmjs.com/package/util.filelist).  This would read each line from the file (ignoring blank lines and # comments) and save each line into an array named `fixture.data`.


## API

### Fixture({name}, opts)

This is a single constructor function exposed by the module.

##### parameters

- `name {string}`: The name of the fixture to use.  This corresponds to an entry in `./test/fixtures/{name}`.
- `opts: {object}`: optional parameters (listed below)

##### options

- `basedir {string}`: The base location where the fixture will be temporarily located. The default location is `~/.tmp/unit-test-data/`.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.  The default is `./test/fixtures`.
- `templateData {object}`: a map of key/value pairs that are used for replacement within each fixture file. The [string-template](https://www.npmjs.com/package/string-template) library is used to perform the replacement. All files are checked.
- `dataFile {string}`: The name of the data list file, within the fixture location, that will be parsed and saved into `fixture.data` as an array of lines. By default this file is `data.list`.  It is parsed by the [util.filelist](https://www.npmjs.com/package/util.filelist) module.  This is a way to get a large list of information into the fixture.
- `jsonFile {string}`: The name of a JSON data file that will be parsed and saved into `fixture.obj`.  By default this file is named `obj.json` within the fixture.

##### attributes
Instantiation of the class returns an object with the following attributes:

- `.basedir` - the root temporary directory for all tests.  This can be changed as an option to the function constructor
- `.cleanup()` - removes the temporary directory and all artifacts copied there.  Generally this would be used at the end of a test.
- `.dir` - the location of the temporary directory created for this fixture.
- `.files` - an array of files that were found within the fixture and placed into the temporary `.dir`.
- `.obj` - if the fixture contains `obj.json` or a JSON file named by the `dataFile` option, then it is parsed and the contents of that JSON are stored here.  The JSON file will go through template replacement before it is parsed.
- `.src` - the absolute directory path for the fixture files.

## Template Data Variables
The following are template variables that automatically added to the variable expansion list (templateData).

- `DIR`: the location where the fixture will be copied.  e.g.

```
    {
        file: "{DIR}/somefile.txt"
    }
```
