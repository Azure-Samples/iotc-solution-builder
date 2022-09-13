/* eslint-disable max-len */
import React, { FC } from 'react';
import { Image, Message, Item, Grid, Divider, Label, Loader, Dimmer } from 'semantic-ui-react';
// import { IotCentralBaseDomain } from '../../../main/models/iotCentral';
import {
    ISbDeploymentConfig
} from '../../../main/models/sbSolution';

interface ISbConfigurationItemProps {
    key: string;
    openLink: (url: string) => Promise<void>;
    deploymentConfig: ISbDeploymentConfig;
    resourceNameSuffix: string;
    resourceImageSrc: string;
    deployingItemId: string;
    progressLabel: string;
}
const SbConfigurationItem: FC<ISbConfigurationItemProps> = (props: ISbConfigurationItemProps) => {
    const {
        openLink,
        deploymentConfig,
        resourceImageSrc,
        deployingItemId,
        progressLabel
    } = props;

    const resourceName = deploymentConfig.outputs?.parameters?.resourceName || '';

    return (
        <Message>
            <Item>
                <Item.Content>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width='10'>
                                <Image
                                    floated='left'
                                    style={{ width: '48px', height: 'auto' }}
                                    src={`./assets/${resourceImageSrc}`}
                                />
                                <>
                                    <Item.Header
                                        style={{ cursor: 'pointer' }}
                                        as="a"
                                        onClick={() => openLink(deploymentConfig.docLink)}
                                    >
                                        {deploymentConfig.name}
                                    </Item.Header>
                                    <Item.Meta>{deploymentConfig.description}</Item.Meta>
                                </>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Item.Content>
                <Divider hidden />
                <Item.Extra>
                    {
                        (deploymentConfig?.outputs?.status <= 201)
                            ? <Label color='green'>completed</Label>
                            : null
                    }
                    {
                        resourceName
                            ? <Label>{resourceName}</Label>
                            : null
                    }
                </Item.Extra>
                <Dimmer style={{ border: '1px solid black', borderColor: '#cececf', borderRadius: '3px' }} active={deployingItemId === deploymentConfig.id} inverted>
                    <Loader>{progressLabel}</Loader>
                </Dimmer>
            </Item>
        </Message >
    );
};

export default SbConfigurationItem;
