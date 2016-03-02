'use strict';

var fs = require('fs');
var resolve = require('resolve');
var yaml = require('js-yaml');
var merge = require('merge-descriptors');
var argv = require('optimist').argv;

// Get Config from ETCD
if  ( process.env.NODE_USE_ETCD_CONFIG != "false" ) {
  if ( process.env.ETCD_HOST && process.env.ETCD_APPCFG_PATH && process.env.NODE_APP_NAME ) {
    var etcdHosts = process.env.ETCD_HOST.split(',');
    var etcd = new require('node-etcd')(etcdHosts);
    var key = process.env.ETCD_APPCFG_PATH + '/' + process.env.NODE_APP_NAME
    var res = etcd.getSync(key)
    if ( res.err ) {
      console.log('Error get config from ETCD: ', err.error.message);
      process.exit(1);
    } else if ( res.body.node.dir ) {
      console.log('Error get config from ETCD: ', key, 'is a directory.');
      process.exit(1);
    }
    etcdConfig = yaml.safeLoad(res.body.node.value);
  };
}

// Get Config from FILE
var filename = process.env.NODE_ENV || 'default';
var CONFIG_BASEDIR = process.env.CONFIG_BASEDIR || process.cwd();
var CONFIG_DIR = process.env.CONFIG_DIR || 'config';
var CONFIG = merge(JSON.parse(process.env.CONFIG || '{}'), argv);
var fileConfig = loadConfig(filename);

var config = merge(fileConfig, etcdConfig, false);

try {
  module.exports = merge(config, loadConfig('default'), false);
} catch (e) {}

function loadConfig(filename) {
  var filepath = resolve.sync(filename, {
    basedir: CONFIG_BASEDIR,
    extensions: ['.js', '.json', '.node', '.yaml', '.yml'],
    moduleDirectory: CONFIG_DIR
  });
  if (/\.ya?ml$/.test(filepath)) {
    return merge(CONFIG, yaml.safeLoad(fs.readFileSync(filepath , 'utf8')), false);
  } else {
    return merge(CONFIG, require(filepath), false);
  }
}

