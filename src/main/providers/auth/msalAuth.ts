import {
    BrowserWindow,
    IpcMain,
    IpcMainInvokeEvent
} from 'electron';
import * as contextBridgeTypes from '../../contextBridgeTypes';
import logger from '../../logger';
import { AppProvider } from '../appProvider';
import { cachePlugin } from './cachePlugin';
import { FileProtocolAuthorizationCodeListener } from './FileProtocolAuthorizationCodeListener';
import store, { StoreKeys } from '../../store';
import {
    UserProfileScope,
    IMsalConfig,
    AppProtocolId
} from '../../models/msalAuth';
import {
    PublicClientApplication,
    LogLevel,
    CryptoProvider,
    AccountInfo,
    AuthenticationResult,
    SilentFlowRequest
} from '@azure/msal-node';
import axios from 'axios';

const ModuleName = 'MsalAuthProvider';

const AuthCodeTimeout = 1000 * 60 * 2;

// Configuration object to be passed to MSAL instance on creation.
// For a full list of MSAL Node configuration parameters, visit:
// https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
// const MSAL_CONFIG: Configuration = {
//     auth: {
//         clientId: '<CLIENT_ID>',
//         authority: 'https://login.windows-ppe.net/common/'
//     },
//     cache: {
//         cachePlugin
//     },
//     system: {
//         loggerOptions: {
//             loggerCallback(_loglevel: any, message: any, _containsPii: any) {
//                 logger.log([ModuleName, 'info'], message);
//             },
//             piiLoggingEnabled: false,
//             logLevel: LogLevel.Info
//         }
//     }
// };

export class MsalAuthProvider extends AppProvider {
    private mainWindowEntry: string;
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;

    constructor(ipcMain: IpcMain, authWindow: BrowserWindow, mainWindowEntry: string) {
        super(ipcMain, authWindow);

        this.mainWindowEntry = mainWindowEntry;

        this.registerIpcEventHandlers();
    }

    public async initialize(): Promise<boolean> {
        logger.log([ModuleName, 'info'], `initialize`);

        let result = true;

        try {
            // Initialize a public client application. For more information, visit:
            // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
            this.clientApplication = new PublicClientApplication({
                auth: {
                    clientId: store.get(StoreKeys.clientId),
                    authority: store.get(StoreKeys.aadAuthority)
                },
                cache: {
                    cachePlugin
                },
                system: {
                    loggerOptions: {
                        loggerCallback(_loglevel: LogLevel, message: string, _containsPii: boolean) {
                            logger.log(['Azure/msal-node', 'info'], message);
                        },
                        piiLoggingEnabled: false,
                        logLevel: LogLevel.Verbose
                    }
                }
            });

            this.account = await this.signinSilent();
            if (this.account) {
                logger.log([ModuleName, 'info'], 'Successful silent account retrieval');
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `initialize error: ${ex.message}`);

            result = false;
        }

        return result;
    }

    public registerIpcEventHandlers(): void {
        //
        // Auth event handlers
        //
        this.ipcMain.handle(contextBridgeTypes.Ipc_GetLastOAuthError, async (_event: IpcMainInvokeEvent): Promise<string> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetLastOAuthError} handler`);

            return store.get(StoreKeys.lastOAuthError);
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_SetLastOAuthError, async (_event: IpcMainInvokeEvent, message: string): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SetLastOAuthError} handler`);

