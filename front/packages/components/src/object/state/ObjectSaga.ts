import { call, debounce, put, select, takeEvery } from '@redux-saga/core/effects'
import { isActionOf } from 'typesafe-actions'
import { Authorization } from '@hopara/authorization'
import actions from '../../state/Actions'
import QueryStore from '../../query/QueryStore'
import {
  BackendDatasetRepository,
  DatasetFilters,
  DatasetService,
  LoaderDatasetRepository,
  Query,
  Rows
} from '@hopara/dataset'
import { Store } from '../../state/Store'
import { PaginatedRowset, PaginatedRowsetStatus } from '../../paginated-rowset/PaginatedRowset'
import { PositionEncoding, testCondition } from '@hopara/encoding'
import ViewState from '../../view-state/ViewState'
import { Floor } from '../../floor/Floor'
import { PlaceTransformFactory } from '../../place-transform/PlaceTransformFactory'
import { Coordinates } from '@hopara/spatial'
import { Layer } from '../../layer/Layer'
import { getTargetZoom } from '../../place-transform/Transform'
import { getRowTitleField } from '../../row/RowService'
import { getRefreshAuthorization } from '../../auth/AuthSaga'
import { Rowset } from '../../rowset/Rowset'
import { FilterType, getDatasetFilters } from '../../rowset/DatasetFiltersService'
import { Layers } from '../../layer/Layers'
import { ObjectFetchTarget } from './ObjectListActions'
import { getUserLocation } from '../../user-location/UserLocation'
import { MenuItem } from '../../menu/MenuStore'

function isPaginationAction(action): boolean {
  return isActionOf([actions.objectList.paginate], action)
}

function isLoadAction(action): boolean {
  return isActionOf([actions.object.typeSelected, actions.objectList.search], action)
}

function getFilterSet(action: any, paginatedRowset: PaginatedRowset, filters: DatasetFilters) {
  const offset = isPaginationAction(action) ? (action.payload as any).offset : paginatedRowset.offset
  return { filters, limit: paginatedRowset.limit, offset }
}

function getDatasetService(
  queryStore: QueryStore,
  query: Query | undefined
): DatasetService {
  const queryLoader = queryStore.loaders.getLoader(query)
  if (queryLoader) {
    return new DatasetService(new LoaderDatasetRepository(queryLoader.loader))
  }

  return new DatasetService(new BackendDatasetRepository())
}

function filterVisibleRows(rows: any, layer: Layer) {
  if ( !layer || !layer.visible.condition ) return rows
  return rows.filter((row) => testCondition(layer.visible.condition, row))
}

function getFetchRows(layers: Layers, rows: Rows, rowsetId: string, target: ObjectFetchTarget) {
  if ( target === ObjectFetchTarget.SEARCH ) {
    const layer: Layer = layers.getSearchables().getByRowsetId(rowsetId)!
    return filterVisibleRows(rows, layer)
  }

  return rows
}

export function* fetchObjects(
  action: ReturnType<typeof actions.objectList.fetch.request>
) {
  if (
    isLoadAction(action) &&
    !action.payload.paginatedRowset?.isInitialState()
  ) {
    return
  }

  try {
    const queryStore: QueryStore = yield select((store: Store) => store.queryStore)
    const rowset: Rowset = yield select((store: Store) => store.rowsetStore.getRowset(action.payload.rowsetId))
    const query = queryStore.queries.findQuery(rowset.getQueryKey())
    const positionQuery = queryStore.queries.findQuery(rowset.getPositionQueryKey())

    if (!query) {
      throw new Error(`Query ${JSON.stringify(rowset.getData())} not found in query store`)
    }

    if (!positionQuery) {
      throw new Error(`Position query ${JSON.stringify(rowset.getPositionData())} not found in query store`)
    }

    const authorization: Authorization = yield getRefreshAuthorization()
    const datasetService = getDatasetService(queryStore, query)
    const response = yield call(
      datasetService.search.bind(datasetService),
      query as Query,
      positionQuery as Query,
      action.payload.searchTerm,
      action.payload.filterSet,
      authorization
    )

    const layers: Layers = yield select((store: Store) => store.layerStore.layers)
    const rows = getFetchRows(layers, response.rows, action.payload.rowsetId, action.payload.target)
    yield put(actions.objectList.fetch.success({
      rowsetId: action.payload.rowsetId,
      offset: action.payload.filterSet.offset,
      limit: action.payload.filterSet.limit,
      rows,
      lastPage: response.lastPage,
      append: action.payload.append,
      target: action.payload.target
    }))
  } catch (e: any) {
    yield put(actions.objectList.fetch.failure({ exception: e }))
  }
}

