import {createAction, createAsyncAction} from 'typesafe-actions'
import {Data, PositionEncoding} from '@hopara/encoding'
import {Row} from '@hopara/dataset'
import {Layer} from '../../layer/Layer'
import {Coordinates, RowCoordinates} from '@hopara/spatial'

interface ObjectClickPayload {
  row: Row
  layer: Layer
}

export interface FieldsUpdatedPayload {
  rowsetId: string
  row: Row
  data: Data // we need to know wheter its the data or position data (e.g. appearance update)
  updatedFields: Record<string, any>
}

export interface AppearanceUpdatePayload extends FieldsUpdatedPayload {
  type: string
}

export interface RowChangeRequestPayload {
  row: Row
  rowsetId: string
  layerId: string
  placement: any
}

export interface RowChangedPayload {
  layerId: string,
  rowsetId: string,
  data: Data
  row: Row
  rowCoordinates: RowCoordinates
  position: PositionEncoding
}

export interface ObjectPlaceAtPosition {
  layerId: string
  row: Row
}

interface PanToRowPayload {
  row: Row
}

export const objectActions = {
  create: createAsyncAction(
    'OBJECT_CREATE_REQUEST',
    'OBJECT_CREATE_SUCCESS',
    'OBJECT_CREATE_FAILURE',
  )<{ layerId: string, rowsetId: string }, { row: Row, rowsetId: string, layerId: string }, void>(),
  delete: createAsyncAction(
    'OBJECT_DELETE_REQUEST',
    'OBJECT_DELETE_SUCCESS',
    'OBJECT_DELETE_FAILURE',
  )<{ layerId: string, rowsetId: string, row: Row}, { row: Row, rowsetId: string, layerId: string }, void>(),
  undoRequest: createAction('OBJECT_UNDO_REQUEST')<void>(),
  titleChanged: createAction('OBJECT_TITLE_CHANGED')<{
    title: string
    layerId: string,
    rowsetId: string,
    row: Row
  }>(),
  click: createAction('OBJECT_CLICK')<ObjectClickPayload>(),
  place: createAsyncAction(
    'OBJECT_PLACE_REQUEST',
    'OBJECT_PLACE_SUCCESS',
    'OBJECT_PLACE_FAILURE',
  )<RowChangeRequestPayload, RowChangeRequestPayload & {coordinates: Coordinates}, { exception: Error }>(),
  placed: createAction('OBJECT_PLACED')<RowChangedPayload>(),
  unplaced: createAction('OBJECT_UNPLACED')<RowChangedPayload>(),
  unplaceRequest: createAction('OBJECT_UNPLACE_REQUEST')<void>(),
  navigateTo: createAction('OBJECT_NAVIGATE_TO')<ObjectClickPayload>(),
  navigateToInitialRow: createAction('OBJECT_NAVIGATE_TO_INITIAL_ROW')<ObjectClickPayload>(),
  placeClickedMobile: createAction('OBJECT_PLACE_CLICKED_MOBILE')<{ layerId: string, row: Row, rowsetId: string }>(),
  placeAtUserLocation: createAsyncAction(
    'OBJECT_PLACE_AT_USER_LOCATION_REQUESTED',
    'OBJECT_PLACE_AT_USER_LOCATION_SUCCESS',
    'OBJECT_PLACE_AT_USER_LOCATION_FAILURE',
  )<void, ObjectPlaceAtPosition & { coordinates: Coordinates }, { exception: Error }>(),
  panTo: createAction('OBJECT_PAN_TO')<PanToRowPayload>(),
  selected: createAction('OBJECT_SELECT')<{ id?: string }>(),
  fieldsUpdated: createAction('OBJECT_FIELDS_UPDATED')<FieldsUpdatedPayload>(),
  zIndexUpdated: createAction('OBJECT_Z_INDEX_UPDATED')<FieldsUpdatedPayload>(),
  appearanceUpdated: createAction('APPEARANCE_UPDATED')<AppearanceUpdatePayload>(),
  typeChanged: createAction('OBJECT_TYPE_CHANGED')<{ id?: string, rowsetId?: string }>(),
  typeSelected: createAction('OBJECT_TYPE_SELECTED')<{ id?: string, rowsetId?: string }>()
}
