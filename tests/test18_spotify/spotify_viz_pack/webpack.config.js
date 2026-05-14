var path = require('path');

var vizNames = [
    'stream_kpi',
    'listening_heatmap',
    'genre_bars',
    'track_ranking',
    'artist_cards',
    'playlist_table',
    'audio_wave',
    'trend_spark'
];

var entries = {};
vizNames.forEach(function(name) {
    entries[name] = path.join(__dirname, 'appserver', 'static', 'visualizations', name, 'src', 'visualization_source.js');
});

module.exports = {
    mode: 'production',
    target: ['web', 'es5'],
    entry: entries,
    output: {
        path: path.join(__dirname, 'appserver', 'static', 'visualizations'),
        filename: '[name]/visualization.js',
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
