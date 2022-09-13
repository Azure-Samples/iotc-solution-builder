import { IServiceResponse } from '../models/main';

export const SbConfigurationFileType = '2cb82afd-08e2-4cc6-ba9e-a37afa4b7175';

export enum SbAzureApiType {
    AzureArmResource = 'AzureArmResource',
    IoTCentralApi = 'IoTCentralApi',
    AzureDataExplorerApi = 'AzureDataExplorerApi'
}

export enum SbAzureResourceType {
    ResourceGroup = 'ResourceGroup',
    IoTCentral = 'IoTCentral',
    VirtualMachine = 'VirtualMachine',
    IoTEdge = 'IoTEdge',
    AzureDataExplorer = 'AzureDataExplorer',
    ArcServer = 'ArcServer'
}

export interface ISbDeploymentConfigApi {
    method: string;
    url: string;
    data: any;
}

export interface ISbDeploymentApiConfig {
    apiAuthScope: string;
    config: ISbDeploymentConfigApi;
}

export interface ISbDeploymentStepOutputs {
    status: number;
    message: string;
    parameters?: any;
}

export interface ISbDeploymentConfig {
    id: string;
    name: string;
    description: string;
    itemType: SbAzureResourceType;
    itemStep: string;
    module?: string;
    pauseStep?: number;
    docLink: string;
    api: ISbDeploymentApiConfig;
    lroApi?: ISbDeploymentApiConfig;
    parameters: any;
    outputs: ISbDeploymentStepOutputs;
}

export interface ISbSolution {
    fileType: string;
    name: string;
    id: string;
    resourceNameSuffix: string;
    resourceLocation: string;
    deploymentConfigs: ISbDeploymentConfig[];
}

export const emptySolution: ISbSolution = {
    fileType: SbConfigurationFileType,
    name: '',
    id: '',
    resourceNameSuffix: '',
    resourceLocation: '',
    deploymentConfigs: []
};

export interface ISbDeploymentContext {
    solution: ISbSolution;
    executeApi(apiConfig: any, apiAuthScope: string): Promise<IServiceResponse>;
    showProgress(message: string, noWait?: boolean): Promise<void>;
    parameters: any;
}
