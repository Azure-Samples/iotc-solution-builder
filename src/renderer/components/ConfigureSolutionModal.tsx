import React, { ChangeEvent, FC, useState } from 'react';
import { Button, Modal, Form, Input } from 'semantic-ui-react';
import { ModalTypes, useGlobalModalContext } from './GlobalModal';

export interface IConfigureSolutionModalInfo {
    nameSuffix: string;
    location: string;
}

export const ConfigureSolutionModal: FC = (() => {
    const { hideModal, modalStore } = useGlobalModalContext();
    // const { modalProps } = modalStore || {};
    const {
        nameSuffix,
        location,
        onConfigureProjectCallback
    } = modalStore[ModalTypes.ConfigureSolutionModalDialog] || {};

    const [resourceNameSuffix, setResourceNameSuffix] = useState(nameSuffix || `iotcsb${Math.floor(Math.random() * 90000) + 10000}`);
    const [resourceLocation, setResourceLocation] = useState(location || 'westus2');

    const onCloseModal = () => {
        hideModal(ModalTypes.ConfigureSolutionModalDialog);
    };

    const onFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        switch (e.target.id) {
            case 'resourceNameSuffix':
                setResourceNameSuffix(e.target.value);
                break;
            case 'resourceLocation': {
                setResourceLocation(e.target.value);
                break;
            }
        }
    };

    const onConfigureProject = (_e: any) => {
        onConfigureProjectCallback({
            nameSuffix: resourceNameSuffix,
            location: resourceLocation
        });
    };

    return (
        <Modal
            size="small"
            open
            onClose={onCloseModal}
            closeOnDimmerClick={false}
        >
            <Modal.Header>Configure new solution</Modal.Header>
            <Modal.Content>
                <Form>
                    <Form.Field>
                        Specify the name suffix and resource location to use for resources created in your Azure subscription.
                    </Form.Field>
                    <Form.Field>
                        <label>Suffix</label>
                        <Input
                            id="resourceNameSuffix"
                            type="text"
                            value={resourceNameSuffix}
                            onChange={onFieldChange}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Location</label>
                        <Input
                            id="resourceLocation"
                            type="text"
                            value={resourceLocation}
                            onChange={onFieldChange}
                        />
                    </Form.Field>
                </Form>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={onCloseModal}>Cancel</Button>
                <Button color={'green'} onClick={onConfigureProject}>Configure</Button>
            </Modal.Actions>
        </Modal>
    );
});
