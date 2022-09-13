/* eslint-disable max-len */
import {
    app as electronApp,
    shell,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    dialog,
    app
} from 'electron';
import logger from './logger';
import MenuBuilder from './menu';
import * as contextBridgeTypes from './contextBridgeTypes';
import store, { StoreKeys } from '../main/store';
import {
    IIpcResult,
    ProvisioningState,
    IAzureManagementApiResponse,
    IServiceResponse,
    serviceResponseSucceeded
} from './models/main';
import {
    SbConfigurationFileType,
    emptySolution,
    ISbDeploymentConfig,
    ISbSolution,
    ISbDeploymentContext,
    ISbDeploymentStepOutputs
} from './models/sbSolution';
import {
    AzureDataExplorerApiScope,
    AzureManagementScope, IoTCentralApiScope
} from '../main/models/msalAuth';
import {
    MsalAuthProvider
} from './providers/auth/msalAuth';
import {
    requestApi,
    sleep
} from './utils';
import {
    join as pathJoin,
    basename as pathBasename
} from 'path';
import { platform as osPlatform } from 'os';
import axios from 'axios';
import * as fse from 'fs-extra';
import _get from 'lodash.get';
import _template from 'lodash.template';
import {
    IotCentralBaseDomain,
    IotCentralRegionMap
} from './models/iotCentral';

const ModuleName = 'MainApp';

// Magic constants produced by Forge's webpack to locate the main entry and preload files.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// const maxWaitForIotRuntimeStartup = (60 * 5);

export class MainApp {
    private mainWindow: BrowserWindow = null;
    private authProvider: MsalAuthProvider = null;
    private mapDeploymentOutputs: Map<string, any> = new Map<string, any>();

    constructor() {
        this.registerEventHandlers();
    }

    public async initializeApp(): Promise<void> {
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_WEBPACK_ENTRY: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);

        // Create the main browser window
        this.createMainWindow();

        const menuBuilder = new MenuBuilder(this.mainWindow);
        menuBuilder.buildMenu();

        this.authProvider = new MsalAuthProvider(ipcMain, this.mainWindow, MAIN_WINDOW_WEBPACK_ENTRY);

