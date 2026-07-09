import actions, {ActionTypes} from '../state/Actions'
import {getType} from 'typesafe-actions'
import {translateZoom} from '../zoom/Translate'
import ViewState, {
  DEFAULT_TRANSITION_ORBIT_DURATION,
  DEFAULT_TRANSITION_ORBIT_STEP_SIZE,
  getCenterOfTheWorldCoordinates,
  Position
} from './ViewState'
import {Coordinates, RowCoordinates, getPolygonBearing, isLine, toPolygon} from '@hopara/spatial'
import {Store} from '../state/Store'
import {Row} from '@hopara/dataset'
import {Navigate} from '../action/Action'
import {isNil} from 'lodash/fp'
import {Layer} from '../layer/Layer'
import {Reducer} from '@hopara/state'
import { geometricFromViewport } from '../geometric/GeometricFactory'

const ZOOM_JUMP_SIZE = 1

export function getJumpToLayerZoomStep(viewZoom: number, layerMinZoom: number, layerMaxZoom: number) {
  if (viewZoom >= layerMaxZoom) {
    // Max is not inclusive in layer visibility so we need to go back 0.5
    return layerMaxZoom - viewZoom - 0.5
  } else {
    return layerMinZoom - viewZoom
  }
}

function jumpToLayer(state: ViewState | undefined, id: string | undefined, globalState: Store): ViewState | undefined {
  if (!state) return
  const layer = globalState.layerStore.layers.getById(id)
  if (layer) {
    const viewZoom = state.zoom
    if (!layer.belongsToZoom(viewZoom)) {
      const zoomStep = getJumpToLayerZoomStep(viewZoom, layer.visible.zoomRange!.getMin(), layer.visible.zoomRange!.getMax())
      return state.addZoom(zoomStep)
    }
  }

  return state
}

const getRowValue = (row: Row, navigateAction?: Navigate): any[] => {
  if (typeof navigateAction?.bearing === 'object' && navigateAction?.bearing?.field && row[navigateAction?.bearing?.field]) return row[navigateAction.bearing.field]
  if (row.getCoordinates().isGeometryLike()) return row.getCoordinates().getGeometryLike()
  return row.getCoordinates().toArray()
}

export const translateBearing = (viewState: ViewState, row?: Row, navigateAction?: Navigate): number | undefined => {
  if (typeof navigateAction?.bearing === 'object' && !isNil(navigateAction?.bearing?.value)) return navigateAction!.bearing!.value
  if (!row || !viewState.isWebMercatorViewport(viewState.viewport) || navigateAction?.bearing === false) return viewState.bearing
  const rowValue = getRowValue(row, navigateAction)
  if (!Array.isArray(rowValue) || rowValue.length < 4 || isLine(rowValue)) return viewState.bearing
  return getPolygonBearing(rowValue)
}

function getLayer(globalState: Store, layerId: string | undefined) {
  const layer = globalState.layerStore.layers.getById(layerId)!.clone()
  if (layer.parentId) return globalState.layerStore.layers.getById(layer.parentId)!.clone()
  return layer
}

function getLayerZoom(layerId: string | undefined, row: Row, globalState: Store): number {
  const layer = getLayer(globalState, layerId)
  return translateZoom(layer, row, globalState.viewState!)
}

function isLayerOutOfRange(layerId: string, viewState: ViewState, globalState: Store): boolean {
  const layer = globalState.layerStore.layers.getById(layerId) as Layer
  if (!layer) {
    return false
  }

  return layer.visible.zoomRange && !layer.visible.zoomRange.isInRange(viewState.zoom)
}

function shouldTransitionToRow(rowCoordinates: RowCoordinates, layerId: string, state: ViewState, globalState: Store) {
  if (!rowCoordinates.isPlaced() || !layerId) return false

  const outOfZoomRange = isLayerOutOfRange(layerId, state!, globalState)
  if (outOfZoomRange) return true

  const outOfCoordinatesRange = !state.isRowInRange(rowCoordinates)
  return outOfCoordinatesRange && !state.isOrbitViewport(state.viewport)
}

