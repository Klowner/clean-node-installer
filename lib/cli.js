#!/usr/bin/env node
var CNI = require('../'),
	fs = require('fs'),
	path = require('path'),
	vinyl = require('vinyl-fs'),
	argv = require('yargs')
		.usage('Usage: $0 --config=cniconf.js')
		.argv;


function getConfig() {
	var configFile = argv.config;

	if (!configFile) {
		if (fs.existsSync('./cni.conf.js')) {
			configFile = './cni.conf.js';
		} else {
			process.stderr.write('ERROR: unable to find configuration file: cni.conf.js\n');
			process.exit();
		}
	}

	configFile = require(path.resolve(configFile));

	if (typeof configfile === 'function') {
		configFile = configFile();
	}

	if (!configFile.directory) {
		configFile.directory = 'public';
	}

	return configFile;
}

function run () {
	var config = getConfig();

	return CNI(config)
		.go()
		.pipe(vinyl.dest(config.directory));
}

module.exports = {
	run: run
};
