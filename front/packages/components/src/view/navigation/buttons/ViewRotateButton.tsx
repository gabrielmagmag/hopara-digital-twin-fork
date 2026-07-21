import React from 'react'
import { CanvasNavigationButton } from '@hopara/design-system/src/navigation/CanvasNavigationButton'
import { CanvasNavigationButtonGroup } from '@hopara/design-system/src/navigation/CanvasNavigationButtonGroup'
import { i18n } from '@hopara/i18n'
import { PureComponent } from '@hopara/design-system'
import { Config } from '@hopara/config'
import { CloudFeatureLabel } from '@hopara/design-system/src/branding/CloudFeatureLabel'

const cloudFeaturesEnabled = Config.getValueAsBoolean('CLOUD_FEATURES_ENABLED')

export interface StateProps {
}

export interface ActionProps {
  onRotateClockwiseClick: () => void
  onRotateAnticlockwiseClick: () => void
}

export class ViewRotateButton extends PureComponent<StateProps & ActionProps> {
  render() {
    return (
      <CanvasNavigationButtonGroup>
        <CanvasNavigationButton
          label={!cloudFeaturesEnabled
            ? <CloudFeatureLabel featureName={i18n('VIEW_ROTATE_CLOCKWISE')}/>
            : i18n('VIEW_ROTATE_CLOCKWISE')}
          icon="view-rotate-clockwise"
          onClick={this.props.onRotateClockwiseClick}
          disabled={!cloudFeaturesEnabled}
          tooltipPlacement='right'
        />
        <CanvasNavigationButton
          label={!cloudFeaturesEnabled
            ? <CloudFeatureLabel featureName={i18n('VIEW_ROTATE_ANTICLOCKWISE')}/>
            : i18n('VIEW_ROTATE_ANTICLOCKWISE')}
          icon="view-rotate-anticlockwise"
          onClick={this.props.onRotateAnticlockwiseClick}
          disabled={!cloudFeaturesEnabled}
          tooltipPlacement='right'
        />
      </CanvasNavigationButtonGroup>
    )
  }
}