            store.set(StoreKeys.lastOAuthError, message);
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_SetMsalConfig, async (_event: IpcMainInvokeEvent, msalConfig: IMsalConfig): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SetMsalConfig} handler`);

            store.set(StoreKeys.clientId, msalConfig.clientId);
            store.set(StoreKeys.tenantId, msalConfig.tenantId);
            store.set(StoreKeys.subscriptionId, msalConfig.subscriptionId);
            store.set(StoreKeys.aadAuthority, msalConfig.aadAuthority);
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_GetMsalConfig, async (_event: IpcMainInvokeEvent): Promise<IMsalConfig> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetMsalConfig} handler`);

            return {
                clientId: store.get(StoreKeys.clientId),
                tenantId: store.get(StoreKeys.tenantId),
                subscriptionId: store.get(StoreKeys.subscriptionId),
                aadAuthority: store.get(StoreKeys.aadAuthority)
            };
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_Signin, async (_event: IpcMainInvokeEvent, redirectPath?: string): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_Signin} handler`);

            let accountInfo;

            try {
                // use a separate window for a pop-up login ui experience
                // const authWindow = this.createAuthWindow();

                // re-initialize the auth provider from the cache
                // in case the user has changed the Azure MSAL configuration
                await this.initialize();

                accountInfo = await this.signin();

                const mainEntryUrl = new URL(this.mainWindowEntry);

                if (redirectPath) {
                    mainEntryUrl.searchParams.set('redirectpath', redirectPath);
                }

                await this.authWindow.loadURL(mainEntryUrl.href);

                // authWindow.close();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_Signin} handler: ${ex.message}`);
            }

            return accountInfo;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_Signout, async (_event: IpcMainInvokeEvent): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_Signout} handler`);

            try {
                await this.signout();

                await this.authWindow.loadURL(this.mainWindowEntry);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_Signout} handler: ${ex.message}`);
            }
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_GetAccount, async (_event: IpcMainInvokeEvent): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetAccount} handler`);

            let account;

            try {
                account = this.getCurrentAccount();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetAccount} handler: ${ex.message}`);
            }

            return account;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_GetProfile, async (_event: IpcMainInvokeEvent): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetProfile} handler`);

            let graphResponse;

            try {
                const token = await this.getScopedToken(UserProfileScope);

                graphResponse = await this.callEndpointWithToken(`${store.get(StoreKeys.graphEndpointHost)}${store.get(StoreKeys.graphMeEndpoint)}`, token);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetProfile} handler: ${ex.message}`);
            }

            return graphResponse;
        });
    }

    public async signin(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `signin`);

        await this.getTokenInteractive(
            this.authWindow,
            {
                scopes: [UserProfileScope],
                redirectUri: `msal${AppProtocolId}://auth`
            }
        );

        return this.getAccount();
    }

    public async signinSilent(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `signinSilent`);

        return this.getAccount();
    }

    public async signout(): Promise<void> {
        logger.log([ModuleName, 'info'], `signout`);

        try {
            const account = await this.getAccount();
            if (account) {
                await this.clientApplication.getTokenCache().removeAccount(account);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during signout: ${ex.message}`);
        }
    }

    public async getCurrentAccount(): Promise<AccountInfo> {
        return this.getAccount();
    }

    public async getScopedToken(scope: string): Promise<string> {
        const account = await this.getAccount();
        const { accessToken: scopedAccessToken } = await this.getTokenSilent(
            this.authWindow,
            {
                account,
                forceRefresh: false,
                scopes: [scope]
            }
        );

        return scopedAccessToken;
    }

    public async callEndpointWithToken(graphEndpointUrl: string, token: string): Promise<any> {
        logger.log([ModuleName, 'info'], `callEndpointWithToken`);

        const response = {
            statusCode: 200,
            message: 'SUCCESS',
            payload: {}
        };

        try {
            const options = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const axiosResponse = await axios.get(graphEndpointUrl, options);

            response.statusCode = axiosResponse.status;
            response.message = axiosResponse.statusText;

            if ((axiosResponse.data as any)?.payload) {
                response.payload = (axiosResponse.data as any).payload;
            }
        }
        catch (ex) {
            if (ex.isAxiosError && ex.response) {
                response.statusCode = ex.response.statusCode;
                response.message = `An error occurred during the request: ${ex.response.status}`;
            }
            else {
                response.statusCode = 500;
                response.message = `An error occurred during the request: ${ex.message}`;
            }
        }

        return response;
    }

    public async reloadMainEntry(): Promise<void> {
        await this.authWindow.loadURL(this.mainWindowEntry);
    }

    private async getTokenSilent(authWindow: BrowserWindow, silentFlowTokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        logger.log([ModuleName, 'info'], `getTokenSilent`);

        let authenticationResult;

        try {
            authenticationResult = await this.clientApplication.acquireTokenSilent(silentFlowTokenRequest);
        }
        catch (ex) {
            logger.log([ModuleName, 'info'], `Silent token acquisition failed, acquiring token using pop up`);

            authenticationResult = null;
        }

        if (!authenticationResult) {
            try {
                authenticationResult = await this.getTokenInteractive(
                    authWindow,
                    {
                        scopes: silentFlowTokenRequest.scopes,
                        redirectUri: `msal${AppProtocolId}://auth`
                    }
                );

                await this.authWindow.loadURL(this.mainWindowEntry);
            }
            catch (ex) {
                logger.log([ModuleName, 'info'], `Silent token acquisition failed`);

                authenticationResult = null;
            }
        }

        return authenticationResult;
    }

    // This method contains an implementation of access token acquisition in authorization code flow
    private async getTokenInteractive(authWindow: BrowserWindow, tokenRequest: any): Promise<AuthenticationResult> {
        logger.log([ModuleName, 'info'], `getTokenInteractive`);

        store.set(StoreKeys.lastOAuthError, '');

        // Proof Key for Code Exchange (PKCE) Setup

        // MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge
        // and codeChallengeMethod parameters in the request passed into getAuthCodeUrl() API,
        // as well as the codeVerifier parameter in the second leg (acquireTokenByCode() API).

        // MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
        // the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
        // and challenge values should be generated previous to the authorization flow initiation.

        // For details on PKCE code generation logic, consult the
        // PKCE specification https://tools.ietf.org/html/rfc7636#section-4

        let authenticationResult;

        try {
            const cryptoProvider = new CryptoProvider();
            const { challenge, verifier } = await cryptoProvider.generatePkceCodes();

            // Get Auth Code URL
            const authCodeUrl = await this.clientApplication.getAuthCodeUrl({
                scopes: tokenRequest.scopes,
                redirectUri: tokenRequest.redirectUri,
                codeChallenge: challenge, // PKCE Code Challenge
                codeChallengeMethod: 'S256' // PKCE Code Challenge Method
            });

            const authCode = await this.listenForAuthorizationCode(authCodeUrl, authWindow);

            // Use Authorization Code and PKCE Code verifier to make token request
            // authenticationResult = await this.clientApplication.acquireTokenByCode({
            //     ...this.authAzureManagementCodeRequest,
            //     code: authCode,
            //     codeVerifier: verifier
            // });
            authenticationResult = await this.clientApplication.acquireTokenByCode({
                scopes: tokenRequest.scopes,
                redirectUri: tokenRequest.redirectUri,
                code: authCode,
                codeVerifier: verifier
            });
        }
        catch (ex) {
            store.set(StoreKeys.lastOAuthError, ex.message || 'The signin process timed out while waiting for an authorization code');

            logger.log([ModuleName, 'error'], `getTokenInteractive error: ${ex.message}`);

            authenticationResult = null;
        }

        return authenticationResult;
    }

    private async listenForAuthorizationCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        logger.log([ModuleName, 'info'], `listenForAuthorizationCode`);

        // Set up custom file protocol to listen for redirect response
        const authCodeListener = new FileProtocolAuthorizationCodeListener(`msal${AppProtocolId}`);


        await authWindow.loadURL(navigateUrl);
        const code = await authCodeListener.registerProtocolAndStartListening(AuthCodeTimeout);

        authCodeListener.unregisterProtocol();

        return code;
    }

    // Calls getAllAccounts and determines the correct account to sign into,
    // currently defaults to first account found in cache.
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
    private async getAccount(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `getAccount`);

        let accountResult;

        try {
            const cache = this.clientApplication.getTokenCache();
            const currentAccounts = await cache.getAllAccounts();

            if (currentAccounts === null) {
                logger.log([ModuleName, 'info'], 'No accounts detected');
            }
            else if (currentAccounts.length > 1) {
                // Our app is configured to a specific tenant - so we are only interested in the
                // cached account for the configured tenant

                const tenantId = store.get(StoreKeys.tenantId);
                logger.log([ModuleName, 'info'], `Multiple accounts detected, looking for cached account with tenantId: ${tenantId}`);

                accountResult = currentAccounts.find(account => account.tenantId === tenantId);
            }
            else if (currentAccounts.length === 1) {
                accountResult = currentAccounts[0];
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `getAccount error: ${ex.message}`);
        }

        return accountResult;
    }
}
