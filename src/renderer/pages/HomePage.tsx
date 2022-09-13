import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Message, Segment } from 'semantic-ui-react';
import { useAsyncEffect } from 'use-async-effect';
import { useStore } from '../stores/store';
import { AuthenticationState } from '../stores/session';
import {
    useGlobalModalContext,
    ModalTypes
} from '../components/GlobalModal';

const HomePage: FC = observer(() => {
    const {
        sessionStore
    } = useStore();
    const {
        showModal,
        hideModal
    } = useGlobalModalContext();

    useAsyncEffect(async isMounted => {
        const lastOAuthError = await sessionStore.getLastOAuthError();

        if (!isMounted()) {
            return;
        }

        if (lastOAuthError) {
            showModal(ModalTypes.InfoModalDialog, {
                title: 'Azure MSAL',
                description: lastOAuthError,
                onOkCallback: async () => {
                    await sessionStore.setLastOAuthError('');

                    hideModal(ModalTypes.InfoModalDialog);
                }
            });
        }
    }, []);

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size='large'>
                        <Message.Header>Azure</Message.Header>
                        <p>IoT Central Solution Builder</p>
                    </Message>
                    {
                        sessionStore.authenticationState !== AuthenticationState.Authenticated
                            ? (
                                <Segment basic>
                                    Use the signin link in the Action menu above to access your Azure subscription resources.
                                </Segment>
                            )
                            : null
                    }
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default HomePage;

