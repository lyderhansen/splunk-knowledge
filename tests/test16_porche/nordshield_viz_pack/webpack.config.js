var path = require('path');

var vizNames = [
    'threat_beacon',
    'attack_heatmap',
    'host_shield_grid',
    'threat_feed',
    'ops_table',
    'defense_ranking'
];

var entries = {};
vizNames.forEach(function(name) {
    entries[name] = path.join(__dirname, 'appserver', 'static', 'visualizations', name, 'src', 'visualization_source.js');
});

module.exports = {
    mode: 'production',
    entry: entries,
    output: {
        path: path.join(__dirname, 'appserver', 'static', 'visualizations'),
        filename: '[name]/visualization.js',
        libraryTarget: 'amd'
    },
    resolve: {
        modules: [
            path.join(__dirname, 'shared'),
            'node_modules'
        ]
    },
    externals: {
        'api/SplunkVisualizationBase': 'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils': 'api/SplunkVisualizationUtils'
    }
};
