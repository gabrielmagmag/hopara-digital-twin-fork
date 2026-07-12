import { Dispatch } from '@reduxjs/toolkit'
import { connect } from '@hopara/state'
import { ActionProps, ViewRotateButton, StateProps } from './ViewRotateButton'
import actions from '../../../state/Actions'

export const mapState = (): StateProps => {
  return {}
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
