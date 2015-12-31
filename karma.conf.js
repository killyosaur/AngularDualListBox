module.exports = function(config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        files: [
            'bower_components/angular/angular.min.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'src/**/*.js',
            '.tmp/*.js',
            'spec/**/*.js'
        ],
        
        reporters: ['progress', 'coverage'],
        exclude: [],
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
        
        colors: true
    });
};