/* eslint-disable @typescript-eslint/no-var-requires */
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
    new ForkTsCheckerWebpackPlugin(),
    new CopyPlugin({
        patterns: [
            {
                from: 'src/assets',
                to: 'assets',
                toType: 'dir',
                globOptions: {
                    ignore: ['__mocks__/**', 'index.ts']
                }
            }
        ]
    })
];
