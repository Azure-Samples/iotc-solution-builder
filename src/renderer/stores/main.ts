import { IpcRendererEvent } from 'electron';
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIpcResult,
    ProvisioningState,
    IServiceError,
    emptyServiceError
} from '../../main/models/main';
import {
    ISbSolution,
    emptySolution,
    SbAzureResourceType
} from '../../main/models/sbSolution';

export enum AuthenticationState {
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
    Authenticating = 'Authenticating',
    CouldNotAuthenticate = 'CouldNotAuthenticate'
}

export class MainStore {
    constructor() {
        makeAutoObservable(this);

        this.mapItemTypeToImageName.set(SbAzureResourceType.ResourceGroup, 'resourcegroup.png');
        this.mapItemTypeToImageName.set(SbAzureResourceType.IoTCentral, 'iotcentral.png');
        this.mapItemTypeToImageName.set(SbAzureResourceType.VirtualMachine, 'vm.png');
        this.mapItemTypeToImageName.set(SbAzureResourceType.AzureDataExplorer, 'adx.png');
        this.mapItemTypeToImageName.set(SbAzureResourceType.IoTEdge, 'iotedge.png');
        this.mapItemTypeToImageName.set(SbAzureResourceType.ArcServer, 'arcserver.png');

        window.ipcApi[contextBridgeTypes.Ipc_ProvisionProgress](contextBridgeTypes.Ipc_ProvisionProgress, this.onProvisionProgress.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_StartProvisioningItem](contextBridgeTypes.Ipc_StartProvisioningItem, this.onStartProvisioningItem.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_SaveProvisioningOutputs](contextBridgeTypes.Ipc_SaveProvisioningOutputs, this.onSaveProvisioningOutputs.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_EndProvisioning](contextBridgeTypes.Ipc_EndProvisioning, this.onEndProvisioning.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_ServiceError](contextBridgeTypes.Ipc_ServiceError, this.onServiceError.bind(this));
    }

    public sbSolution: ISbSolution = emptySolution;
    public openConfirmationModal = false;
    public serviceError: IServiceError = emptyServiceError;
    public mapItemTypeToImageName: Map<SbAzureResourceType, string> = new Map<SbAzureResourceType, string>();
    public provisioningState = ProvisioningState.Inactive;
    public deployingItemId = '';
    public provisionProgressLabel = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public setSolutionConfiguration(nameSuffix: string, location: string): void {
        runInAction(() => {
            this.sbSolution.resourceNameSuffix = nameSuffix;
            this.sbSolution.resourceLocation = location;
        });
    }

    public clearServiceError(): void {
        runInAction(() => {
            this.serviceError = emptyServiceError;
        });
    }

    public setServiceError(error: IServiceError): void {
        runInAction(() => {
            this.serviceError = error;
        });
    }

    public async openSolution(loadLastSolution: boolean): Promise<IIpcResult> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_OpenSolution](loadLastSolution);
        if (response && response.result && response.payload) {
            runInAction(() => {
                this.sbSolution = response.payload;
            });
        }

        return response || {
            result: false,
            message: 'An unknown error occurred while trying to open a new configuration file.'
        };
    }

    public async startProvisioning(): Promise<IIpcResult> {
        runInAction(() => {
            this.provisioningState = ProvisioningState.Active;
        });

        const response = await window.ipcApi[contextBridgeTypes.Ipc_StartProvisioning](toJS(this.sbSolution));

        return response || {
            result: false,
            message: 'An unknown error occurred during the provisioning process.'
        };
    }

    public async getProvisioningState(): Promise<ProvisioningState> {
        return window.ipcApi[contextBridgeTypes.Ipc_ProvisioningState]();
    }

    public async openLink(url: string): Promise<void> {
        void window.ipcApi[contextBridgeTypes.Ipc_OpenLink](url);
    }

    private onStartProvisioningItem(_event: IpcRendererEvent, itemId: string): void {
        runInAction(() => {
            this.deployingItemId = itemId;
            this.provisionProgressLabel = '';
        });
    }

    private onSaveProvisioningOutputs(_event: IpcRendererEvent, itemId: string, outputs: any): void {
        runInAction(() => {
            const configItem = this.sbSolution.deploymentConfigs.find(deploymentConfig => deploymentConfig.id === itemId);
            if (configItem) {
                configItem.outputs = outputs;
            }
        });

        void window.ipcApi[contextBridgeTypes.Ipc_SaveSolution](toJS(this.sbSolution));
    }

    private onProvisionProgress(_event: IpcRendererEvent, message: string): void {
        runInAction(() => {
            this.provisionProgressLabel = message;
        });
    }

    private onEndProvisioning(_event: IpcRendererEvent): void {
        runInAction(() => {
            this.provisioningState = ProvisioningState.Inactive;
            this.deployingItemId = '';
            this.provisionProgressLabel = '';
        });
    }

    private onServiceError(_event: IpcRendererEvent, error: IServiceError): void {
        runInAction(() => {
            this.serviceError = error;
        });
    }
}
