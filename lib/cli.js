#!/usr/bin/env node
var CNI = require('../'),
	fs = require('fs'),
	path = require('path'),
	vinyl = require('vinyl-fs'),
	isCallable = require('is-callable'),
	argv = require('yargs')
		.usage('Usage: $0 --config=cniconf.js')
		.argv;


function getConfig() {
	var configFile = argv.config;

	if (!configFile) {
		if (fs.existsSync('./cni.conf.js')) {
			configFile = './cni.conf.js';
		} else {
			process.stderr.write('ERROR: unable to find configuration file\n');
			process.exit();
		}
	}

	configFile = require(path.resolve(configFile));

	if (isCallable(configFile)) {
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
