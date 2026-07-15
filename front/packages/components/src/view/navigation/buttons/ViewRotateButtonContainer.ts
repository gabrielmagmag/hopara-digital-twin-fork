import { Dispatch } from '@reduxjs/toolkit'
import { connect } from '@hopara/state'
import { Store } from '../../../state/Store'
import { ActionProps, ViewRotateButton, StateProps } from './ViewRotateButton'
import { VisualizationType } from '../../../visualization/Visualization'
import actions from '../../../state/Actions'

export const mapState = (store: Store): StateProps => {
  return {
    visible: store.visualizationStore.visualization?.type === VisualizationType.ISOMETRIC_WHITEBOARD,
  }
}

export const mapActions = (dispatch: Dispatch): ActionProps => {
  return {
    onRotateLeftClick: () => {
      dispatch(actions.navigation.viewRotateRequested({ direction: 'left' }))
    },
    onRotateRightClick: () => {
      dispatch(actions.navigation.viewRotateRequested({ direction: 'right' }))
    },
  }
}

export const ViewRotateButtonContainer = connect(mapState, mapActions)(ViewRotateButton as any)
