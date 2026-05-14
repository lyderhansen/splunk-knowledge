var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var VIZS = [
    'countdown_timer',
    'telemetry_gauge',
    'fuel_gauge',
    'stage_tracker',
    'burn_tracker',
    'mission_kpi',
    'event_ticker'
];

var fontsCSS = fs.readFileSync(path.resolve(__dirname, 'src/shared/fonts.css'), 'utf8');

var configs = VIZS.map(function(viz) {
    var vizDir = path.resolve(__dirname, 'appserver/static/visualizations/' + viz);
    fs.writeFileSync(path.join(vizDir, 'visualization.css'), fontsCSS);

    return {
        name: viz,
        mode: 'production',
        target: ['web', 'es5'],
        entry: path.resolve(__dirname, 'src/' + viz + '/visualization_source.js'),
        output: {
            filename: 'visualization.js',
            path: vizDir,
            libraryTarget: 'amd',
            environment: {
                arrowFunction: false,
                bigIntLiteral: false,
                const: false,
                destructuring: false,
                forOf: false,
                dynamicImport: false,
                module: false
            }
        },
        resolve: {
            alias: {
                'shared': path.resolve(__dirname, 'src/shared')
            }
        },
        externals: ['api/SplunkVisualizationBase']
    };
});

webpack(configs, function(err, stats) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    var info = stats.toJson({ all: false, errors: true, warnings: true });
    if (info.errors && info.errors.length > 0) {
        info.errors.forEach(function(e) { console.error(e.message || e); });
        process.exit(1);
    }
    if (info.warnings && info.warnings.length > 0) {
        info.warnings.forEach(function(w) { console.warn('WARN:', w.message || w); });
    }
    console.log('Built ' + VIZS.length + ' visualizations successfully.');
    VIZS.forEach(function(viz) {
        var outFile = path.resolve(__dirname, 'appserver/static/visualizations/' + viz + '/visualization.js');
        var content = fs.readFileSync(outFile, 'utf8').substring(0, 100);
        var ok = content.indexOf('define(') >= 0;
        console.log('  ' + viz + ': ' + (ok ? 'OK (AMD)' : 'FAIL — not AMD!'));
    });
});
