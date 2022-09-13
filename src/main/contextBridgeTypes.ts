/* eslint-disable max-len */
import { IpcRendererEvent } from 'electron';
import { AccountInfo } from '@azure/msal-node';
import {
    IIpcResult,
    ProvisioningState,
    IServiceError
} from './models/main';
import {
    IMsalConfig
} from '../main/models/msalAuth';
import {
    ISbSolution
} from './models/sbSolution';

// Main
const Ipc_Log = 'Ipc_Log';
const Ipc_OpenSolution = 'Ipc_OpenSolution';
const Ipc_SaveSolution = 'Ipc_SaveSolution';
const Ipc_StartProvisioning = 'Ipc_StartProvisioning';
const Ipc_ProvisioningState = 'Ipc_ProvisioningState';
const Ipc_ProvisionProgress = 'Ipc_ProvisionProgress';
const Ipc_StartProvisioningItem = 'Ipc_StartProvisioningItem';
const Ipc_SaveProvisioningOutputs = 'Ipc_SaveProvisioningOutputs';
const Ipc_EndProvisioning = 'Ipc_EndProvisioning';
const Ipc_OpenLink = 'Ipc_OpenLink';
const Ipc_ServiceError = 'Ipc_ServiceError';

// Auth
const Ipc_GetLastOAuthError = 'Ipc_GetLastOAuthError';
const Ipc_SetLastOAuthError = 'Ipc_SetLastOAuthError';
const Ipc_SetMsalConfig = 'Ipc_SetMsalConfig';
const Ipc_GetMsalConfig = 'Ipc_GetMsalConfig';
const Ipc_Signin = 'Ipc_Signin';
const Ipc_Signout = 'Ipc_Signout';
const Ipc_GetAccount = 'Ipc_GetAccount';
const Ipc_GetProfile = 'Ipc_GetProfile';

// IoT Central
const Ipc_RequestApi = 'Ipc_RequestApi';
const Ipc_GetIotcApps = 'Ipc_GetIotcApps';
const Ipc_GetIotcDevices = 'Ipc_GetIotcDevices';
const Ipc_GetIotcDeviceModules = 'Ipc_GetIotcDeviceModules';

// Misc.
const Ipc_ReceiveMessage = 'Ipc_ReceiveMessage';

declare global {
    interface Window {
        ipcApi: {
            // Main
            [Ipc_Log]: (tags: string[], message: string) => Promise<void>;
            [Ipc_OpenSolution]: (loadLastSolution: boolean) => Promise<IIpcResult>;
            [Ipc_SaveSolution]: (sbSolution: ISbSolution) => Promise<IIpcResult>;
            [Ipc_StartProvisioning]: (sbSolution: ISbSolution) => Promise<IIpcResult>;
            [Ipc_ProvisioningState]: () => Promise<ProvisioningState>;
            [Ipc_ProvisionProgress]: (channel: string, receiver: (event: IpcRendererEvent, message: string) => void) => void;
            [Ipc_StartProvisioningItem]: (channel: string, receiver: (event: IpcRendererEvent, itemId: string) => void) => void;
            [Ipc_SaveProvisioningOutputs]: (channel: string, receiver: (event: IpcRendererEvent, itemId: string, outputs: any) => void) => void;
            [Ipc_EndProvisioning]: (channel: string, receiver: (event: IpcRendererEvent) => void) => void;
            [Ipc_OpenLink]: (url: string) => Promise<void>;
            [Ipc_ServiceError]: (channel: string, receiver: (event: IpcRendererEvent, error: IServiceError) => void) => void;

            // Auth
            [Ipc_GetLastOAuthError]: () => Promise<string>;
            [Ipc_SetLastOAuthError]: (message: string) => Promise<void>;
            [Ipc_SetMsalConfig]: (msalConfig: IMsalConfig) => Promise<void>;
            [Ipc_GetMsalConfig]: () => Promise<IMsalConfig>;
            [Ipc_Signin]: (redirectPath: string) => Promise<AccountInfo>;
            [Ipc_Signout]: () => Promise<void>;
            [Ipc_GetAccount]: () => Promise<AccountInfo>;
            [Ipc_GetProfile]: (msalConfig: IMsalConfig) => Promise<any>;

            // Misc.
            [Ipc_ReceiveMessage]: (channel: string, receiver: (event: IpcRendererEvent, ...args: any[]) => void) => void;
        };
    }
}

export {
    Ipc_Log,
    Ipc_OpenSolution,
    Ipc_SaveSolution,
    Ipc_StartProvisioning,
    Ipc_ProvisioningState,
    Ipc_ProvisionProgress,
    Ipc_StartProvisioningItem,
    Ipc_SaveProvisioningOutputs,
    Ipc_EndProvisioning,
    Ipc_OpenLink,
    Ipc_ServiceError,
    Ipc_GetLastOAuthError,
    Ipc_SetLastOAuthError,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile,
    Ipc_RequestApi,
    Ipc_GetIotcApps,
    Ipc_GetIotcDevices,
    Ipc_GetIotcDeviceModules,
    Ipc_ReceiveMessage
};
