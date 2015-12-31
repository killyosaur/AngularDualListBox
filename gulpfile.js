var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var concat = require('gulp-concat');
var footer = require('gulp-footer');
var jshint = require('gulp-jshint');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var minifyHtml = require('gulp-minify-html');
var angularTemplatecache = require('gulp-angular-templatecache');
var pkg = require('./package.json');
var del = require('del');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var Server = require('karma').Server;

var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */'].join('\n');

var DEST = 'dist/';
var APP = 'app/scripts/';
var SRC = 'src/**/*.js';
var TEMP = '.tmp/';

gulp.task('test', ['templatecache'], function(done) {
   new Server({
       configFile: __dirname + '/karma.conf.js',
       singleRun: true
   }, function() {
       done(); 
   }).start();
});

gulp.task('clean-temp', function() {
	return del([TEMP + '*']);
});

gulp.task('clean-dest', function() {
	return del([DEST + '*']);
});

gulp.task('default', ['scripts'], function(){
	return gulp.src(TEMP + '*.js')
		.pipe(concat('angular.duallistbox.js'))
		.pipe(header(banner + '\n(function() {\n', { pkg: pkg }))
		.pipe(footer('\n})();'))
		.pipe(gulp.dest(DEST))
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest(DEST));
});

gulp.task('addpkg', ['scripts'], function(){
	gutil.log('Adding new script now.')
	return addPkg();
});

gulp.task('watch', function(){
	var watcher = gulp.watch(SRC, ['addpkg']);
	watcher.on('change', function(event) {
		if (event.type === 'deleted') {
			delete cached.caches.scripts[event.path];
			remember.forget('scripts', event.path);
		}
	})
});

gulp.task('templatecache', function() {
	return gulp
		.src('src/*.html')
		.pipe(minifyHtml({empty: true}))
		.pipe(angularTemplatecache(
			'templates.js',
			{
				module: 'killyosaur.dualListBox',
				root: 'templates/',
				standalone: false,
				transformUrl: function(url) {
					return url.replace(/\.html$/, '');
				}
			}
		))
		.pipe(gulp.dest(TEMP));
});

gulp.task('scripts', ['clean-temp', 'clean-dest', 'templatecache'], function(){
	return gulp.src(SRC)
		.pipe(cached('scripts'))
		.pipe(jshint())
		.pipe(remember())
		.pipe(concat('angular.duallistbox.js', 
		   ['app.js',
			'duallistbox.js',
			'duallistboxConfig.js',
			'duallistboxController.js',
			'templates.js']))
		.pipe(gulp.dest(TEMP));
});

gulp.task('serve', ['addpkg', 'watch'], function(){
	browserSync({
		server: {
			baseDir: 'app'
		}
	});
	
	gulp.watch(['*.html', 'scripts/**/*.js'], {cwd: 'app'}, reload);
});

function addPkg(){
	return gulp.src(TEMP + '*.js')
		.pipe(gulp.dest(APP));
}