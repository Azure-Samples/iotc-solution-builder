import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Grid, Message } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import SbConfigurationPanel from './SbConfigurationPanel';
import {
    useGlobalModalContext,
    ModalTypes
} from '../../components/GlobalModal';
import { IConfigureSolutionModalInfo } from '../../components/ConfigureSolutionModal';
import { IConfirmModalInfo } from '../../components/ConfirmModal';
import { ProvisioningState } from '../../../main/models/main';

const SbConfigurationPage: FC = observer(() => {
    const {
        mainStore,
        sessionStore
    } = useStore();
    const {
        showModal,
        hideModal
    } = useGlobalModalContext();

    useAsyncEffect(
        async isMounted => {
            const result = await mainStore.openSolution(true);

            if (!isMounted()) {
                return;
            }

            if (!result.result) {
                showModal(ModalTypes.InfoModalDialog, {
                    title: 'Error',
                    description: result.message,
                    onOkCallback: () => {
                        hideModal(ModalTypes.InfoModalDialog);
                    }
                });
            }
        },
        []
    );

    const onOpenConfiguration = async (): Promise<void> => {
        const result = await mainStore.openSolution(false);
        if (!result.result && result.message) {
            showModal(ModalTypes.InfoModalDialog, {
                title: 'Error',
                description: result.message,
                onOkCallback: () => {
                    hideModal(ModalTypes.InfoModalDialog);
                }
            });
        }
    };

    const onStartProvisioning = async (): Promise<void> => {
        const currentState = await mainStore.getProvisioningState();
        let startProvisioning = currentState !== ProvisioningState.Active;

        if (!startProvisioning) {
            await new Promise((resolve) => {
                showModal(ModalTypes.ConfirmModalDialog, {
                    title: 'Start Provisioning',
                    description: 'An existing provision session was active. Are you sure you want to restart provisioning?',
                    action: 'Continue',
                    onConfirmCallback: async (confirmModalInfo: IConfirmModalInfo): Promise<void> => {
                        hideModal(ModalTypes.ConfirmModalDialog);

                        startProvisioning = confirmModalInfo.confirm;

                        return resolve('');
                    },
                    onCancelCallback: (): void => {
                        return resolve('');
                    }
                });
            });
        }

        if (startProvisioning) {
            showModal(ModalTypes.ConfigureSolutionModalDialog, {
                nameSuffix: mainStore.sbSolution.resourceNameSuffix,
                location: mainStore.sbSolution.resourceLocation,
                onConfigureProjectCallback: (configureSolutionModelInfo: IConfigureSolutionModalInfo) => {
                    mainStore.setSolutionConfiguration(configureSolutionModelInfo.nameSuffix, configureSolutionModelInfo.location);

                    hideModal(ModalTypes.ConfigureSolutionModalDialog);

                    void mainStore.startProvisioning();
                }
            });
        }
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size='large'>
                        <Message.Header>
                            {mainStore.sbSolution.name}
                        </Message.Header>
                        <p>
                            {
                                (mainStore.sbSolution.deploymentConfigs?.length || 0) === 0
                                    ? 'IoT Central Solution Builder'
                                    : null
                            }
                        </p>
                    </Message>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button floated='left' size='small' color='green' onClick={onStartProvisioning}>Start Provisioning</Button>
                    <Button floated='left' size='small' color='green' onClick={onOpenConfiguration}>Open Configuration</Button>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <SbConfigurationPanel
                        openLink={mainStore.openLink}
                        userDisplayName={sessionStore.displayName}
                        resourceNameSuffix={mainStore.sbSolution.resourceNameSuffix}
                        mapItemTypeToImageName={mainStore.mapItemTypeToImageName}
                        deploymentConfigs={mainStore.sbSolution.deploymentConfigs}
                        deployingItemId={mainStore.deployingItemId}
                        progressLabel={mainStore.provisionProgressLabel}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default SbConfigurationPage;
