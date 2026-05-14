var path = require('path');
var fs = require('fs');

var VIZ_ROOT = path.resolve(__dirname, '..', 'appserver', 'static', 'visualizations');

var vizNames = fs.readdirSync(VIZ_ROOT).filter(function (n) {
    var p = path.join(VIZ_ROOT, n);
    return fs.statSync(p).isDirectory() &&
           fs.existsSync(path.join(p, 'src', 'visualization_source.js'));
});

var entries = {};
vizNames.forEach(function (name) {
    entries[name] = path.join(VIZ_ROOT, name, 'src', 'visualization_source.js');
});

module.exports = {
    mode: 'production',
    target: ['web', 'es5'],
    entry: entries,
    output: {
        filename: '[name]/visualization.js',
        path: VIZ_ROOT,
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
    externals: ['api/SplunkVisualizationBase', 'api/SplunkVisualizationUtils'],
    resolve: {
        alias: {
            'shared': path.resolve(VIZ_ROOT, 'shared')
        },
        modules: [path.resolve(__dirname, 'node_modules')]
    }
};
