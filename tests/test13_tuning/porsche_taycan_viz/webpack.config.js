var path = require('path');

var vizDir = path.join(__dirname, 'appserver', 'static', 'visualizations');
var vizNames = [
    'battery_gauge', 'range_kpi', 'charge_gauge',
    'thermal_table', 'energy_area', 'regen_donut'
];

var entries = {};
vizNames.forEach(function(name) {
    entries[name] = path.join(vizDir, name, 'src', 'visualization_source.js');
});

module.exports = {
    mode: 'production',
    target: ['web', 'es5'],
    entry: entries,
    output: {
        filename: '[name]/visualization.js',
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
    externals: ['api/SplunkVisualizationBase', 'api/SplunkVisualizationUtils'],
    resolve: {
        alias: {
            'shared': path.join(vizDir, 'shared')
        }
    }
};
