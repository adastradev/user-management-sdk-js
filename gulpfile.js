const gulp = require('gulp');
const snyk = require('gulp-snyk');

// Security related tasks/series'
function snykProtect(cb) {
  if (process.env.SNYK_TOKEN) {
    snyk({ command: 'protect' }, cb);
  } else {
    cb();
  }
}

function snykTest(cb) {
  if (process.env.SNYK_TOKEN) {
    snyk({ command: 'test' }, cb);
  } else {
    cb();
  }
}

// This is a gulp task, available by running "gulp secure"
exports.secure = gulp.series(snykProtect, snykTest);