export function getInitialRowParams(state: ViewState, globalState: Store): Position {
  const layer = globalState.initialRow?.layerId ? globalState.layerStore.layers.getById(globalState.initialRow!.layerId) : undefined
  const rowset = layer ? globalState.rowsetStore.getRowset(layer.getRowsetId()) : undefined
  const row = rowset && globalState.initialRow!.rowId ? rowset.getRow(globalState.initialRow!.rowId) : undefined
  // we try to get the position from rowset row, but if it is not placed, we get it from the initialRow state
  const initialRow = row?.isPlaced() ? row : globalState.initialRow?.row

  if (!initialRow?.isPlaced()) {
    return new Position(state.getInitialPosition())
  }

  return new Position({
    ...initialRow!.getCoordinates().toCoordinates(),
    zoom: getLayerZoom(layer!.getId(), initialRow!, globalState),
    bearing: translateBearing(globalState.viewState!, initialRow),
    rotationOrbit: state.rotationOrbit,
    rotationX: state.rotationX,
  })
}

const USER_LOCATION_ZOOM = 18

export const translateCoordinates = (coordinates: Coordinates, row?: Row, navigateAction?: Navigate, viewport?: any) => {
  if (!navigateAction?.zoom?.field || !(navigateAction?.zoom?.field && row && row[navigateAction?.zoom?.field!])) return coordinates
  const geometric = geometricFromViewport(viewport)
  const centroid = geometric.getCentroid(toPolygon(row![navigateAction!.zoom!.field!]))
  return Coordinates.fromArray(centroid.geometry.coordinates)
}

