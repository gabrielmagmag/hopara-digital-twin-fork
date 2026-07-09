import { Dispatch } from '@reduxjs/toolkit'
import { Store } from '../../../state/Store'
import { connect } from '@hopara/state'
import { ActionProps, ViewRotateButton, StateProps } from './ViewRotateButton'
import actions from '../../../state/Actions'

export const mapState = (store: Store): StateProps => {
  return {
    canRotate: store.layerStore.layers.some((l) => !!l.encoding?.image?.view?.field),
  }
}

export const mapActions = (dispatch: Dispatch): ActionProps => {
  return {
    onClick: () => {
      dispatch(actions.navigation.viewRotateRequested())
    },
  }
}

export const ViewRotateButtonContainer = connect(mapState, mapActions)(ViewRotateButton as any)
