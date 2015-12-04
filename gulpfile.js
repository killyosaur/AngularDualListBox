var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var pkg = require('./package.json');
var del = require('del');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

var DEST = 'dist/';
var APP = 'app/scripts/'

gulp.task('clean-dest', function() {
	return del(['dist/*'])
});

gulp.task('default',['clean-dest'], function(){
	return gulp.src('./src/angular.duallistbox.js')
			.pipe(header(banner, { pkg: pkg }))
			.pipe(gulp.dest(DEST))
			.pipe(uglify())
			.pipe(rename({ extname: '.min.js' }))
			.pipe(header(banner, { pkg: pkg }))
			.pipe(gulp.dest(DEST));
});

gulp.task('addpkg', function(){
	return gulp.src('./src/angular.duallistbox.js')
			.pipe(gulp.dest(APP));
});

gulp.task('serve', ['addpkg'], function(){
	browserSync({
		server: {
			baseDir: 'app'
		}
	});
	
	gulp.watch(['*.html', 'scripts/**/*.js'], {cwd: 'app'}, reload);
})