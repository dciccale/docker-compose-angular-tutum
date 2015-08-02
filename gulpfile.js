'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({lazy: false});
var noop = $.util.noop;
var es = require('event-stream');
var wiredep = require('wiredep').stream;
var mainBowerFiles = require('main-bower-files');
var rimraf = require('rimraf');
var lazypipe = require('lazypipe');
var isWatching = false;
var colors = $.util.colors;
var browserSync = require('browser-sync');

var htmlminOpts = {
  removeComments: true,
  collapseWhitespace: true,
  removeEmptyAttributes: false,
  collapseBooleanAttributes: true,
  removeRedundantAttributes: true
};

// Dev tasks
// ----------

// Index
gulp.task('index', index);

// Build
gulp.task('build', index);

// Default task
gulp.task('default', ['build']);

// Start server
gulp.task('serve', ['build'], function () {
  isWatching = true;

  $.nodemon({
    script: './server/app.js',
    watch: ['./server']
  })
  .on('restart', function () {
    setTimeout(function () {
      browserSync.reload();
    }, 1000);
  })
  .once('start', startBrowserSync);
});

// Dist tasks
// ----------

// Optimize JS
gulp.task('vendors-js', function () {
  var js = mainBowerFiles({filter: /\.js$/});
  return gulp.src(js).pipe(dist('js', 'vendor'));
});

// Optimize CSS
gulp.task('vendors-css', function () {
  var css = mainBowerFiles({filter: /\.css$/});
  return gulp.src(css).pipe(dist('css', 'vendor'));
});

// Optimize all
gulp.task('vendors', ['vendors-js', 'vendors-css']);

// Minify, compile and concat templates
gulp.task('templates', function () {
  return gulp.src(['./client/{app,components}/**/*.html'])
    .pipe($.htmlmin(htmlminOpts))
    .pipe($.ngHtml2js({moduleName: 'app'}))
    .pipe($.concat('templates.js'))
    .pipe(gulp.dest('./.tmp'));
});

// Run dist tasks for scripts
gulp.task('scripts', ['templates'], function () {
  return appFiles().pipe(dist('js', 'app'));
});

// Run dist tasks for styles
gulp.task('styles', function () {
  return cssFiles().pipe(dist('css', 'app'));
});

// Inject app/vendor styles and scripts
gulp.task('inject', ['vendors', 'scripts', 'styles'], function () {
  return gulp.src('./client/index.html')
    .pipe($.inject(gulp.src('./.tmp/app.min.{js,css}'), {
      ignorePath: '.tmp'
    }))
    .pipe($.inject(gulp.src('./.tmp/vendor.min.{js,css}'), {
      ignorePath: '.tmp',
      starttag: '<!-- inject:vendor:{{ext}} -->'
    }))
    .pipe(gulp.dest('./dist/public'));
});

// Replace index styles and script tags with revved files
gulp.task('rev', ['inject'], function () {
  return gulp.src(['./.tmp/**/*.json', './dist/public/index.html'])
    .pipe($.revCollector({replaceReved: true}))
    .pipe(gulp.dest('./dist/public'));
});

// Copy server to dist
gulp.task('copy-server', function () {
  return gulp.src('./server/**/*')
    .pipe(gulp.dest('./dist/server'));
});

// Copy favicon.ico to dist
gulp.task('copy-favicon', function () {
  return gulp.src('./client/favicon.ico')
    .pipe(gulp.dest('./dist/public'));
});

// Copy bootstrap glyphicons fonts
gulp.task('copy-glyphicons', function () {
  return gulp.src('./client/bower_components/bootstrap/fonts/*')
    .pipe(gulp.dest('./dist/public/fonts'));
});

// Clean dist
gulp.task('clean-dist', function (done) {
  rimraf('./dist/', done);
});

// Build app for production
gulp.task('build-all', ['rev', 'copy-server', 'copy-glyphicons', 'copy-favicon'], function () {
  return gulp.src('./dist/public/index.html')
    .pipe($.htmlmin(htmlminOpts))
    .pipe(gulp.dest('./dist/public'));
});

// Build production ready distribution into dist directory
gulp.task('dist', ['clean-dist'], function (done) {
  gulp.start('build-all', done);
});

// Run dist server in production mode
gulp.task('serve-dist', function () {
  $.nodemon({
    script: './dist/server/app.js',
    env: {NODE_ENV: 'production'},
    watch: ['!*.*'],
    quiet: true
  });
});

// Inject vendors from bower and our app (js and css) files into index.html
function index() {
  var opt = {read: false};
  return gulp.src('./client/index.html')
    .pipe(wiredep())
    .pipe($.inject(es.merge(appFiles(opt), cssFiles(opt)), {
      ignorePath: ['../.tmp'],
      relative: true
    }))
    .pipe(gulp.dest('./client'))
    .pipe(livereload());
}

// All our application CSS files as a stream
function cssFiles(opt) {
  return gulp.src('./client/{app,components}/**/*.css', opt);
}

// All our application JS files as a stream
function appFiles(opt) {
  return gulp.src(['./client/{app,components}/**/*.js', './.tmp/templates.js'], opt);
}

/**
 * Concat, minify, rename, rev
 * ext: string file extension (js, css)
 * name: string file name (app, vendor, etc)
 */
function dist(ext, name) {
  return lazypipe()
    .pipe($.concat, name + '.' + ext)
    .pipe(ext === 'js' ? $.uglify : $.minifyCss)
    .pipe($.rename, name + '.min.' + ext)
    .pipe(gulp.dest, './.tmp')
    .pipe($.rev)
    .pipe(gulp.dest, './dist/public')
    .pipe($.rev.manifest)
    .pipe(gulp.dest, './.tmp/rev-' + name + '-' + ext)();
}

// Starts browser sync
function startBrowserSync() {
  var config = require('./server/config/environment');
  browserSync({
    proxy: 'localhost:' + config.port,
    port: 3000,
    files: ['client/**/*.*']
  });
}

// Reload browser (or noop if not run by watch)
function livereload() {
  return lazypipe()
    .pipe(isWatching ? browserSync.stream : noop)();
}
