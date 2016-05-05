var path = require('path');

function explode(string) {
	return {
		dir: path.dirname(string),
		name: path.basename(string)
	};
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRegExp(name) {
	var parts = name.split('*');
}

function isDir(string) {
	return string[string.length-1] === '/';
}

function globRenameGenerator(from, to) {
	var fromRe, fromBase, toBase;

//	if (from.indexOf('**') === -1) {
		// convert 'from' pattern into a regular expression
		fromRe = new RegExp(from.split('*').map(escapeRegExp).join('(.*)'));
		fromDir = isDir(from) ? from : (path.dirname(from) + '/');
		toDir = isDir(to) ? to : (path.dirname(to) + '/');


		return function rename (name, base) {
			var orig = name,
				parts = name.match(fromRe) || [],
				i;

			name = to;

			for (i = 1; i < parts.length; i++) {
				name = name.replace('*', parts[i], 1);
			}

			return name;
		};
	//}
}

function pathParts(string) {
	return {
		dirname: path.dirname(string),
		basename: path.basename(string),
		extname: path.extname(string)
	};
}

function partsGlobRenameGenerator(from, to) {
	var fromParts = pathParts(from),
		toParts = pathParts(to),
		result = {},
		keys = ['dirname', 'basename', 'extname'],
		key,
		i;

	for (i = 0; i < keys.length; i++) {
		key = keys[i];
		result[key] = globRenameGenerator(fromParts[key], toParts[key]);
	}

	return result;
}

module.exports = {
	rename: globRenameGenerator,
	renameParts: partsGlobRenameGenerator,
	isDir: isDir
};
