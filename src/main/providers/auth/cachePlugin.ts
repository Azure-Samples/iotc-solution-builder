import { app } from 'electron';
import logger from '../../logger';
import { join as pathJoin } from 'path';
import * as fse from 'fs-extra';
import { TokenCacheContext } from '@azure/msal-node';

const ModuleName = 'cachePlugin';
const tokenCachePathname = pathJoin(app.getPath('appData'), app.getName(), 'msalTokenCache.json');

const beforeCacheAccess = async (cacheContext: TokenCacheContext): Promise<void> => {
    logger.log([ModuleName, 'info'], `beforeCacheAccess`);

    if (fse.pathExistsSync(tokenCachePathname)) {
        const data = await fse.readFile(tokenCachePathname, 'utf-8');

        cacheContext.tokenCache.deserialize(data);
    }
    else {
        fse.ensureDirSync(app.getPath('appData'));
        await fse.writeFile(tokenCachePathname, cacheContext.tokenCache.serialize());
    }
};

const afterCacheAccess = async (cacheContext: TokenCacheContext): Promise<void> => {
    logger.log([ModuleName, 'info'], `afterCacheAccess`);

    if (cacheContext.cacheHasChanged) {
        await fse.writeFile(tokenCachePathname, cacheContext.tokenCache.serialize());
    }
};

export const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess
};