export const viewStateReducer: Reducer<ViewState | undefined, ActionTypes> = (state, action, globalState) => {
  switch (action.type) {
    case getType(actions.visualization.listVisualizationPageLoaded):
      return
    case getType(actions.visualization.fetch.success):
    case getType(actions.visualization.fetch.failure):
    case getType(actions.view.viewLoaded):
    case getType(actions.view.viewDragEnd):
    case getType(actions.view.viewResized):
      return action.payload?.viewState || state
    case getType(actions.view.viewZooming):
      return action.payload.viewState.removeZoomBackPosition()
    case getType(actions.navigation.zoomInRequested):
      return state?.removeZoomBackPosition(true).addZoom(ZOOM_JUMP_SIZE)
    case getType(actions.navigation.zoomOutRequested):
      if (state?.zoomBackPosition) return state.transitionZoomBackPosition()
      return state?.addZoom(-ZOOM_JUMP_SIZE)
    case getType(actions.layer.selected):
      return jumpToLayer(state, action.payload.id, globalState)
    case getType(actions.object.navigateTo):
    case getType(actions.object.navigateToInitialRow):
      if (action.payload.row.isPlaced()) {
        return state?.transition(new Position({
          ...action.payload.row.getCoordinates().toCoordinates(),
          zoom: getLayerZoom(action.payload.layer.getId(), action.payload.row, globalState),
          bearing: translateBearing(state, action.payload.row),
        }))
      } else {
        return state
      }
    case getType(actions.userLocation.show.success):
      return state?.transition(new Position({
        ...action.payload.coordinates,
        zoom: state.zoom > USER_LOCATION_ZOOM ? state.zoom : USER_LOCATION_ZOOM,
      }))
    case getType(actions.object.click): {
      if (action.payload.row.isPlaced()) {
        if (shouldTransitionToRow(action.payload.row.getCoordinates(), action.payload.layer.getId(), state!, globalState)) {
          return state?.transition(new Position({
            ...action.payload.row.getCoordinates().toCoordinates(),
            zoom: getLayerZoom(action.payload.layer.getId(), action.payload.row, globalState),
            bearing: translateBearing(state, action.payload.row),
          }))
        }
      }

      return state
    }
    case getType(actions.navigation.searchRowClicked): {
      if (action.payload.row.isPlaced()) {
        return state?.transition(new Position({
          ...action.payload.row.getCoordinates().toCoordinates(),
          zoom: getLayerZoom(action.payload.layer.getId(), action.payload.row, globalState),
          bearing: translateBearing(state, action.payload.row),
        }))
      }

      return state
    }
    case getType(actions.object.panTo):
      if (action.payload.row.isPlaced()) {
        return state?.transition(new Position(action.payload.row.getCoordinates().toCoordinates()))
      } else {
        return state
      }
    case getType(actions.navigation.goToPlace):
      return state?.transition(new Position({
        ...action.payload,
        bearing: action.payload.bearing ?? state.bearing,
      }))
    case getType(actions.navigation.initialPositionRequested):
      return state?.transition(getInitialRowParams(state, globalState) as any)
    case getType(actions.navigation.onViewCubeRotationChange):
      return state?.transitionViewCube(action.payload.rotationX, action.payload.rotationY)
    case getType(actions.details.zoomRequested):
      return state?.setZoomBackPosition(new Position({
        ...state.getCoordinates(),
        zoom: state.zoom,
        bearing: state.bearing,
      }))
        .transition(new Position({
          ...translateCoordinates(action.payload.coordinates, action.payload.row, action.payload.navigate, globalState.viewState.viewport),
          zoom: translateZoom(action.payload.layer, action.payload.row, state, action.payload.navigate),
          bearing: translateBearing(state, action.payload.row, action.payload.navigate),
        }))
    case getType(actions.object.placed):
      if (shouldTransitionToRow(action.payload.rowCoordinates, action.payload.layerId, state!, globalState)) {
        const placedRow = action.payload.row.updateCoordinates(action.payload.rowCoordinates)
        return state?.transition(new Position({
          ...action.payload.rowCoordinates.toCoordinates(),
          bearing: state.bearing,
          zoom: getLayerZoom(action.payload.layerId, placedRow, globalState),
        }))
      }
      return state
    case getType(actions.viewState.initialPositionChanged):
      return state?.setInitialPosition(action.payload).fitToContentBox()
    case getType(actions.viewState.initialPositionChangedSilently):
      return state?.setInitialPosition(action.payload).fitToContentBox()
    case getType(actions.visualization.edited):
      return state?.setInitialPosition(action.payload.change.initialPosition)
        .setZoomRange(action.payload.change.zoomRange)
        .setZoomBehavior(action.payload.change.zoomBehavior)
    case getType(actions.view.chartCreated):
    case getType(actions.view.chartUpdated):
      return state?.setCenter(getCenterOfTheWorldCoordinates(globalState.world, state.dimensions, action.payload.dimensions))
    case getType(actions.viewState.transitionRotate): {
      let rotation = (state?.rotationOrbit ?? 0)
      rotation += action.payload.step

      if (rotation > 180) {
        rotation = -180 + (rotation - 180)
      } else if (rotation < -180) {
        rotation = 180 + (rotation + 180)
      }

      return state?.transitionRotate(rotation, action.payload.interval)
    }
    case getType(actions.navigation.viewRotateRequested):
      return state?.setRotationOffset(((state.rotationOffset ?? 0) + 90) % 360)
    case getType(actions.navigation.startAutoRotateClicked):
      return state?.setAutoRotate(true)
    case getType(actions.navigation.startAutoNavigateClicked):
      return state?.setAutoNavigate(true)
    case getType(actions.navigation.stopAutoNavigateClicked):
      return state?.setAutoNavigate(false)
    case getType(actions.navigation.stopAutoRotateClicked):
    case getType(actions.view.viewDragStart): {
      if (state?.autoRotate) {
        const transitionInterval = state?.lastTransitionTime ? Date.now() - state.lastTransitionTime : undefined
        if (!transitionInterval || transitionInterval <= 0) return state?.setAutoRotate(false)

        const rotation = DEFAULT_TRANSITION_ORBIT_STEP_SIZE - (DEFAULT_TRANSITION_ORBIT_STEP_SIZE / DEFAULT_TRANSITION_ORBIT_DURATION * transitionInterval)
        return state?.clone({autoRotate: false, rotationOrbit: state.rotationOrbit! - rotation})
      }

      if (state?.autoNavigate) {
        return state?.setAutoNavigate(false)
      }

      return state
    }
    default:
      return state
  }
}