        // initialize the auth provider from the cache for app startup
        await this.authProvider.initialize();

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            // this.mainWindow.webContents.openDevTools();
        });

        // and load the index.html of the app
        await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    public createMainWindow(): void {
        logger.log([ModuleName, 'info'], `createMainWindow`);

        this.mainWindow = new BrowserWindow({
            width: 1280,
            height: 768,
            show: false,
            icon: pathJoin(this.getAssetsPath(), osPlatform() === 'win32' ? 'icon.ico' : 'icons/64x64.png'),
            webPreferences: {
                // nodeIntegration: true,
                contextIsolation: true,
                preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
            }
        });

        this.mainWindow.webContents.on('will-redirect', (_event: Electron.Event, responseUrl: string) => {
            logger.log([ModuleName, 'info'], `will-redirect url found: ${responseUrl}`);
        });
    }

    private getAssetsPath(): string {
        return electronApp.isPackaged
            ? pathJoin(process.resourcesPath, 'assets')
            : pathJoin(__dirname, '../renderer/assets');
    }

    private registerEventHandlers(): void {
        ipcMain.handle(contextBridgeTypes.Ipc_Log, this.log.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_OpenSolution, this.openSolution.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_SaveSolution, this.saveSolution.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_StartProvisioning, this.startProvisioning.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_ProvisioningState, this.provisioningState.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_OpenLink, this.openLink.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_RequestApi, this.internalApiRequest.bind(this));
    }

    private async log(_event: IpcMainInvokeEvent, tags: string[], message: string): Promise<void> {
        logger.log(tags, message);
    }

    private async openSolution(_event: IpcMainInvokeEvent, loadLastConfiguration: boolean): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenSolution} handler`);

        const result: IIpcResult = {
            result: true,
            message: '',
            payload: emptySolution
        };

        try {
            if (loadLastConfiguration) {
                const lastConfigurationPath = store.get(StoreKeys.lastConfiguration);
                if (lastConfigurationPath) {
                    const lastConfigurationResult = fse.readJsonSync(lastConfigurationPath);

                    result.payload = lastConfigurationResult || emptySolution;
                }

                return result;
            }

            const openFileResult = await dialog.showOpenDialog(this.mainWindow, {
                title: 'Open IoT Central configuration',
                defaultPath: app.getPath('home'),
                buttonLabel: 'Open config',
                properties: ['openFile']
            });

            const configFilePath = openFileResult.canceled ? '' : openFileResult.filePaths[0];
            if (configFilePath) {
                // Configurations are copied to the electron local storage directory
                // and modified there. Opening a new configuration file will replace
                // the cached/last-opened configuration file.
                const configurationResult = fse.readJSONSync(configFilePath);

                // Configuration files are just pure JSON files. Look for the magic
                // GUID identifier to help ensure this is actually a compatible file.
                if (!configurationResult?.fileType || configurationResult.fileType !== SbConfigurationFileType) {
                    result.result = false;
                    result.message = `Error: the selected file was either malformed or was not an Solution Builder configuration file.`;
                    result.payload = emptySolution;

                    logger.log([ModuleName, 'error'], result.message);
                }
                else {
                    const destinationCachePath = pathJoin(app.getPath('appData'), app.getName(), 'sbConfigurationCache');
                    fse.ensureDirSync(destinationCachePath);

                    const destinationConfigFilePath = pathJoin(destinationCachePath, pathBasename(configFilePath));
                    fse.copyFileSync(configFilePath, destinationConfigFilePath);

                    store.set(StoreKeys.lastConfiguration, destinationConfigFilePath);
                    store.set(StoreKeys.provisioningState, false);

                    result.payload = configurationResult;
                }
            }
        }
        catch (ex) {
            result.result = false;
            result.message = `Error in ipcMain ${contextBridgeTypes.Ipc_OpenSolution} handler: ${ex.message}`;
            result.payload = emptySolution;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async saveSolution(_event: IpcMainInvokeEvent, solution: ISbSolution): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `saveConfiguration`);

        const result: IIpcResult = {
            result: true,
            message: 'Succeeded'
        };

        try {
            const configFilePath = store.get(StoreKeys.lastConfiguration);

            if (configFilePath) {
                fse.writeJSONSync(configFilePath, solution);
            }
        }
        catch (ex) {
            result.result = false;
            result.message = `Error saving configuration file: ${ex.message}`;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async startProvisioning(_event: IpcMainInvokeEvent, solution: ISbSolution): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `startProvisioning`);

        const result: IIpcResult = {
            result: true,
            message: ''
        };

        try {
            // use each of our API scopes to fetch an access token, this will serve
            // to clear any user consent screens that need to be satisfied.
            const azureDataExplorerApiScopeTemplate = _template(AzureDataExplorerApiScope);
            const azureDataExplorerApiScope = azureDataExplorerApiScopeTemplate({
                clusterName: `adx${solution.resourceNameSuffix}`,
                location: solution.resourceLocation
            });

            const apiScopes = [
                AzureManagementScope,
                IoTCentralApiScope,
                azureDataExplorerApiScope
            ];

            for (const apiScope of apiScopes) {
                const accessToken = await this.authProvider.getScopedToken(apiScope);
                if (!accessToken) {
                    result.result = false;
                    result.message = `Could not retrieve a valid authentication token`;

                    logger.log([ModuleName, 'error'], result.message);
                }
            }

            await this.authProvider.reloadMainEntry();

            void this.doProvisioning(solution);

            result.message = 'Provisioning started';
        }
        catch (ex) {
            result.result = false;
            result.message = `Error while fetching user consent: ${ex.message}`;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async provisioningState(_event: IpcMainInvokeEvent): Promise<ProvisioningState> {
        logger.log([ModuleName, 'info'], `provisioningState`);

        return store.get(StoreKeys.provisioningState) ? ProvisioningState.Active : ProvisioningState.Inactive;
    }

    private async doProvisioning(solution: ISbSolution): Promise<void> {
        logger.log([ModuleName, 'info'], `Starting doProvisioning loop...`);

        let response: IServiceResponse = {
            status: 200,
            message: ''
        };

        try {
            store.set(StoreKeys.provisioningState, true);

            this.mapDeploymentOutputs.clear();

            const context: ISbDeploymentContext = {
                solution,
                executeApi: this.executeApi.bind(this),
                showProgress: this.showProgress.bind(this),
                parameters: {
                    context: {
                        subscriptionId: store.get(StoreKeys.subscriptionId),
                        resourceNameSuffix: solution.resourceNameSuffix,
                        resourceLocation: solution.resourceLocation,
                        iotCentralBaseDomain: IotCentralBaseDomain,
                        mappedResourceGroupRegion: IotCentralRegionMap[solution.resourceLocation]
                    }
                }
            };

            for (const configItem of solution.deploymentConfigs) {
                try {
                    this.mainWindow.webContents.send(contextBridgeTypes.Ipc_StartProvisioningItem, configItem.id);
                    await this.showProgress('Provisioning...');

                    logger.log([ModuleName, 'info'], `Processing step: ${configItem.name}`);

                    response = await this.executeDeploymentStep(configItem, context);
                }
                catch (ex) {
                    response.status = 500;
                    response.message = `Error during provisioning step - ${configItem.name}: ${ex.message}`;

                    logger.log([ModuleName, 'error'], response.message);
                }
                finally {
                    await this.showProgress('Provisioning step finished');

                    this.mainWindow.webContents.send(contextBridgeTypes.Ipc_EndProvisioning);
                }

                if (!serviceResponseSucceeded(response)) {
                    this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ServiceError, {
                        status: response.status,
                        title: configItem.itemStep,
                        message: response.message
                    });

                    break;
                }
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error in deployment step: ${ex.message}`);
        }
        finally {
            store.set(StoreKeys.provisioningState, false);

            logger.log([ModuleName, 'info'], `Leaving doProvisioning loop...`);
        }
    }

    private async openLink(_event: IpcMainInvokeEvent, url: string): Promise<void> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenLink} handler`);

        void shell.openExternal(url);
    }

    private async showProgress(message: string, noWait?: boolean): Promise<void> {
        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, message);

        if (!noWait) {
            await sleep(1000);
        }
    }

    private computeParameters(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext): void {
        logger.log([ModuleName, 'info'], `computeParameters`);

        const configItemParameters: any = {};

        try {
            for (const parameterName in deploymentConfig.parameters) {
                if (!Object.prototype.hasOwnProperty.call(deploymentConfig.parameters, parameterName)) {
                    continue;
                }

                configItemParameters[parameterName] = this.computeParameter(deploymentConfig.parameters, parameterName, context);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error computing parameters for configuration item: ${ex.message}`);
        }

        context.parameters[deploymentConfig.itemStep] = configItemParameters;
    }

    private computeParameter(apiParameters: any, parameterName: string, context: ISbDeploymentContext): any {
        let parameterValue;

        const parameterValueElements = apiParameters[parameterName];

        if (Array.isArray(parameterValueElements)) {
            const computedValueElements = [];

            for (const item of parameterValueElements) {
                if (!Array.isArray(item)) {
                    computedValueElements.push(item);
                }
                else {
                    const itemValue = _get(context.parameters, item[0]);
                    if (!itemValue) {
                        logger.log([ModuleName, 'error'], `Item parameter doesn't compute for property ${parameterName}: ${item[0]}`);
                    }

                    computedValueElements.push(itemValue || '');
                }
            }

            parameterValue = computedValueElements.join('');
        }
        else {
            parameterValue = parameterValueElements;
        }

        return parameterValue;
    }

    private transformApiConfig(apiConfig: any, apiParameters: any, context: ISbDeploymentContext): any {
        const templateParameters: any = {};

        for (const parameterName in apiParameters) {
            if (!Object.prototype.hasOwnProperty.call(apiParameters, parameterName)) {
                continue;
            }

            templateParameters[parameterName] = this.computeParameter(apiParameters, parameterName, context);
        }

        const apiConfigTemplate = _template(JSON.stringify(apiConfig));
        const apiConfigData = apiConfigTemplate(templateParameters);

        return JSON.parse(apiConfigData);
    }

    private async executeDeploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext): Promise<IServiceResponse> {
        logger.log([ModuleName, 'info'], `executeDeploymentStep for config item type: ${deploymentConfig.itemStep}`);

        let response: IServiceResponse = {
            status: 200,
            message: ''
        };

        try {
            this.computeParameters(deploymentConfig, context);

            let apiConfig;
            let lroApiConfig;

            if (deploymentConfig.api) {
                apiConfig = this.transformApiConfig(deploymentConfig.api.config, deploymentConfig.parameters, context);
            }

            if (deploymentConfig.lroApi) {
                lroApiConfig = this.transformApiConfig(deploymentConfig.lroApi.config, deploymentConfig.parameters, context);
            }

            let deploymentStepModule;

            try {
                deploymentStepModule = await import(`./deploymentSteps/${deploymentConfig.itemStep}`);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Deployment step module '${deploymentConfig.itemStep}' not found, loading generic step module`);

                deploymentStepModule = await import(`./deploymentSteps/genericStep`);
            }

            if (deploymentStepModule) {
                response = await deploymentStepModule.deploymentStep(deploymentConfig, context, apiConfig, lroApiConfig);
            }

            const outputs = {
                status: response.status,
                message: response.message,
                ...(serviceResponseSucceeded(response) && {
                    parameters: context.parameters[deploymentConfig.itemStep]
                })
            };

            await this.saveDeploymentStepOutputs(deploymentConfig, outputs);
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error in deployment step: ${ex.message}`);
        }

        return response;
    }

    private async saveDeploymentStepOutputs(deploymentConfig: ISbDeploymentConfig, outputs: ISbDeploymentStepOutputs): Promise<void> {
        this.mapDeploymentOutputs.set(deploymentConfig.itemStep, outputs);

        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_SaveProvisioningOutputs, deploymentConfig.id, outputs);
    }

    private async executeApi(apiConfig: any, apiAuthScope: string): Promise<IServiceResponse> {
        let response: IServiceResponse = {
            status: 200,
            message: ''
        };

        const accessToken = await this.authProvider.getScopedToken(apiAuthScope);
        if (!accessToken) {
            response.status = 401;
            response.message = `Could not retrieve a valid authentication token`;

            logger.log([ModuleName, 'error'], response.message);

            return response;
        }

        const apiConfigWithAuthToken = {
            ...apiConfig,
            headers: {
                ...apiConfig.headers,
                Authorization: `Bearer ${accessToken}`
            }
        };

        if (apiAuthScope === AzureManagementScope) {
            response = await this.executeAzureResourceApiRequest(apiConfigWithAuthToken);
        }
        else {
            response = await this.azureApiRequest(apiConfigWithAuthToken);
        }

        return response;
    }

    private async executeAzureResourceApiRequest(apiConfig: any): Promise<IServiceResponse> {
        const mainResponse = await this.azureApiRequest(apiConfig);
        if (!serviceResponseSucceeded(mainResponse)) {
            logger.log([ModuleName, 'error'], `Error during provisioning step: ${mainResponse.message}`);

            return mainResponse;
        }

        logger.log([ModuleName, 'info'], `Request succeeded - checking for long running operation status...`);

        const lroResponse = await this.waitForOperationWithStatus(mainResponse.headers);
        if (!serviceResponseSucceeded(lroResponse)) {
            logger.log([ModuleName, 'warning'], `Long running operation status returned an error - ${lroResponse.status}:${lroResponse.message}`);

            mainResponse.status = lroResponse.status;
            mainResponse.message = lroResponse.message;
        }

        return mainResponse;
    }

    private async waitForOperationWithStatus(operationHeaders: any): Promise<IServiceResponse> {
        logger.log([ModuleName, 'info'], `waitForOperationWithStatus`);

        let response: IAzureManagementApiResponse = {
            status: 200,
            message: ''
        };

        try {
            const managementUrl = operationHeaders['azure-asyncoperation'] || operationHeaders['location'] || '';
            const retryAfter = operationHeaders['retry-after'] || 5;

            if (!managementUrl) {
                // not an error
                return response;
            }

            do {
                const accessToken = await this.authProvider.getScopedToken(AzureManagementScope);
                response = await this.azureApiRequest({
                    method: 'get',
                    url: managementUrl,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                logger.log([ModuleName, 'info'], `Operation status is code: ${response.status}, status: ${response?.payload?.status || 'unknown'}`);

                if (response?.payload?.status === 'Accepted') {
                    await sleep(1000 * retryAfter);
                    continue;
                }

                if ((response.status !== 200 && response.status !== 202) || response?.payload?.status !== 'Running') {
                    break;
                }

                await this.showProgress(response.payload.status ? `Resource deployment status: ${response.payload.status}` : 'Provisioning...');

                await sleep(1000 * retryAfter);
            } while (response.status === 200 || response.status === 202);

            response.message = response?.payload?.status || 'Succeeded';
            if (response.message !== 'Succeeded') {
                response.status = 500;
            }
        }
        catch (ex) {
            response.status = 500;
            response.message = `An error occurred while waiting for provisioning to complete ${ex.message}`;
        }

        return response;
    }

    private async azureApiRequest(config: any): Promise<IAzureManagementApiResponse> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_RequestApi} handler`);

        const apiResponse: IAzureManagementApiResponse = {
            status: 200,
            message: '',
            headers: []
        };

        try {
            const axiosResponse = await axios.request(config);

            apiResponse.headers = axiosResponse.headers;

            apiResponse.status = axiosResponse.status;
            apiResponse.message = axiosResponse.statusText || `${axiosResponse.status} `;

            if (axiosResponse.data) {
                apiResponse.payload = axiosResponse.data;
            }

            logger.log([ModuleName, apiResponse.status > 299 ? 'error' : 'info'], `requestApi: status: ${apiResponse.status} `);
        }
        catch (ex) {
            if (ex.isAxiosError && ex.response) {
                apiResponse.status = ex.response.status;
                apiResponse.message = ex.response?.data?.error?.message || `An error occurred during the request: ${ex.response.status} `;
            }
            else {
                apiResponse.status = 500;
                apiResponse.message = `An error occurred during the request: ${ex.message} `;
            }
        }

        return apiResponse;
    }

    private async internalApiRequest(_event: IpcMainInvokeEvent, config: any): Promise<any> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_RequestApi} handler`);

        let response;

        try {
            response = await requestApi(config);
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_RequestApi} handler: ${ex.message} `);
        }

        return response;
    }

    // private createAuthWindow(): BrowserWindow {
    //     logger.log([ModuleName, 'info'], `createAuthWindow`);

    //     const window = new BrowserWindow({
    //         width: 400,
    //         height: 600
    //     });

    //     window.on('closed', () => {
    //         logger.log([ModuleName, 'info'], `Main window received 'close'`);

    //         this.mainWindow = null;
    //     });

    //     return window;
    // }
}
