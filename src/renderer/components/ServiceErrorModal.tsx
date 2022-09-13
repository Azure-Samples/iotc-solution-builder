import React, { FC } from 'react';
import { Button, Modal } from 'semantic-ui-react';
import {
    IServiceError
} from '../../main/models/main';

interface IServiceErrorModalProps {
    serviceError: IServiceError;
    action?: string;
    onClose: () => void;
}

const ServiceErrorModal: FC<IServiceErrorModalProps> = (props: IServiceErrorModalProps) => {
    const {
        serviceError,
        action,
        onClose
    } = props;

    return (
        <Modal
            closeOnEscape={false}
            closeOnDimmerClick={false}
            open={serviceError.status < 200 || serviceError.status > 299}
        >
            <Modal.Header>{serviceError.title}</Modal.Header>
            <Modal.Content>
                <p>{serviceError.message}</p>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose()} positive>
                    {action || 'OK'}
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

export default ServiceErrorModal;
