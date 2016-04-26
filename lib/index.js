var nodeResolve = require('resolve'),
	path = require('path'),
	vinyl = require('vinyl-fs'),
	through2 = require('through2'),
	isCallable = require('is-callable'),
	mergeStream = require('merge-stream'),
	Promise = require('promise'),
	rename = require('gulp-rename'),

	reHasExclamation = /!/,
	reIsTag = /^<([^>]+)>$/;

module.exports = function CleanNodeInstaller (config) {
	if (!(this instanceof CleanNodeInstaller)) return new CleanNodeInstaller(config);
	this.config = config;
	return this;
};

module.exports.prototype = {
	resolveModulePath: function (module) {
		return new Promise(function (resolve, reject) {
			nodeResolve(module, function (err, main, details) {
				var result = {};
				if (err) {
					reject(err);
					return;
				}
				if (!details) {
					reject('unable to resolve ' + module);
					return;
				}

				var module_path = path.join('./node_modules', details._location);

				resolve({
					module: module,
					path: module_path,
					details: details
				});
			});
		});
	},

	resolveModulePaths: function (moduleNames) {
		return Promise.all(moduleNames.map(this.resolveModulePath))
			.then(function (result) {
				var merged = {},
					i;

				for (i=0; i < result.length; i++) {
					merged[result[i].module] = result[i];
				}

				return merged;
			});
	},

	parseModuleConfig: function (modules) {
		var self = this;

		return new Promise(function (resolve, reject) {
			var pkg,
				item,
				module,
				srcPath,
				dstPath;
				items = [];

			for (pkg in modules) {
				if (modules.hasOwnProperty(pkg)) {
					module = modules[pkg];

					for (srcPath in module) {
						if (module.hasOwnProperty(srcPath)) {

							dstPath = self.parseDestinationPattern(module[srcPath]);

							items.push({
								pkg: pkg,
								src: srcPath,
								dest: dstPath.dest,
								transforms: dstPath.transforms
							});
						}
					}
				}
			}
			resolve(items);
		});
	},

	parseDestinationPattern: function (dstPath) {
		var transforms;
		// Check for transforms
		if (reHasExclamation.test(dstPath)) {
			transforms = dstPath.split('!');
			dstPath = transforms.shift();
		}

		return {
			dest: dstPath,
			transforms: transforms || []
		};
	},

	createStream: function () {
		return new mergeStream();
	},

	go: function () {
		var self = this,
			allStreams = this.createStream();

		Promise.all([
			this.resolveModulePaths(Object.keys(this.config.modules)),
			this.parseModuleConfig(this.config.modules)
		]).then(function (result) {
			var modulePaths = result[0],
				moduleConfigs = result[1],
				transform,
				config,
				stream,
				i;


			moduleConfigs.map(function (config) {
				// check for special source names and process as necessary
				if (reIsTag.test(config.src)) {
					config.src = config.src.match(reIsTag)[1]
						.split('.')
						.reduce(function (a,b) { return a[b]; }, modulePaths[config.pkg].details);
				}

				stream = vinyl.src(path.join(modulePaths[config.pkg].path, config.src));

				for (i = 0; i < config.transforms.length; i++) {
					transform = self.config.transforms[config.transforms[i]];

					// If the transform requested isn't in the configuration, then
					// attempt to require a 'cni-transform-' prefixed version and use that.
					if (typeof transform === 'undefined' || typeof transform.module === 'undefined') {
						transform = require('cni-transform-' + config.transforms[i])(transform && transform.options || {});
					}

					if (transform.writable) {
						stream = stream.pipe(transform);
					} else {
						stream = stream.pipe(require(transform.module || transform)(transform.options || {}));
					}
				}

				stream = stream.pipe(rename(function (path) {
					path.dirname = config.dest;
				}));

				allStreams.add(stream);
			});
		}, function (err) {
			console.log('ERROR:', err);
		})
		.then(function () {

		}, function (err) { console.log(err); });

		allStreams.pipe(through2.obj(function (file, enc, callback) {
			console.log('copied', file.path);
			callback();
		}));

		return allStreams;
	}
};
