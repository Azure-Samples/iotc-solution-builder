import React, { FC } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import { ModalTypes, useGlobalModalContext } from './GlobalModal';

export const InfoModal: FC = (() => {
    const { hideModal, modalStore } = useGlobalModalContext();
    // const { modalProps } = modalStore || {};
    const {
        title,
        description,
        onOkCallback
    } = modalStore[ModalTypes.InfoModalDialog] || {};

    const onOk = (_e: any) => {
        onOkCallback({
            confirm: true
        });
    };

    return (
        <Modal
            size="small"
            open
            onClose={() => hideModal(ModalTypes.InfoModalDialog)}
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
                <Button color={'green'} onClick={onOk}>OK</Button>
            </Modal.Actions>
        </Modal>
    );
});
