import { Dispatch } from '@reduxjs/toolkit'
import { Store } from '../../../state/Store'
import { connect } from '@hopara/state'
import { ActionProps, ImageRotateButton, StateProps } from './ImageRotateButton'
import { getSelectedLayer } from '../../../view-layer/deck/interaction/RowSelection'
import actions from '../../../state/Actions'

export const mapState = (store: Store): StateProps => {
  const rowSelection = store.viewLayers.rowSelection
  const selectedLayer = rowSelection ? getSelectedLayer(rowSelection, store.layerStore.layers) : undefined
  const positionQuery = store.queryStore.queries.findQuery(selectedLayer?.getPositionQueryKey())
  const hasViewField = !!(selectedLayer?.encoding.image?.view?.field) &&
    positionQuery?.getColumns().has(selectedLayer.encoding.image.view.field)

  return {
    canRotate: !!(rowSelection?.allowRotation) && !!hasViewField,
  }
}

export const mapActions = (dispatch: Dispatch): ActionProps => {
  return {
    onClick: () => {
      dispatch(actions.rowToolbar.rotateRequested())
    },
  }
}

export const ImageRotateButtonContainer = connect(mapState, mapActions)(ImageRotateButton as any)
