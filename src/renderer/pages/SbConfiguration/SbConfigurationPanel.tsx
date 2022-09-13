import React, { FC } from 'react';
import { Grid, Segment, Message, Item } from 'semantic-ui-react';
import {
    ISbDeploymentConfig,
    SbAzureResourceType
} from '../../../main/models/sbSolution';
import SbConfigurationItem from './SbConfigurationItem';

interface ISbConfigurationPanelProps {
    openLink: (url: string) => Promise<void>;
    userDisplayName: string;
    resourceNameSuffix: string;
    mapItemTypeToImageName: Map<SbAzureResourceType, string>;
    deploymentConfigs: ISbDeploymentConfig[];
    deployingItemId: string;
    progressLabel: string;
}

const SbConfigurationPanel: FC<ISbConfigurationPanelProps> = (props: ISbConfigurationPanelProps) => {
    const {
        openLink,
        resourceNameSuffix,
        mapItemTypeToImageName,
        deploymentConfigs,
        deployingItemId,
        progressLabel
    } = props;

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column>
                    <Segment>
                        {
                            (deploymentConfigs?.length || 0) > 0
                                ? (
                                    <Item.Group>
                                        {
                                            deploymentConfigs.map((deploymentConfig) => {
                                                return (
                                                    <SbConfigurationItem
                                                        key={deploymentConfig.id}
                                                        openLink={openLink}
                                                        deploymentConfig={deploymentConfig}
                                                        resourceNameSuffix={resourceNameSuffix}
                                                        resourceImageSrc={mapItemTypeToImageName.get(deploymentConfig.itemType)}
                                                        deployingItemId={deployingItemId}
                                                        progressLabel={progressLabel}
                                                    />
                                                );
                                            })
                                        }
                                    </Item.Group>
                                )
                                : (
                                    <Message warning>
                                        <Message.Header>There are no Solution Builder items</Message.Header>
                                    </Message>
                                )
                        }
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default SbConfigurationPanel;
