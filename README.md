compat-test
===========

run an existing test suite agains new code

# Usage

### cli
`npm install -g compat-test`

in your directory 'comat-test'

###### flags
`--name` if different than the name in package.json
`--version` defaults to 'latest'
`--registry` defualts to the public npm registry

# Limitations
* Must be able to run tests with `require('module_dir/test')
* no dynamic requires
* all tests must be in the test directory
