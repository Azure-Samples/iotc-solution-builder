const path = require('path');

const devConfig = (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true');

module.exports = {
    mode: devConfig ? 'development' : 'production',
    devtool: 'source-map',
    entry: './src/main/main.ts',
    module: {
        rules: require('./webpack.rules')
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
    },
    optimization: {
        minimize: !devConfig
    },
    performance: {
        maxAssetSize: 650000
    }
};
