module.exports = function(config) {
    config.set({
        browsers: ['PhantomJS'],
        //browsers: ['Chrome'],
        frameworks: ['jasmine'],
        files: [
            'bower_components/angular/angular.min.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/JSCheck/jscheck.js',
            'src/**/*.js',
            '.tmp/templates.js',
            'spec/helpers/*.js',
            'spec/*.js'
        ],
        
        reporters: ['progress', 'coverage'],
        exclude: ['spec/jasmineBoot.js'],
        preprocessors: {
            'src/**/*.js': ['coverage']
        },
        
        coverageReporter: {
            dir: 'coverage/',
            reporters: [
                {type: 'html', subdir: 'report-html'},
                {type: 'lcov', subdir: 'report-lcov'},
                {type: 'text-summary'}
            ]
        },
        singleRun: true,
        //logLevel: config.LOG_DEBUG,
        colors: true
    });
};