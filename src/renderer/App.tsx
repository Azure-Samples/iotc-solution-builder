import React, { FC } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Menu, Grid, Icon, Dropdown } from 'semantic-ui-react';
import { useAsyncEffect } from 'use-async-effect';
import { useStore } from './stores/store';
import { GlobalModal } from './components/GlobalModal';
import { AuthenticationState } from './stores/session';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import HomePage from './pages/HomePage';
import AzureConfigPage from './pages/AzureConfigPage';
import SbConfigurationPage from './pages/SbConfiguration/SbConfigurationPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import ServiceErrorModal from './components/ServiceErrorModal';
import { log } from './utils';

const ModuleName = 'App';

export enum AppNavigationPaths {
    Root = '/',
    AzureConfig = '/azureconfig',
    SolutionBuilder = '/solutionbuilder'
}

const App: FC = observer((props: any) => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        mainStore,
        sessionStore
    } = useStore();

    useAsyncEffect(async isMounted => {
        await sessionStore.getUserSessionInfo('');

        if (!isMounted()) {
            return;
        }

        if (sessionStore.authenticationState === AuthenticationState.Authenticated) {
            log([ModuleName, 'info'], `Would redirect to: ${params.redirectpath || location.pathname}`);

            navigate(AppNavigationPaths.SolutionBuilder);
        }
        else {
            sessionStore.redirectPath = location.pathname;
        }
    }, []);

    const onClickSignin = async () => {
        const msalConfig = await sessionStore.getMsalConfig();
        if (!msalConfig
            || !msalConfig.clientId
            || !msalConfig.tenantId
            || !msalConfig.subscriptionId
            || !msalConfig.aadAuthority) {
            navigate(AppNavigationPaths.AzureConfig);
        }
        else {
            void sessionStore.signin(AppNavigationPaths.SolutionBuilder);
        }
    };

    const onEditAzureConfig = () => {
        navigate(AppNavigationPaths.AzureConfig);
    };

    const onClickSignout = async () => {
        await sessionStore.signout();
    };

    const onCloseErrorModal = () => {
        mainStore.clearServiceError();
    };

    const userNavItem = sessionStore.authenticationState === AuthenticationState.Authenticated
        ? (
            <Dropdown item trigger={(
                <span>
                    <Icon name={'user'} /> {sessionStore.displayName}
                </span>
            )}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onEditAzureConfig}>
                        <Icon name="edit" />
                        <span>&nbsp;&nbsp;Edit Azure config</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onClickSignout}>
                        <Icon name="sign out alternate" />
                        <span>&nbsp;&nbsp;Sign out</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown >
        )
        : (
            <Dropdown item trigger={(
                <span>
                    <Icon name={'sign in alternate'} /> Action
                </span>
            )}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onEditAzureConfig}>
                        <Icon name="edit" />
                        <span>&nbsp;&nbsp;Edit Azure config</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onClickSignin}>
                        <Icon name="sign in alternate" />
                        <span>&nbsp;&nbsp;Sign in</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );

    const {
        children
    } = props;

    return (
        <ErrorBoundary>
            <GlobalModal>
                <Menu fixed="top" inverted color="grey" style={{ padding: '0em 5em' }}>
                    <Menu.Menu position="right">
                        {userNavItem}
                    </Menu.Menu>
                </Menu>
                <Grid>
                    <Grid.Column>
                        <Routes>
                            <Route path={AppNavigationPaths.Root} element={<HomePage />} />
                            <Route path={AppNavigationPaths.AzureConfig} element={<AzureConfigPage />} />
                            <Route path={AppNavigationPaths.SolutionBuilder}
                                element={
                                    <AuthenticatedRoute redirectTo={AppNavigationPaths.Root}>
                                        <SbConfigurationPage />
                                    </AuthenticatedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to={AppNavigationPaths.Root} replace />} />
                            {children}
                        </Routes>
                    </Grid.Column>
                </Grid>
                <Menu fixed="bottom" inverted color="grey" style={{ padding: '1em 5em' }} />
                <ServiceErrorModal
                    serviceError={mainStore.serviceError}
                    onClose={onCloseErrorModal}
                />
            </GlobalModal>
        </ErrorBoundary>
    );
});

export default App;
