# util.fixture

> Test fixture library

[![build](https://github.com/jmquigley/util.fixture/workflows/build/badge.svg)](https://github.com/jmquigley/util.fixture/actions)
[![analysis](https://img.shields.io/badge/analysis-tslint-9cf.svg)](https://palantir.github.io/tslint/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![testing](https://img.shields.io/badge/testing-jest-blue.svg)](https://facebook.github.io/jest/)
[![NPM](https://img.shields.io/npm/v/util.fixture.svg)](https://www.npmjs.com/package/util.fixture)


A testing fixture class used to simplify managing testing artifacts.  A testing fixture in this context is set of files and directories that are copied/loaded into a temporary location, named template values within the files are replaced, the fixture is used for that test, and then it is destroyed when all tests are complete.  The constructor looks for fixtures from the root of the project in `./test/fixtures`.  This directory contains a set of additional directories.  Each subdirectory represents a named fixture that can be used in a test.  e.g.

    ./__tests__/fixtures/some-test

This would contain a usable fixture named `some-test`.  The name of the fixture is a parameter to the constructor.  Within these named fixture directories one can place files and directories used by a test.  See the usage section below on how to use this within a test.

The reason for this module is to deal with concurrency in the [ava] test runner.  It runs tests concurrently, so using one directory for test fixtures is a problem as the tests will share artifacts incorrectly (think of two tests trying to access the same file and writing different things at the same time).  This overcomes that issue by making a separate temporary location each time a fixture is instantiated; different tests will each have their own copy of the fixture.

#### Features
- Template replacement
- Automatic parsing of a JSON file within the fixture
- Parsing of a data file list
- Can be used with concurrent test processing
- Execution of a fixture.js script during instantiation
- Lorem Ipsum and Pattern generators

## Installation

This module uses [yarn](https://yarnpkg.com/en/) to manage dependencies and run scripts for development.

To install as an application dependency with cli:
```
$ yarn add --dev util.fixture
```

To build the app and run all tests:
```
$ yarn run all
```

## Usage

#### Simple Fixture
```javascript
const Fixture = require('util.fixture');

let fixture = new Fixture('test-fixture-1');
let s = fixture.read('somefile.txt');

... // your test
```

This will copy the contents of the named fixture `test-fixture-1` to a temporary location.  The temporary directory location is based on the environment variables `TMP` or `TEMP`.  If neither of these are set, then the directory `~/.tmp` is chosen (and created if it doesn't exist).  This is the home directory of the user running the test.  Within this directory another directory is created named `unit-test-data`.  All test fixtures are copied to this location when used.  The name of each fixture is a generated UUID to make them unique for each test each time it is exectued.  When a new fixture is created it returns an object with attributes related to that fixture (the *attributes* are listed below).  The structure of the fixture could be:

```
./__tests__/fixtures/test-fixture-1/
    somefile.txt
    somedirectory/
        ...
```

In this example the temporary location `fixture.dir` represents the temporary directory where the fixture was copied and expanded.  From this location one would see the directory/file structure above.  The creation of the fixture also results in template replacement.  In this example there are no custom templates variables; only builtins (template replacement will be explained below).

This example also shows that a file named `somefile.txt` was read from the fixture into a temporary string variable `s` using the `read()`.


#### Simple JSON
```javascript
const Fixture = require('util.fixture');

let fixture = new Fixture('simple-json');

... // your test
```

Similar to a simple fixture above.  If the fixture contains a file with the name `obj.json` then it will load the fixture with this JSON file, parse this JSON, perform template replacement, and save it within the fixture in an exposed field named `fixture.obj` and `fixture.jsonObj` (these will reference the same object).  The structure of the fixture would be:

```
./__tests__/fixtures/simple-json/
    obj.json
    somedirectory/
        ...
```

One can see the contents of the JSON file with the property `fixture.json`.  This is the string data read from the given JSON file.


#### JSON with Template Replacement
```javascript
const Fixture = require('util.fixture');

let fixture = new Fixture('some-fixture', {
   	templateData: {
   	    replaceMe: 'test data'
   	}
});

... // your test
```

Loads a JSON file saved in a fixture location and replaces custom text strings using template replacement.  This would search the given JSON file for all instances of the string `{replaceMe}` and substitute the given value in the template (`test data`).  An example JSON in this case would be:

```json
{
    "testData": "{replaceMe}",
    "testBool": true
}
```

resulting in:

```json
{
    "testData": "test data",
    "testBool": true
}
```

It will lead to a fixture object returned like the previous two examples.

#### Simple YAML
The fixture will also process YAML files inside of a fixture.  If the fixture contains a file with the name `obj.yaml` then it will load the fixture with this YAML file, parse it, performan template replacement, and save it within the fixture in an exposed filed named `fixture.yamlObj`.  Note that `fixture.obj` is the legacy name for JSON objects and NOT YAML.  The fixture will also contain a property named `fixture.yaml` which is a string representing the contents of the YAML file.


#### Fixture with Template Replacement
```javascript
const Fixture = require('util.fixture');

let fixture = Fixture('test-fixture', {
    jsonFile: 'test-directory/somefile.json',
    dataFile: 'test-file.txt',
    templateData: {
        replaceMe: 'test data'
    }
});

... // your test
```

Loads a fixture and then searches through all of the files in that fixture for template replacement values.  The same replacements are applied to all files.  This example also demonstrates the use of optional parameters to change the names of the JSON file and data file name.  An example directory structure for `test-fixture` within the temporary location would be:

```
./__tests__/fixtures/test-fixture/
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

This sample file would also be [parsed as a file list](https://www.npmjs.com/package/util.filelist).  This would read each line from the file (ignoring blank lines and # comments) and save each line into an array named `fixture.data`.  This is a way to take a large list of data, parse it, and store it into an array.


#### Empty Fixture (Temporary Directory)
```javascript
const Fixture = require('util.fixture');

let fixture = Fixture('tmpdir');

... // your test
```

A fixture with the name `tmpdir` is a special case.  This will create a temporary directory, but will have no files or directories within it.  It will not perform any template replacements.  The directory is accessible through `fixture.dir`.

A temporary directory can also be created with an empty constructor:

```javascript
const Fixture = require('util.fixture');

let fixture = Fixture();

... // your test
```

When the fixture is cleaned up this directory would be removed.


#### Pattern Generator
When the fixture is instatiated a test pattern string is created.  This string represents a 2D array of repeated chevrons.  Note that this data is stored as a newline delimited string.

The default pattern is a set of chevrons of the letters `a` - `z`, where each letter is a row of 80 columns. e.g.

```
aaaaaaaaaa...
bbbbbbbbbb...
cccccccccc...
...
zzzzzzzzzz...
```

To create a default pattern use:

```javascript
const fixture = new Fixture('pattern');
fixture.pattern; // a string representing the pattern.
```

To create a custom pattern use:

```javascript
const fixture = new Fixture('pattern', {
    pattern: {
        chevrons: ['0', '1', '2'],
        columns: 80,
        repeat: 5
    }
});
```
This will create a 15 x 80 grid of numbers, where each row is `0, 1, 2, ...` (15 rows).


#### LoremIpsum Generator
When the `Fixture` is instantiated it will generate a [lorem ipsum](https://en.wikipedia.org/wiki/Lorem_ipsum) string (random text).  It uses the [lorem-ipsum](https://github.com/knicklabs/lorem-ipsum.js) package to create the text.  The text is accessed through the property `.loremIpsum`.  See the package link above for configuration options.  A special name `loremIpsum` can be used if no fixture directory structure is required.

```javascript
const fixture = new Fixture('loremIpsum', {
    loremIpsum: {
        count: 3,
        sentenceLowerBound: 10,
        sentenceUpperBound: 20
    }
});

fixture.loremIpsum;
```

The fixture above generates a custom lorem ipsum string with 3 sentences where each sentence has between 10 and 20 words.


#### Script Execution
If the fixture contains a script named `fixture.js` then this script will be executed when the fixture is instantiated.  Note that this script will only work with built in node *requires* unless the fixture itself contains its own `node_modules` directory.  The script is removed from the temporary fixture after it is executed.

The name of the execution script can be changed as an optional parameter to the fixture construtor:

```javascript
const Fixture = require('util.fixture');

let fixture = Fixture('test-fixture', {
	script: 'ascript.js'
});

... // your test
```


#### Cleanup
When all tests are complete the fixture should be cleaned up.  The class contains a static method named `cleanup`.  In [ava] this is used in the `test.after.always` hook:

```javascript
test.after.always.cb(t => {
    Fixture.cleanup((err: Error, directories: string[]) => {
        if (err) {
            t.fail(err.message);
        }

        directories.forEach((directory: string) => {
            t.false(fs.existsSync(directory));
        });

        t.end();
    });
});
```

The cleanup function only needs to be called once per testing file.  The class keeps track of all test directories that were created when the Fixture is instantiated and removes them when the cleanup is called.

Note that when using [ava] the hook `test.after.always` is executed within each separate test file and NOT once per overall test execution.  This code needs to be part of each test file to clean up the files related to those tests.  If this is not executed, then all of the temp files created by the fixture will remain (and you will be required to clean them up).  Note that this process has intermittent issues on Windows.  It seems that the [fs-extra remove function](https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove.md) will occasionally fail when trying to delete files if Windows still has a process attached to it (like file explorer).


See [tests.js](https://github.com/jmquigley/util.fixture/blob/master/test/tests.ts) in this repository for examples of these usage patterns.

The module also contains a helper function named `cleanup()` which handles the process listed above.  The example below works with [jest](https://jestjs.io/) testing.

```javascript
import {cleanup, Fixture} from "util.fixture";

afterall((done) => {
    cleanup({done, message: "done with fixture testing"});
});
```


## API

### Fixture([{name}, opts])

This is a single constructor exposed by the module.

##### parameters

- `name {string}`: The name of the fixture to use.  This corresponds to an entry in `./__tests__/fixtures/{name}`.  When this is empty an empty, temporary directory is created.
- `opts: {object}`: optional parameters (listed below)

##### options

The following options can be used to customize the fixture.  They can be set as an optional object given to the class during instantiation or within `package.json` in a section named *fixture*.  The precedence of application, from lowest to highest, is the default internal options, the `package.json`, and finally the constructor options.

- `basedir {string}`: The base location where the fixture will be temporarily located. The default location is determined by the environment variable `TMP` first or `TEMP` if TMP is not found.  If neither of these are set, then `~/.tmp/unit-test-data` is created and used within the users home directory.  This must be a directory that is writable by the user running the test.
- `dataFile {string}`: The name of the data list file, within the fixture location, that will be parsed and saved into `fixture.data` as an array of lines. By default this file is `data.list`.  It is parsed by the [util.filelist](https://www.npmjs.com/package/util.filelist) module.  This is a way to get a large list of information into the fixture.
- `fixtureDirectory {string}`: The location within the project where fixtures are found.  The default is `./__tests__/fixtures`.
- `jsonFile {string}`: The name of a JSON data file that will be parsed and saved into `fixture.obj` and `fixture.jsonObj`.  By default this file is named `obj.json` within the fixture.
- `pattern {object}` - configuration overrides for the pattern generator.  It contains 3 attributes: columns, repeat count, and an array of chevrons.
- `loremIpsum {object}`: [configuration options](https://github.com/knicklabs/lorem-ipsum.js/blob/master/README.md) for the lorem ipsum generator.
- `script {string}`: The name of the node script that will be executed when the fixture is instantiated.  The default nam is `fixture.js`.
- `templateData {object}`: a map of key/value pairs that are used for replacement within each fixture file. The [string-template](https://www.npmjs.com/package/string-template) library is used to perform the replacement. All files are checked.
- `yamlFile {string}`: The name of a YAML data file that will be parsed and saved into `fixture.yamlObj`.  By default this file is named `obj.yaml` within the fixture.


##### attributes
Instantiation of the class returns an object with the following attributes:

- `.basedir` - the root temporary directory for all tests.  This can be changed as an option to the function constructor
- `.cleanup()` - static method on the class that removes the base directory and and all artifacts copied there.  Generally this would be used at the end of ALL testing.  In [ava] this would be done in the `test.after.always` function.
- `.data` - if the fixture contains a file named `data.list` or a text file named by the `dataFile` option, then it will be processed and placed here.  This is an Array object when defined.
- `.dir` - the location of the temporary directory created for this fixture.
- `.files` - an array of files that were found within the fixture and placed into the temporary `.dir`.
- `.json` - a text string representing a JSON file that was read into the fixture.  It's an empty string if there was no JSON file to process.
- `.jsonObj` - if the fixture contains `obj.json` or a JSON file named by the `jsonFile` option, then it is parsed and the contents of that JSON are stored here.  The JSON file will go through template replacement before it is parsed.  There is also an alias named `.obj`.
- `.name` - the name of the requested fixture.  This is the first string parameter to the Fixture constructor.
- `.loremIpsum` - a string containing a randomly generated lorem ipsum string/sentence.
- `.pattern` - a string contained a MxN repeating pattern.
- `.read({filename}): string` - Reads the contents of one of the files within the fixture and returns it as a string.  The filename is a relative path within the fixture (the absolute path is resolved by the class).  This is the contents of the file after it has been processed through template replacement.
- `.src` - the absolute directory path for the fixture files.
- `.toString()` - returns a string that shows the internal representation of the fixture.  It will show all of these attributes and the options that were passed to the class when it was instantiated.
- `.yaml` - a text string representing a YAML file that was read into the fixture.  It's an empty string if there was no YAML file to process.
- `.yamlObj` - if the fixture contains `obj.yaml` or a YAML file named by the `yamlFile` option, then it is parsed and the contents of that YAML are stored here.  The YAML file will go through template replacement before it is parsed.

##### events

- `loaded` - This event fires once the constructor has finished creating the fixture.

## Template Data Variables
The following are template variables that automatically added to the variable expansion list (templateData).

- `DIR`: the location where the fixture will be copied.  e.g.

```
{
    file: "{DIR}/somefile.txt"
}
```

[ava]: https://github.com/avajs/ava
