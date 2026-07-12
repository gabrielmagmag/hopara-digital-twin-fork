import React from 'react'
import { CanvasNavigationButton } from '@hopara/design-system/src/navigation/CanvasNavigationButton'
import { CanvasNavigationButtonGroup } from '@hopara/design-system/src/navigation/CanvasNavigationButtonGroup'
import { i18n } from '@hopara/i18n'
import { PureComponent } from '@hopara/design-system'

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
          label={i18n('VIEW_ROTATE_LEFT')}
          icon="view-rotate-left"
          onClick={this.props.onRotateLeftClick}
          tooltipPlacement='right'
        />
        <CanvasNavigationButton
          label={i18n('VIEW_ROTATE_RIGHT')}
          icon="view-rotate-right"
          onClick={this.props.onRotateRightClick}
          tooltipPlacement='right'
        />
      </CanvasNavigationButtonGroup>
    )
  }
}
