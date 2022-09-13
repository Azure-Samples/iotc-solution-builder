import { Ipc_Log } from '../../main/contextBridgeTypes';

export function log(tags: string[], message: string): void {
    void window.ipcApi[Ipc_Log](tags, message);
}
