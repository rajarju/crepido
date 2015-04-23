// Load node modules.
var fs = require('fs');
var path = require('path');
var marked = require('marked');
var frontMatter = require('front-matter');

// Load Gulp plugins.
var gulp = require('gulp');
var data = require('gulp-data');
var webserver = require('gulp-webserver');
var swig = require('gulp-swig');
var sass = require('gulp-sass');

// Load config.
var crepido = require('./config');

// Custom renderer for Marked.
var markedRenderer = new marked.Renderer();

// Heading callback for renderer.
markedRenderer.heading = function(text, level) {
  var prefix = '<h' + level + '>';
  // Wrap in a div if h1
  if (level == 1) {
    prefix = '<div class="crepido__section__card">' + prefix;
  }
  return prefix + text + '</h' + level + '>';
}

// List callback for renderer.
markedRenderer.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';

  // Create labels.
  body = labelize(body);

  // Add a suffix. See markedRenderer.heading.
  var suffix = '</div>';

  return '<' + type + '>\n' + body + '</' + type + '>' + suffix + '\n';
}

// Gulp 'build' task
gulp.task('build', function() {
  gulp.src('./src/templates/index.html')
    .pipe(data(function() {
      return buildUsers();
    }))
    .pipe(swig())
    .pipe(gulp.dest('public'));
});

// Gulp 'sass' task
gulp.task('sass', function() {
  return gulp.src('src/assets/sass/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('public/assets/stylesheets'));
});

// Gulp 'assets' task
gulp.task('assets', ['sass']);

// Gulp 'webserver' task: setups the webserver and enable livereload.
gulp.task('webserver', function() {
  gulp.src('public')
    .pipe(webserver({
      livereload: true,
      open: true,
      port: 8000
    }));
});

// Gulp 'watch' task
gulp.task('watch', function () {
  gulp.watch(['src/assets/**/*'], ['assets']);
  gulp.watch(['users/**/*'], ['build']);
  gulp.watch(['src/templates/*'], ['build']);
});

// Gulp 'default' task.
gulp.task('default', ['assets', 'build', 'webserver', 'watch']);

// Builds users from ./users/*.md
function buildUsers() {
  crepido.users = [];

  // Get user files.
  var files = fs.readdirSync('./users', function(error, files) {
    if (error) { console.log(error); }
  });

  // Filter .md files.
  files.filter(function(file) { return file.substr(-3) === '.md'; })

  files.map(function(file) {
    var content = fs.readFileSync(path.resolve(__dirname, 'users', file), 'utf8');
    var data = frontMatter(content);
    data.body = marked(data.body, {
      renderer: markedRenderer
    });

    // Create a machine_name.
    data.attributes.machine_name = data.attributes.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Set a default avatar.
    data.attributes.avatar = data.attributes.avatar || crepido.avatar;
    crepido.users.push(data);
  });

  return crepido;
}

// Converts [string] to <span class="label">string</span>.
function labelize(string) {
  return string.replace(new RegExp("\\[(.*)\\]", "gi"), function($0, $1) {
    return '<span class="label">' + $1 + '</span>';
  });
}