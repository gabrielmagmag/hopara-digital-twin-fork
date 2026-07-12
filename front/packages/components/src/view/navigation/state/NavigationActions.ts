import {createAction} from 'typesafe-actions'
import {Position} from '../../../view-state/ViewState'

import {Floor} from '../../../floor/Floor'
import {PlaceDetail} from '../../../place/PlaceSearchRepository'
import {Layer} from '../../../layer/Layer'
import {Row} from '@hopara/dataset'
import {Action} from '../../../action/Action'
import {PageNavigation} from '@hopara/page/src/PageNavigation'

export interface ZoomPayload {
}

interface FloorPayload {
  floor: Floor
}

interface BearingPayload {
}

export const navigationActions = {
  zoomInRequested: createAction('NAVIGATION_ZOOM_IN_REQUESTED')<ZoomPayload>(),
  zoomOutRequested: createAction('NAVIGATION_ZOOM_OUT_REQUESTED')<ZoomPayload>(),
  floorChangeRequested: createAction('NAVIGATION_FLOOR_CHANGE_REQUESTED')<FloorPayload>(),
  bearingModeToggle: createAction('NAVIGATION_BEARING_MODE_REQUESTED')<BearingPayload>(),
  goToPlace: createAction('NAVIGATION_GO_TO_PLACE_REQUESTED')<Position>(),
  dirtyGoToObjectEditorClicked: createAction('NAVIGATION_DIRTY_GO_TO_OBJECT_EDITOR_CLICKED')<void>(),
  dirtyGoToLayerEditorClicked: createAction('NAVIGATION_DIRTY_GO_TO_LAYER_EDITOR_CLICKED')<void>(),
  dirtyGoToSettingsClicked: createAction('NAVIGATION_DIRTY_GO_TO_SETTINGS_CLICKED')<void>(),
  dirtyGoToVisualizationListClicked: createAction('NAVIGATION_DIRTY_GO_TO_VISUALIZATION_LIST_CLICKED')<void>(),
  dirtyGoToFiltersClicked: createAction('NAVIGATION_DIRTY_GO_TO_FILTERS_CLICKED')<void>(),
  filtersClicked: createAction('NAVIGATION_FILTERS_CLICKED')<void>(),
  initialPositionRequested: createAction('NAVIGATION_INITIAL_POSITION_REQUESTED')<void>(),
  show: createAction('NAVIGATION_SHOW')<void>(),
  hide: createAction('NAVIGATION_HIDE')<void>(),
  startAutoRotateClicked: createAction('NAVIGATION_AUTO_ROTATE_CLICKED')<void>(),
  startAutoNavigateClicked: createAction('NAVIGATION_AUTO_NAVIGATE_CLICKED')<void>(),
  stopAutoNavigateClicked: createAction('NAVIGATION_AUTO_NAVIGATE_STOPPED')<void>(),
  stopAutoRotateClicked: createAction('NAVIGATION_AUTO_ROTATE_STOPPED')<void>(),
  searchRequested: createAction('NAVIGATION_SEARCH_REQUESTED')<{ searchTerm?: string }>(),
  placeClicked: createAction('NAVIGATION_PLACE_CLICKED')<{ place: PlaceDetail }>(),
  searchRowClicked: createAction('NAVIGATION_SEARCH_ROW_CLICKED')<{ rowsetId: string, row: Row, layer: Layer }>(),
  onSearchOpen: createAction('NAVIGATION_SEARCH_OPEN')<void>(),
  onSearchClose: createAction('NAVIGATION_SEARCH_CLOSE')<void>(),
  onSearchCloseClicked: createAction('NAVIGATION_SEARCH_CLOSE_CLICKED')<void>(),
  actionClicked: createAction('NAVIGATION_ACTION_CLICKED')<{ action: Action, navigation: PageNavigation }>(),
  onViewCubeRotationChange: createAction('NAVIGATION_ON_VIEW_CUBE_ROTATION_CHANGE')<{ rotationX: number, rotationY: number }>(),
  viewRotateRequested: createAction('NAVIGATION_VIEW_ROTATE_REQUESTED')<{ direction: 'left' | 'right' }>(),
}

