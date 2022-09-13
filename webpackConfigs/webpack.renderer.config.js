/* eslint-disable @typescript-eslint/no-var-requires */
const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

const devConfig = (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true');

rules.push({
    test: /\.css$/,
    use: [
        {
            loader: 'style-loader'
        },
        {
            loader: 'css-loader'
        }
    ],
});

module.exports = {
    mode: devConfig ? 'development' : 'production',
    devtool: devConfig ? 'eval-source-map' : 'source-map',
    module: {
        rules,
    },
    plugins: plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    },
    optimization: {
        minimize: !devConfig
    },
    performance: {
        maxAssetSize: 650000
    }
};
