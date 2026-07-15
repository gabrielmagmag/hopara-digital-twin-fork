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
  onRotateLeftClick: () => void
  onRotateRightClick: () => void
}

export class ViewRotateButton extends PureComponent<StateProps & ActionProps> {
  render() {
    return (
      <CanvasNavigationButtonGroup>
        <CanvasNavigationButton
          label={!cloudFeaturesEnabled
            ? <CloudFeatureLabel featureName={i18n('VIEW_ROTATE_LEFT')}/>
            : i18n('VIEW_ROTATE_LEFT')}
          icon="view-rotate-left"
          onClick={this.props.onRotateLeftClick}
          disabled={!cloudFeaturesEnabled}
          tooltipPlacement='right'
        />
        <CanvasNavigationButton
          label={!cloudFeaturesEnabled
            ? <CloudFeatureLabel featureName={i18n('VIEW_ROTATE_RIGHT')}/>
            : i18n('VIEW_ROTATE_RIGHT')}
          icon="view-rotate-right"
          onClick={this.props.onRotateRightClick}
          disabled={!cloudFeaturesEnabled}
          tooltipPlacement='right'
        />
      </CanvasNavigationButtonGroup>
    )
  }
}
