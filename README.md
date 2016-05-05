# clean-npm-installer
Easily transform and pre-process npm modules for deployment scenarios

1. Create a `cni.conf.js` file
2. `npm install` all your required packages
3. run `clean-npm-installer`
4. enjoy! (hopefully)

## Example configurations

#### Renaming

```javascript
module.exports = {
  directory: 'javascript',
  modules: {
    'underscore': {
      '<main>': 'underscore-<version>.js'
    },
    'backbone': {
      '<main>': 'backbone-<version>.js'
    }
  }
};
```
output:
```
js/underscore-1.8.3.js
js/backbone-1.3.3.js
```

#### Transforms (uglify)
Use a gulp transform, such as uglify.
```javascript
module.exports = {
  directory: 'javascript',
  modules: {
    'underscore': {
      '<main>': 'underscore-<version>.min.js!min'
    }
  },
  transforms: {
    min: {
      module: 'gulp-uglify'
    }
  }
}
```

output:
```
js/underscore-1.3.3.min.js
```
#### Browserify
Process with browserify using [cni-transform-browserify](https://github.com/Klowner/cni-transform-browserify).
If you specify a transform that isn't defined in your configuration, clean-npm-installer will auto-require a
module named `cni-transform-<name>`.
```javascript
module.exports = {
  directory: 'javascript',
  modules: {
    'casual-browserify': {
      '<main>': 'casual-<version>.min.js!browserify!min'
    }
  },
  transforms: {
    min: {
      module: 'gulp-uglify'
    }
  }
}
```
output: a single `casual-1.5.2.min.js` which has been bundled using [browserify](http://browserify.org/) and
then minified with [gulp-uglify](https://www.npmjs.com/package/gulp-uglify).

#### Multiple files
This example demonstrates bundling jquery-ui, jquery and related css files. Start by installing
`jquery`, `jquery-ui`, `gulp-uglify` and `gulp-clean-css`.

```javascript
module.exports = {
	directory: 'assets',
	modules: {
		'jquery-ui': {
			'<main>': 'js/jquery-and-jquery-ui-<version>.js!browserify!minjs',
			'themes/le-frog/*.css': 'css/*-le-frog.css!mincss'
		}
	},
	transforms: {
		minjs: {
			module: 'gulp-uglify'
		},
		mincss: {
			module: 'gulp-clean-css'
		}
	}
};
```
output:
```
assets/css/jquery-ui-le-frog.css
assets/css/jquery-ui.min-le-frog.css
assets/css/jquery.ui.theme-le-frog.css
assets/js/jquery-ui-1.10.5.js
assets/js/jquery-and-jquery-ui-1.10.5.js
```
