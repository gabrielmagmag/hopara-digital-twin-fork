import React from 'react'
import { CanvasNavigationButton } from '@hopara/design-system/src/navigation/CanvasNavigationButton'
import { CanvasNavigationButtonGroup } from '@hopara/design-system/src/navigation/CanvasNavigationButtonGroup'
import { i18n } from '@hopara/i18n'
import { PureComponent } from '@hopara/design-system'

export interface StateProps {
  canRotate: boolean
}

export interface ActionProps {
  onClick: () => void
}

export class ViewRotateButton extends PureComponent<StateProps & ActionProps> {
  render() {
    return (
      <CanvasNavigationButtonGroup>
        <CanvasNavigationButton
          label={this.props.canRotate ? i18n('VIEW_ROTATE') : i18n('VIEW_ROTATE_DISABLED')}
          icon="rotate"
          onClick={this.props.onClick}
          disabled={!this.props.canRotate}
          tooltipPlacement='right'
        />
      </CanvasNavigationButtonGroup>
    )
  }
}
