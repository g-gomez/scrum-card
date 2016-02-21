'use strict';

var gulp        = require('gulp');
var sass        = require('gulp-sass');
var sourcemaps  = require('gulp-sourcemaps');
var babel       = require('gulp-babel');

gulp.task('sass', function () {
    return gulp.src('./sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./assets/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('js', function () {
    return gulp.src('js/app.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('assets/js'));
});

gulp.task('js:watch', function () {
    gulp.watch('./js/**/*.js', ['js']);
});

gulp.task('watch', ['sass:watch', 'js:watch']);

gulp.task('build', ['sass', 'js']);

gulp.task('default', ['build']);
