module.exports = {
    packagerConfig: {
        icon: './src/assets/icon',
        name: 'iotc-solution-builder'
    },
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'iotc-solution-builder'
            }
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: [
                'darwin',
                'linux'
            ]
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    icon: './src/assets/icon.png'
                }
            }
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {
                options: {
                    icon: './src/assets/icon.png'
                }
            }
        }
    ],
    plugins: [
        [
            '@electron-forge/plugin-webpack',
            {
                mainConfig: './webpackConfigs/webpack.main.config.js',
                devContentSecurityPolicy: `connect-src 'self' *.cloudflare.com azureiotcentral.com *.azureiotcentral.com 'unsafe-eval'; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:`,
                renderer: {
                    // nodeIntegration: true,
                    config: './webpackConfigs/webpack.renderer.config.js',
                    entryPoints: [
                        {
                            html: './src/renderer/index.html',
                            js: './src/renderer/index.tsx',
                            name: 'main_window',
                            preload: {
                                js: './src/main/contextBridge.js'
                            }
                        }
                    ]
                }
            }
        ]
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
              repository: {
                owner: 'iot-for-all',
                name: 'iotc-solution-builder',
              },
            }, 
        }
    ]
};
