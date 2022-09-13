import React, { ErrorInfo, Component } from 'react';
import { Button, Modal, Form } from 'semantic-ui-react';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';

interface IErrorBoundaryProps {
    children: any;
}

interface IErrorBoundaryState {
    hasError: boolean;
    error: Error;
}

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: any) {
        super(props);

        this.state = {
            hasError: false,
            error: null
        };
    }

    public static getDerivedStateFromError(error: Error): any {
        return {
            hasError: true,
            error
        };
    }

    public componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
        // You can also log the error to an error reporting service
        /* eslint-disable no-console */
        // console.log(error.message);
        // console.log(errorInfo.componentStack);
        /* eslint-enable no-console */

        this.setState({
            error
        });
    }

    public render(): any {
        const {
            children
        } = this.props;

        const {
            hasError,
            error
        } = this.state;

        if (hasError) {
            return (
                <Modal size="small" open={hasError}>
                    <Modal.Header>Unexpected application error</Modal.Header>
                    <Modal.Content>
                        <Form>
                            <Form.Field>
                                <p>{error ? error.message : 'Error'}</p>
                                <p>There may be a problem with your solution configuration file. Please check the contents of the configuration file and try reopening it.</p>
                            </Form.Field>
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={this.onButtonClick.bind(this)}>Reopen</Button>
                    </Modal.Actions>
                </Modal>
            );
        }

        return children;
    }

    private async onButtonClick(): Promise<void> {
        await window.ipcApi[contextBridgeTypes.Ipc_OpenSolution](false);
    }
}
