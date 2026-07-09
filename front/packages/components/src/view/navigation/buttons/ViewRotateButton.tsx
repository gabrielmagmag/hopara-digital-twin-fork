import React from 'react'
import { CanvasNavigationButton } from '@hopara/design-system/src/navigation/CanvasNavigationButton'
import { CanvasNavigationButtonGroup } from '@hopara/design-system/src/navigation/CanvasNavigationButtonGroup'
import { i18n } from '@hopara/i18n'
import { PureComponent } from '@hopara/design-system'

export interface StateProps {
}

export interface ActionProps {
  onClick: () => void
}

export class ViewRotateButton extends PureComponent<StateProps & ActionProps> {
  render() {
    return (
      <CanvasNavigationButtonGroup>
        <CanvasNavigationButton
          label={i18n('VIEW_ROTATE')}
          icon="rotate"
          onClick={this.props.onClick}
          tooltipPlacement='right'
        />
      </CanvasNavigationButtonGroup>
    )
  }
}
