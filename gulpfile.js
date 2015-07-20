'use strict';

var gulp = require('gulp');
var g = require('gulp-load-plugins')({lazy: false});
var noop = g.util.noop;
var es = require('event-stream');
var wiredep = require('wiredep').stream;
var mainBowerFiles = require('main-bower-files');
var rimraf = require('rimraf');
var Queue = require('streamqueue');
var lazypipe = require('lazypipe');
var isWatching = false;
var colors = g.util.colors;

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

// Start server and watchers
gulp.task('serve', ['build'], function () {
  var server, skipIndex;

  isWatching = true;

  server = g.liveServer(['./server/app.js'], {}, false);

  // Start server
  server.start();

  // Start livereload server
  g.livereload.listen();

  // Watch server files to re-start the server when modified
  gulp.watch(['server/**/*.js'], function () {
    server.start.apply(server);
  })
    .on('change', function (evt) {
      g.util.log(
        colors.magenta('gulp-watch'),
        colors.cyan(evt.path.match(/server.*/)[0]), 'was', evt.type + ', restarting server...'
      );
      // Reload browser after giving the server some time to restart
      setTimeout(g.livereload.reload, 1000);
    });

  // Will prevent multiple executions when manually triggered the index task
  skipIndex = false;

  // Watch index change, and for new installed bower components
  // Will not be executed if skipIndex was set to false
  gulp.watch(['./client/index.html', './bower.json'], function () {
    gulp.start(skipIndex ? [] : ['index']);
  });

  // Watch scripts and css for live reload
  g.watch(['./client/{app,components}/**/*.js', './client/{app,components}/**/*.css'], function (vinyl) {
   // New or deleted file, do index task but prevent trigering multiple times
   // with skipIndex set to true
    if (vinyl.event !== 'change') {
      skipIndex = true;
      // Manually trigger index task
      gulp.start('index', function () {
        g.livereload.changed(vinyl);
        skipIndex = false;
      });

    // Changed file, just reload
    } else {
      g.livereload.changed(vinyl);
      skipIndex = false;
    }
  });
});

// Dist tasks
// ----------

// Minify vendors
gulp.task('vendors', function () {
  var files = mainBowerFiles();
  var vendorJs = fileTypeFilter(files, 'js');
  var vendorCss = fileTypeFilter(files, 'css');
  var q = new Queue({objectMode: true});
  if (vendorJs.length) {
    q.queue(gulp.src(vendorJs).pipe(dist('vendor', 'js')));
  }
  if (vendorCss.length) {
    q.queue(gulp.src(vendorCss).pipe(dist('vendor', 'css')));
  }
  return q.done();
});

// Minify, compile and concat templates
gulp.task('templates', function () {
  return gulp.src(['./client/{app,components}/**/*.html'])
    .pipe(g.htmlmin(htmlminOpts))
    .pipe(g.ngHtml2js({moduleName: 'app'}))
    .pipe(g.concat('templates.js'))
    .pipe(gulp.dest('./.tmp'));
});

// Run dist tasks for scripts
gulp.task('scripts', ['templates'], function () {
  return appFiles().pipe(dist('app', 'js'));
});

// Run dist tasks for styles
gulp.task('styles', function () {
  return cssFiles().pipe(dist('app', 'css'));
});

// Inject app/vendor styles and scripts
gulp.task('inject', ['vendors', 'scripts', 'styles'], function () {
  return gulp.src('./client/index.html')
    .pipe(g.inject(gulp.src('./.tmp/app.min.{js,css}'), {
      ignorePath: '.tmp'
    }))
    .pipe(g.inject(gulp.src('./.tmp/vendor.min.{js,css}'), {
      ignorePath: '.tmp',
      starttag: '<!-- inject:vendor:{{ext}} -->'
    }))
    .pipe(gulp.dest('./dist/public'));
});

// Replace index styles and script tags with revved files
gulp.task('rev', ['inject'], function () {
  return gulp.src(['./.tmp/**/*.json', './dist/public/index.html'])
    .pipe(g.revCollector({replaceReved: true}))
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
    .pipe(g.htmlmin(htmlminOpts))
    .pipe(gulp.dest('./dist/public'));
});

// Build production ready distribution into dist directory
gulp.task('dist', ['clean-dist'], function (done) {
  gulp.start(['build-all'], done);
});

// Serve dist directory in production mode
gulp.task('serve-dist', function () {
  var options = {env: process.env};
  options.env.NODE_ENV = 'production';
  g.liveServer(['./dist/server/app.js'], options, false).start();
});

// Inject vendors from bower and our app (js and css) files into index.html
function index() {
  var opt = {read: false};
  return gulp.src('./client/index.html')
    .pipe(wiredep())
    .pipe(g.inject(es.merge(appFiles(opt), cssFiles(opt)), {
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
 * Filter an array of files according to file type
 * files: array of file names
 * ext: string file extension (js, css)
 */
function fileTypeFilter(files, ext) {
  var regExp = new RegExp('\\.' + ext + '$');
  return files.filter(regExp.test.bind(regExp));
}

/**
 * Concat, minify, rename, rev
 * ext: string file extension (js, css)
 * name: string file name (app, vendor, etc)
 */
function dist(name, ext) {
  return lazypipe()
    .pipe(g.concat, name + '.' + ext)
    .pipe(gulp.dest, './.tmp')
    .pipe(ext === 'js' ? g.uglify : g.minifyCss)
    .pipe(g.rename, name + '.min.' + ext)
    .pipe(gulp.dest, './.tmp')
    .pipe(g.rev)
    .pipe(gulp.dest, './dist/public')
    .pipe(g.rev.manifest)
    .pipe(gulp.dest, './.tmp/rev-' + name + '-' + ext)();
}

// Livereload (or noop if not run by watch)
function livereload() {
  return lazypipe().pipe(isWatching ? g.livereload : noop)();
}
