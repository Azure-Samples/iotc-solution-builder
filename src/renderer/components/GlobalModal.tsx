import React, { FC, ReactNode, useState, createContext, useContext } from 'react';
import { InfoModal } from './InfoModal';
import { ConfirmModal } from './ConfirmModal';
import { ConfigureSolutionModal } from './ConfigureSolutionModal';

export enum ModalTypes {
    InfoModalDialog = 'InfoModalDialog',
    ConfirmModalDialog = 'ConfirmModalDialog',
    ConfigureSolutionModalDialog = 'ConfigureSolutionModalDialog'
}

const ModalComponents: any = {
    [ModalTypes.InfoModalDialog]: InfoModal,
    [ModalTypes.ConfirmModalDialog]: ConfirmModal,
    [ModalTypes.ConfigureSolutionModalDialog]: ConfigureSolutionModal
};

interface IGlobalModalContext {
    showModal: (modalType: string, modalProps?: any) => void;
    hideModal: (modalType: string) => void;
    modalStore: any;
}

const initalState: IGlobalModalContext = {
    showModal: (_modalType: string, _modalProps?: any) => {
        return;
    },
    hideModal: () => {
        return;
    },
    modalStore: {}
};

const GlobalModalContext = createContext(initalState);
export const useGlobalModalContext = (): IGlobalModalContext => useContext(GlobalModalContext);

interface IGlobalModalProps {
    children?: ReactNode;
}

export const GlobalModal: FC<IGlobalModalProps> = (props: IGlobalModalProps) => {
    const {
        children
    } = props;

    const [modalStore, setModalStore] = useState({});

    const showModal = (showModalType: ModalTypes, showModalProps: any = {}) => {
        setModalStore({
            ...modalStore,
            [showModalType]: showModalProps
        });
    };

    const hideModal = (hideModalType: ModalTypes) => {
        const newStore: any = {};
        for (const modal in modalStore) {
            if (modal !== hideModalType) {
                newStore[modal] = (modalStore as any)[modal];
            }
        }

        setModalStore({
            ...newStore
        });
    };

    const renderComponents = () => {
        const components = [];

        for (const modal in modalStore) {
            if (!Object.prototype.hasOwnProperty.call(modalStore, modal)) {
                continue;
            }

            const ModalComponent = ModalComponents[modal];
            if ((modalStore as any)[modal]) {
                components.push(
                    <ModalComponent key={modal} {...(modalStore as any)[modal]} />
                );
            }
        }

        return components;
    };

    return (
        <GlobalModalContext.Provider value={{ modalStore, showModal, hideModal }}>
            {renderComponents()}
            {children}
        </GlobalModalContext.Provider>
    );
};
