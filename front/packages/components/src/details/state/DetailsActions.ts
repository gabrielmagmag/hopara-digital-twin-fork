import {Row} from '@hopara/dataset'
import {Coordinates} from '@hopara/spatial'
import {createAction} from 'typesafe-actions'
import {Layer} from '../../layer/Layer'
import {Action, Navigate} from '../../action/Action'
import { PageNavigation } from '@hopara/page/src/PageNavigation'

export const detailsActions = {
  open: createAction('DETAILS_OPEN')<{ layerId: string, row?: Row }>(),
  backClicked: createAction('DETAILS_BACK_CLICKED')<{ layerId: string }>(),
  closeClicked: createAction('DETAILS_CLOSE_CLICKED')<void>(),
  zoomRequested: createAction('ZOOM_REQUESTED')<{
    row?: Row,
    navigate: Navigate,
    coordinates: Coordinates,
    layer: Layer,
    floor?: number | undefined
  }>(),
  modelUpload: createAction('DETAILS_MODEL_UPLOAD')<{ layerId: string, name: string, file: File }>(),
  imageHistoryOpenClicked: createAction('IMAGE_HISTORY_OPEN_CLICKED')<{
    layerId: string,
    rowId: string,
    library?: string,
    resourceId?: string
  }>(),
  modelHistoryOpenClicked: createAction('MODEL_HISTORY_OPEN_CLICKED')<{
    layerId: string,
    rowId: string,
    library?: string,
    resourceId?: string
  }>(),
  imageHistoryCloseClicked: createAction('IMAGE_HISTORY_CLOSE_CLICKED')<void>(),
  modelHistoryCloseClicked: createAction('MODEL_HISTORY_CLOSE_CLICKED')<void>(),
  actionClicked: createAction('DETAILS_ACTION_CLICKED')<{ action: Action, layerId: string, row: Row, navigation: PageNavigation }>(),
  toggleCollapse: createAction('DETAILS_TOGGLE_COLLAPSE')<void>(),
  setCollapsed: createAction('DETAILS_SET_COLLAPSED')<boolean>(),
}

