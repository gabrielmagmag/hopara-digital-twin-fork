import { Dispatch } from '@reduxjs/toolkit'
import { connect } from '@hopara/state'
import { Store } from '../../../state/Store'
import { ActionProps, ViewRotateButton, StateProps } from './ViewRotateButton'
import { VisualizationType } from '../../../visualization/Visualization'
import actions from '../../../state/Actions'

export const mapState = (): StateProps => {
  return {}
}

export const mapActions = (dispatch: Dispatch): ActionProps => {
  return {
    onRotateClockwiseClick: () => {
      dispatch(actions.navigation.viewRotateRequested({ direction: 'clockwise' }))
    },
    onRotateAnticlockwiseClick: () => {
      dispatch(actions.navigation.viewRotateRequested({ direction: 'anticlockwise' }))
    },
  }
}

const shouldRender = (store: Store) => {
  return store.visualizationStore.visualization?.type === VisualizationType.ISOMETRIC_WHITEBOARD
}

export const ViewRotateButtonContainer = connect(mapState, mapActions, shouldRender)(ViewRotateButton as any)
