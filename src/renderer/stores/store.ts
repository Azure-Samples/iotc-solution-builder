import { createContext, useContext } from 'react';
import { MainStore } from './main';
import { SessionStore } from './session';

export interface IStore {
    mainStore: MainStore;
    sessionStore: SessionStore;
}

export const store: IStore = {
    mainStore: new MainStore(),
    sessionStore: new SessionStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