function* fetchEntityObjects(
  action: ReturnType<
    | typeof actions.object.typeSelected
    | typeof actions.object.typeChanged
    | typeof actions.objectList.search
    | typeof actions.objectList.paginate
  >
) {
  const rowsetId = action.payload.rowsetId
  if (!rowsetId) return

  const paginatedRowset: PaginatedRowset = yield select((store: Store) => store.entityObjectListStore.getRowset(rowsetId))
  const layer = yield select((store: Store) => store.layerStore.layers.getByRowsetId(rowsetId))
  if (!layer.getPositionEncoding()) return

  if ( isActionOf([actions.object.typeSelected, actions.object.typeChanged], action) && 
       paginatedRowset.status !== PaginatedRowsetStatus.NONE) {
     return
  }

  const filters = yield getDatasetFilters([FilterType.SELECTED], layer)
  const filterSet = getFilterSet(action, paginatedRowset, filters)
  const searchTerm = isActionOf([actions.objectList.search], action) ? action.payload.searchTerm : paginatedRowset.searchTerm

  yield put(actions.objectList.fetch.request({
    rowsetId, paginatedRowset, filterSet, target: ObjectFetchTarget.ENTITY,
    searchTerm, append: isPaginationAction(action)
  }))
}

function* fetchAllEntitiesObjects(action: ReturnType<typeof actions.navigation.searchRequested>) {
  const layers: Layers = yield select((store: Store) => store.layerStore.layers.getSearchables())
  if (!layers.length) return

  for (const layer of layers) {
    const rowsetId = layer.getRowsetId()

    const paginatedRowset: PaginatedRowset = yield select((store: Store) =>
      store.searchObjectListStore.getRowset(rowsetId)
    )
    const filters = yield getDatasetFilters([FilterType.SELECTED], layer)
    const filterSet = getFilterSet(action, paginatedRowset, filters)
    yield put(
      actions.objectList.fetch.request({
        paginatedRowset,
        rowsetId,
        filterSet,
        searchTerm: action.payload.searchTerm,
        append: false,
        target: ObjectFetchTarget.SEARCH
      })
    )
  }
}

export function* place(
  action: ReturnType<
    | typeof actions.object.place.success
    | typeof actions.object.placeAtUserLocation.success
  >
) {
  const viewState: ViewState = yield select((store: Store) => store.viewState)
  const authorization: Authorization = yield getRefreshAuthorization()
  const currentFloor: Floor | undefined = yield select((store: Store) =>
    store.floorStore.getCurrent()
  )
  const layer: Layer = yield select((store: Store) =>
    store.layerStore.layers.getById(action.payload.layerId)
  )
  const position = layer.encoding.position as PositionEncoding
  const targetZoom = getTargetZoom(
    viewState,
    layer.visible.getZoomRange(),
    layer.visible.getZoomRange().getMin()
  )
  const lastRowHistory = yield select((store: Store) =>
    store.rowHistory.lastRowHistory(layer.getId())
  )
  const rowset: Rowset | undefined = yield select((store: Store) =>
    store.rowsetStore.getRowset(layer.getRowsetId())
  )
  const referenceRow =
    rowset && lastRowHistory?.row
      ? rowset.getRow(lastRowHistory.row._id)
      : undefined

  const transform = PlaceTransformFactory.createFromLayer(layer)
  const coordinates = yield transform.getCoordinates({
    viewState,
    row: action.payload.row,
    position,
    placeCoordinates: action.payload.coordinates,
    targetZoom,
    authorization,
    referenceRow
  })

  if (currentFloor) coordinates.setFloor(currentFloor.name)

  yield put(actions.object.placed({
    layerId: layer.getId(),
    rowsetId: layer.getRowsetId(),
    data: layer.getPositionData(),
    row: action.payload.row.updateCoordinates(coordinates),
    rowCoordinates: coordinates,
    position
  }))
}

