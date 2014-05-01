#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))
  , json = require(process.cwd() + '/package.json')
  , test = require('../index')

test(argv.name || json.name, argv.version, argv.registry)
