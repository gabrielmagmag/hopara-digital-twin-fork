import { Dispatch } from '@reduxjs/toolkit'
import { connect } from '@hopara/state'
import { ActionProps, ViewRotateButton, StateProps } from './ViewRotateButton'
import actions from '../../../state/Actions'

export const mapState = (): StateProps => {
  return {}
}

export const mapActions = (dispatch: Dispatch): ActionProps => {
  return {
    onClick: () => {
      dispatch(actions.navigation.viewRotateRequested())
    },
  }
}

export const ViewRotateButtonContainer = connect(mapState, mapActions)(ViewRotateButton as any)
