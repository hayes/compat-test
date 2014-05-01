var lang = require('cssauron-falafel')
  , concat = require('concat-stream')
  , request = require('hyperquest')
  , falafel = require('falafel')
  , through = require('through')
  , rimraf = require('rimraf')
  , ls = require('ls-stream')
  , tar = require('tar-fs')
  , util = require('util')
  , path = require('path')
  , zlib = require('zlib')
  , fs = require('fs')

var is_require = lang('!call > [name=require]')
  , dir = path.resolve(process.cwd(), '_old')

module.exports = test_against

function test_against(name, version, registry) {
  process.on('exit', cleanup)

  get(name, version || 'latest', registry || 'http://registry.npmjs.org', test)
}

function test(err) {
  if(err) {
    throw err
  }

  require(dir + '/test')
}

function get(name, version, registry, done) {
  request(util.format('http://registry.npmjs.org/%s/%s', name, version))
    .pipe(concat(get_tarball))
    .on('error', done)

  function get_tarball(data) {
    var url

    try {
      url = JSON.parse(data).dist.tarball
    } catch(e) {
      return done(e)
    }

    request(url).pipe(zlib.createUnzip()).pipe(extract())
  }

  function extract() {
    return tar.extract(dir, {ignore: ignore, map: rename})
      .on('finish', fix_requires)
      .on('error', done)
  }

  function fix_requires() {
    ls(dir)
      .pipe(through(js_only))
      .pipe(through(update_file))
      .on('end', done.bind(null, null))
      .on('error', done)
  }
}

function ignore(name) {
  return !path.relative(dir, name).match(/^test/)
}

function rename(header) {
  header.name = header.name.replace(/^package/, '')

  return header
}

function update_file(entry) {
  var src = falafel(
      fs.readFileSync(entry.path, {encoding: 'utf8'})
    , check_node
  ).toString()

  fs.writeFileSync(entry.path, src)

  function check_node(node) {
    if(node = is_require(node)) {
      if(node.arguments[0].value.match(/^\/|\./)) {
        fix_path(node)
      }
    }
  }

  function fix_path(node) {
    var req_path = path.resolve(
        path.dirname(entry.path)
      , node.arguments[0].value
    )

    if(!fs.existsSync(req_path) && !fs.existsSync(req_path + '.js')) {
      req_path = path.relative(
          path.dirname(entry.path)
        , path.resolve(process.cwd(), path.relative(dir, req_path))
      )

      node.update(util.format('require(\'%s\')', req_path))
    }
  }
}

function js_only(entry) {
  if(entry.path.split('.').pop() === 'js') {
    this.queue(entry)
  }
}

function cleanup() {
  rimraf.sync(dir)
}
