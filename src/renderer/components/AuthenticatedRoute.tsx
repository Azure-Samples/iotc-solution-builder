import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/store';
import { AuthenticationState } from '../stores/session';

interface IAuthenticatedRoute {
    children: JSX.Element;
    redirectTo: string;
}

const AuthenticatedRoute: FC<IAuthenticatedRoute> = observer((props: IAuthenticatedRoute) => {
    const {
        children,
        redirectTo
    } = props;

    const {
        sessionStore
    } = useStore();

    return sessionStore.authenticationState === AuthenticationState.Authenticated ? children : <Navigate to={redirectTo} />;
});

export default AuthenticatedRoute;