function* placeWithUserLocation(action: ReturnType<typeof actions.object.placeClickedMobile>) {
  try {
    const position = yield getUserLocation()
    yield put(actions.object.placeAtUserLocation.success({
      ...action.payload,
      coordinates: position.coordinates
    }))
  } catch (e: any) {
    yield put(actions.object.placeAtUserLocation.failure({ exception: e }))
  }
}

const getPlacementCentroid = (placement: any, viewState: ViewState): [number, number] => {
  const { x, y } = placement
  return [x - viewState.viewport.x, y - viewState.viewport.y]
}

function* placeWithScreenCoordinates(action: ReturnType<typeof actions.object.place.request>) {
  const viewState: ViewState = yield select((store: Store) => store.viewState)
  const layer: Layer = yield select((store: Store) =>
    store.layerStore.layers.getById(action.payload.layerId)
  )

  const centroid = getPlacementCentroid(action.payload.placement, viewState)
  const targetZoom = getTargetZoom(
    viewState,
    layer.visible.getZoomRange(),
    layer.visible.getZoomRange().getMin()
  )
  const unprojectedCoordinate = viewState.unprojectCoordinate(
    Coordinates.fromArray(centroid),
    targetZoom
  )

  yield put(
    actions.object.place.success({
      ...action.payload,
      coordinates: Coordinates.fromArray(unprojectedCoordinate)
    })
  )
}

export function* updateTitle(action: ReturnType<typeof actions.object.titleChanged>) {
  const layer = yield select((store: Store) => store.layerStore.layers.getById(action.payload.layerId))
  const query = yield select((store: Store) => store.queryStore.queries.findQuery(layer.getQueryKey()))
  const titleField = getRowTitleField(query, layer)
  if (!titleField) return

  yield put(
    actions.object.fieldsUpdated({
      ...action.payload,
      data: layer.getData(),
      updatedFields: { [titleField.getField()]: action.payload.title }
    })
  )
}

const getItemFromSameLayerData = (items: MenuItem[], layerId: string, layers: Layers) => {
  const item = items.find((item) => item.id === layerId)
  if (item) return item

  const layer = layers.getById(layerId)!
  const layersWithSameData = layers.filter((l: Layer) => l.data.isEqual(layer.data))
  return items.find((item) => layersWithSameData.some((l: Layer) => l.getId() === item.id))!
}

export function* updateType(action: ReturnType<typeof actions.details.open>) {
  const objectMenu = yield select((store: Store) => store.objectMenu)
  const layers = yield select((store: Store) => store.layerStore.layers)

  const selectedId = getItemFromSameLayerData(objectMenu.items, action.payload.layerId, layers)?.id
  if ( selectedId && selectedId !== objectMenu.selectedId ) {
    yield put(actions.object.typeChanged({id: selectedId, rowsetId: layers.getById(selectedId)?.getRowsetId()}))
  }
}

export const objectSagas = () => [
  debounce(300, actions.objectList.search, fetchEntityObjects),
  debounce(300, actions.navigation.searchRequested, fetchAllEntitiesObjects),

  takeEvery(actions.details.open, updateType),
  takeEvery(actions.objectList.fetch.request, fetchObjects),
  takeEvery(actions.objectList.paginate, fetchEntityObjects),
  takeEvery(actions.object.typeSelected, fetchEntityObjects),
  takeEvery(actions.object.typeChanged, fetchEntityObjects),
  takeEvery(actions.object.placeClickedMobile, placeWithUserLocation),
  takeEvery(actions.object.titleChanged, updateTitle),
  takeEvery(actions.object.place.request, placeWithScreenCoordinates),
  takeEvery(actions.object.place.success, place),
  takeEvery(actions.object.placeAtUserLocation.success, place)
]
