import React, { FC } from 'react';
import { Button, Modal, Form } from 'semantic-ui-react';
import { ModalTypes, useGlobalModalContext } from './GlobalModal';

export interface IConfirmModalInfo {
    confirm: boolean;
}

export const ConfirmModal: FC = (() => {
    const { hideModal, modalStore } = useGlobalModalContext();
    // const { modalProps } = modalStore || {};
    const {
        title,
        description,
        action,
        onConfirmCallback,
        onCancelCallback
    } = modalStore[ModalTypes.ConfirmModalDialog] || {};

    const onConfirm = () => {
        onConfirmCallback({
            confirm: true
        });
    };

    const onCancel = () => {
        hideModal(ModalTypes.ConfirmModalDialog);

        if (onCancelCallback) {
            onCancelCallback();
        }
    };

    return (
        <Modal
            size="small"
            open
            onClose={onCancel}
            closeOnDimmerClick={false}
        >
            <Modal.Header>{title}</Modal.Header>
            <Modal.Content>
                <Form>
                    <Form.Field>
                        {description}
                    </Form.Field>
                </Form>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button color={'green'} onClick={onConfirm}>{action}</Button>
            </Modal.Actions>
        </Modal>
    );
});
