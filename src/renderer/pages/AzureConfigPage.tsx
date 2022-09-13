import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Form, Grid, Input, Message } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { AppNavigationPaths } from '../App';
import {
    useGlobalModalContext,
    ModalTypes
} from '../components/GlobalModal';
import { IConfirmModalInfo } from '../components/ConfirmModal';

const AzureConfigPage: FC = observer(() => {
    const navigate = useNavigate();
    const {
        sessionStore
    } = useStore();
    const {
        showModal,
        hideModal
    } = useGlobalModalContext();

    const [clientId, setClientId] = useState('');
    const [tenantId, setTenantId] = useState('');
    const [subscriptionId, setSubscriptionId] = useState('');
    const [aadAuthority, setAadAuthority] = useState('');

    useAsyncEffect(async isMounted => {
        const msalConfig = await sessionStore.getMsalConfig();

        if (!isMounted()) {
            return;
        }

        setClientId(msalConfig.clientId);
        setTenantId(msalConfig.tenantId);
        setSubscriptionId(msalConfig.subscriptionId);
        setAadAuthority(msalConfig.aadAuthority);
    }, []);

    const onFieldChange = (e: any, fieldId: string) => {
        switch (fieldId) {
            case 'clientId':
                setClientId(e.target.value);
                break;
            case 'tenantId':
                setTenantId(e.target.value);
                break;
            case 'subscriptionId':
                setSubscriptionId(e.target.value);
                break;
            case 'aadAuthority':
                setAadAuthority(e.target.value);
                break;
        }
    };

    const onOk = async () => {
        if (!clientId
            || !tenantId
            || !subscriptionId
            || !aadAuthority) {
            showModal(ModalTypes.InfoModalDialog, {
                title: 'Azure MSAL configuration',
                description: 'Some of the required parameters were missing or incorrectly formatted.',
                onOkCallback: () => {
                    hideModal(ModalTypes.InfoModalDialog);
                }
            });
        }
        else {
            showModal(ModalTypes.ConfirmModalDialog, {
                title: 'Azure MSAL configuration',
                description: 'Changing the configuration will sign out of your current session',
                action: 'Continue',
                onConfirmCallback: async (confirmModalInfo: IConfirmModalInfo) => {
                    if (confirmModalInfo.confirm) {
                        await sessionStore.setMsalConfig({
                            clientId,
                            tenantId,
                            subscriptionId,
                            aadAuthority
                        });

                        hideModal(ModalTypes.ConfirmModalDialog);

                        await sessionStore.signout();
                        navigate(AppNavigationPaths.Root);
                    }
                }
            });
        }
    };

    const onCancel = () => {
        navigate(AppNavigationPaths.SolutionBuilder);
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size='large'>
                        <Message.Header>Azure Resource Credentials</Message.Header>
                    </Message>
                    <Form>
                        <Form.Field>
                            <label>Application (client) id:</label>
                            <Input
                                value={clientId}
                                onChange={(e) => onFieldChange(e, 'clientId')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Tenant id:</label>
                            <Input
                                value={tenantId}
                                onChange={(e) => onFieldChange(e, 'tenantId')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Subscription id:</label>
                            <Input
                                value={subscriptionId}
                                onChange={(e) => onFieldChange(e, 'subscriptionId')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>AAD authority endpoint:</label>
                            <Input
                                value={aadAuthority}
                                onChange={(e) => onFieldChange(e, 'aadAuthority')}
                            />
                        </Form.Field>
                    </Form>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button style={{ width: '100px' }} floated='right' size='small' color='green' onClick={onOk}>OK</Button>
                    <Button style={{ width: '100px' }} floated='right' size='small' onClick={onCancel}>Cancel</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default AzureConfigPage;
