var path = require('path');

module.exports = {
    target: ['web', 'es5'],
    mode: 'production',
    entry: path.join(__dirname, 'src', 'visualization_source.js'),
    output: {
        filename: 'visualization.js',
        path: __dirname,
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
    externals: ['api/SplunkVisualizationBase'],
    resolve: {
        alias: {
            'shared': path.resolve(__dirname, '..', 'shared')
        }
    }
};
