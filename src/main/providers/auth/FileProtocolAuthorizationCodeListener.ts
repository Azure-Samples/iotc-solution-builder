import logger from '../../logger';
import { AuthorizationCodeListener } from './authorizationCodeListener';
import { protocol } from 'electron';
import * as path from 'path';

const ModuleName = 'FileProtocolAuthorizationCodeListener';

// CustomFileProtocolListener registers and unregisters a custom file
// protocol on which MSAL can listen for Auth Code reponses.
export class FileProtocolAuthorizationCodeListener extends AuthorizationCodeListener {
    constructor(hostname: string) {
        super(hostname);
    }

    // Return an awaitable promise on the 'handler' called from the registerFileProtocol
    // function. The promise will be resolved with the detected authorization code
    // parameter on the supplied request url so that clients can wait on this. The supplied
    // 'callback' in registerFileProtocol's handler will also be called to supply the handler's
    // response.
    public async registerProtocolAndStartListening(timeout: number): Promise<string> {
        const timeoutPromise = new Promise<string>((_resolve, reject) => {
            setTimeout(reject, timeout, new Error('The signin process timed out while waiting for an authorization code'));
        });

        const codePromise = new Promise<string>((resolve, reject) => {
            protocol.registerFileProtocol(this.protocol, (req, callback): void => {
                const requestUrl = new URL(req.url);
                const authCode = requestUrl.searchParams.get('code');

                if (authCode) {
                    logger.log([ModuleName, 'info'], `returned from registerFileProtocol with authorization code`);

                    // exlicit return on callback below
                    resolve(authCode);
                }
                else {
                    const message = `${ModuleName} Error: returned from registerFileProtocol but url did not include an authoriztion code`;
                    logger.log([ModuleName, 'error'], message);

                    // exlicit return on callback below
                    reject(new Error(message));
                }

                return callback({
                    path: path.normalize(`${__dirname}/${requestUrl.pathname}`)
                });
            });
        });

        return Promise.race([timeoutPromise, codePromise]);
    }

    public unregisterProtocol(): void {
        protocol.unregisterProtocol(this.protocol);
    }
}
