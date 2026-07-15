import {PropsWithChildren} from 'react'
import {Location, NavigationType} from 'react-router-dom'
import {debounce, isArray, isEmpty, isNil, isNull, isNumber, omitBy, toNumber} from 'lodash/fp'
import QueryStringParser from 'query-string'
import {Coordinates} from '@hopara/spatial'
import ViewState from '../view-state/ViewState'
import actions from '../state/Actions'
import {Store} from '../state/Store'
import {InitialRow} from '../initial-row/InitialRow'
import {SelectedFilters} from '../filter/domain/SelectedFilters'
import {SelectedFilter} from '../filter/domain/SelectedFilter'
import {connect} from '@hopara/state'
import {PureComponent} from '@hopara/design-system'
import {PageNavigation} from '@hopara/page/src/PageNavigation'
import {Dispatch} from '@reduxjs/toolkit'
import Visualization from './Visualization'
import {Authorization} from '@hopara/authorization'
import {Floor} from '../floor/Floor'
import ls from 'localstorage-slim'
import {VisualizationLoadStatus} from './VisualizationLoadStatus'
import {PageType} from '@hopara/page/src/Pages'
import { Config } from '@hopara/config'

export type VisualizationRouteParams = {
  visualizationId?: string,
  fallbackVisualizationId?: string
  visualizationScope?: string
  selectedFilters?: SelectedFilters
  coordinates?: Coordinates
  zoom?: number
  bearing?: number
  rotationX?: number
  rotationOrbit?: number
  viewRotationOffset?: number
  version?: number
  initialRow?: InitialRow
  floor?: Floor
}

interface RouteProps {
  x?: number
  y?: number
  z?: number
  floor?: string
  zoom?: number
  bearing?: number
  rotationX?: number
  rotationOrbit?: number
  viewRotationOffset?: number
  filter?: string | string[]
  fallbackVisualizationId?: string
  visualizationScope?: string
}


const storeLocationKey = (tenant: string, visualizationId: string, fallbackVisualizationId?: string) => `hopara-viz-location-#${tenant}-#${visualizationId}${fallbackVisualizationId ? `-${fallbackVisualizationId}` : ''}`
const persistedRouteParams = ['x', 'y', 'z', 'zoom', 'bearing', 'floor']
const tenantsWithoutStoredLocation = Config.getValue('TENANTS_WITHOUT_STORED_LOCATION') as string[]

const setStoredLocation = (location: Location, tenant: string, visualizationId: string, fallbackVisualizationId?: string) => {
  if ( tenantsWithoutStoredLocation.includes(tenant) ) return
  
  const searchParams = QueryStringParser.parse(location.search)
  Object.keys(searchParams).forEach((key) => {
    if (!persistedRouteParams.includes(key)) delete searchParams[key]
  })

  ls.set(storeLocationKey(tenant, visualizationId, fallbackVisualizationId), JSON.stringify({
    ...location,
    search: !searchParams ? '' : '?' + QueryStringParser.stringify(searchParams),
  }), {ttl: 60 * 60 * 24 * 7})
}

export const getStoredLocation = (tenant?: string, visualizationId?: string, fallbackVisualizationId?: string): Location | undefined => {
  if (!visualizationId || !tenant || tenantsWithoutStoredLocation.includes(tenant)) return undefined
  try {
    const item = ls.get<string>(storeLocationKey(tenant, visualizationId, fallbackVisualizationId))
    if (!item) return undefined
    return JSON.parse(item)
  } catch {
    ls.remove(storeLocationKey(tenant, visualizationId, fallbackVisualizationId))
    return undefined
  }
}

const urlFilters = (urlParams: any): SelectedFilters => {
  if (!urlParams['filter']) return new SelectedFilters()

  if (isArray(urlParams['filter'])) {
    return new SelectedFilters(...urlParams['filter'].map((filter) => {
      return new SelectedFilter({
        ...JSON.parse(filter),
      })
    }))
  }

  return new SelectedFilters(new SelectedFilter({
    ...JSON.parse(urlParams['filter']),
  }))
}

const urlFloor = (urlParams: any): Floor | undefined => {
  if (urlParams.floor === undefined) return
  return new Floor({name: urlParams.floor})
}

const urlCoordinates = (urlParams: any): Coordinates | undefined => {
  if (
    urlParams.x === undefined &&
    urlParams.y === undefined &&
    urlParams.z === undefined
  ) return
  return new Coordinates({
    x: Number.isNaN(toNumber(urlParams.x)) ? 0 : toNumber(urlParams.x),
    y: Number.isNaN(toNumber(urlParams.y)) ? 0 : toNumber(urlParams.y),
    z: Number.isNaN(toNumber(urlParams.z)) ? 0 : toNumber(urlParams.z),
  })
}

const urlZoom = (urlParams: any): number | undefined => {
  return Number.isNaN(toNumber(urlParams.zoom)) ? undefined : toNumber(urlParams.zoom)
}

const urlBearing = (urlParams: any): number | undefined => {
  return Number.isNaN(toNumber(urlParams.bearing)) ? undefined : toNumber(urlParams.bearing)
}

const urlRotationX = (urlParams: any): number | undefined => {
  return Number.isNaN(toNumber(urlParams.rotationX)) ? undefined : toNumber(urlParams.rotationX)
}

const urlRotationOrbit = (urlParams: any): number | undefined => {
  return Number.isNaN(toNumber(urlParams.rotationOrbit)) ? undefined : toNumber(urlParams.rotationOrbit)
}

const urlViewRotationOffset = (urlParams: any): number | undefined => {
  return Number.isNaN(toNumber(urlParams.viewRotationOffset)) ? undefined : toNumber(urlParams.viewRotationOffset)
}

const urlInitialRow = (urlParams: any): InitialRow | undefined => {
  if (isNil(urlParams.initialLayerId) || isNil(urlParams.initialRowId)) return undefined
  return {layerId: urlParams.initialLayerId, rowId: urlParams.initialRowId}
}

const getQueryString = (search: any): any => {
  return QueryStringParser.parse(search, {'parseNumbers': true})
}

const queryParamsToRouteParams = (queryParams: any): VisualizationRouteParams => {
  return {
    visualizationId: queryParams.visualizationId,
    fallbackVisualizationId: queryParams.fallbackVisualizationId,
    visualizationScope: queryParams.visualizationScope,
    selectedFilters: urlFilters(queryParams),
    coordinates: urlCoordinates(queryParams),
    floor: urlFloor(queryParams),
    zoom: urlZoom(queryParams),
    bearing: urlBearing(queryParams),
    rotationX: urlRotationX(queryParams),
    rotationOrbit: urlRotationOrbit(queryParams),
    viewRotationOffset: urlViewRotationOffset(queryParams),
    initialRow: urlInitialRow(queryParams),
  }
}

export const getRouteParams = (location: Location, visualizationId?: string, fallbackVisualizationId?: string): VisualizationRouteParams => {
  const qs = getQueryString(location.search)
  return queryParamsToRouteParams({
    ...qs,
    visualizationId,
    fallbackVisualizationId: qs.fallbackVisualizationId ?? fallbackVisualizationId,
  })
}

const isEmptyParams = (params: VisualizationRouteParams): boolean => {
  return isNil(params.bearing) &&
         isNil(params.coordinates) &&
         isNil(params.floor) &&
         (isNil(params.selectedFilters) || (!isNil(params.selectedFilters) && !(params.selectedFilters as any).length)) &&
         isNil(params.zoom) &&
         isNil(params.rotationX) &&
         isNil(params.rotationOrbit) &&
         isNil(params.viewRotationOffset) &&
         isNil(params.initialRow)
}

export const getInitialRouteParams = (location: Location, visualizationId?: string, fallbackVisualizationId?: string, tenant?: string): VisualizationRouteParams => {
  const storedLocation = getStoredLocation(tenant, visualizationId, fallbackVisualizationId)
  const storedParams = storedLocation ? getRouteParams(storedLocation, visualizationId, fallbackVisualizationId) : undefined
  const routeParams = getRouteParams(location, visualizationId, fallbackVisualizationId)
  return !isEmptyParams(routeParams) ? routeParams : storedParams ?? routeParams
}

const getFilterParam = (selectedFilters: SelectedFilters): string[] | undefined => {
  if (selectedFilters?.length > 0) {
    const filters: string[] = []
    selectedFilters.forEach((filter: SelectedFilter) => filter.values.length && filters.push(JSON.stringify(filter.toPlain())))
    return filters
  }

  return undefined
}

export const createRouteParams = (
  fallbackVisualizationId: string | undefined,
  visualizationScope: string | undefined,
  viewState: ViewState,
  currentFloor: Floor | undefined,
  selectedFilters: SelectedFilters,
) => {
  const params: RouteProps = {
    x: isNumber(viewState?.getRawCoordinates()?.x) ? viewState.getRawCoordinates()!.x : undefined,
    y: isNumber(viewState?.getRawCoordinates()?.y) ? viewState.getRawCoordinates()!.y : undefined,
    z: isNumber(viewState?.getRawCoordinates()?.z) ? viewState.getRawCoordinates()!.z : undefined,
    floor: currentFloor?.name,
    zoom: isNumber(viewState?.zoom) ? viewState.zoom : undefined,
    bearing: isNumber(viewState?.bearing) ? viewState.bearing : undefined,
    rotationX: isNumber(viewState?.rotationX) ? viewState.rotationX : undefined,
    rotationOrbit: isNumber(viewState?.rotationOrbit) ? viewState.rotationOrbit : undefined,
    viewRotationOffset: viewState?.rotationOffset ? viewState.rotationOffset : undefined,
    filter: getFilterParam(selectedFilters),
    fallbackVisualizationId,
    visualizationScope,
  }

  return omitBy(isNull, {
    ...getQueryString(location.search),
    ...params,
  })
}

export const createLocation = (
  fallbackVisualizationId: string | undefined,
  visualizationScope: string | undefined,
  viewState: ViewState,
  currentFloor: Floor | undefined,
  selectedFilters: SelectedFilters,
  location: Location,
): Location => {
  const params = createRouteParams(fallbackVisualizationId, visualizationScope, viewState, currentFloor, selectedFilters)

  return {
    ...location,
    search: !isEmpty(params) ? `?${QueryStringParser.stringify(params)}` : '',
  }
}

const rewriteUrlDebounced = debounce(1000, (navigateFnc: Function, newLocation: Location, tenant: string, visualizationId:string, fallbackVisualizationId?: string) => {
  setStoredLocation(newLocation, tenant, visualizationId, fallbackVisualizationId)
  return navigateFnc(`${newLocation.pathname}${newLocation.search}`, {replace: true})
})

type StateProps = PropsWithChildren & {
  visualizationId?: string
  tenant?: string
  viewState?: ViewState
  selectedFilters: SelectedFilters
  visualization: Visualization
  fallbackVisualizationId?: string
  authorization: Authorization
  currentFloor?: Floor
  location: Location
  navigationType: NavigationType
  loadStatus: VisualizationLoadStatus
}

type ActionProps = {
  rewriteUrl: (location: Location) => void
  notifyVisualizationChange: (location: Location) => void
  onVisualizationNotFound: () => void
}

class Provider extends PureComponent<StateProps & ActionProps> {
  // we don't use state because we don't want to re-render
  lastLocationKey = ''
  lastLocationUrl = ''

  handleVisualizationChange() {
    if (!this.lastLocationKey || this.lastLocationKey === this.props.location.key) return
    rewriteUrlDebounced.cancel()
    this.lastLocationKey = this.props.location.key
    return this.props.notifyVisualizationChange(this.props.location)
  }

  shouldNotifyVisualizationChange() {
    const isSameVisualization = this.props.visualization?.id && this.props.visualizationId === this.props.visualization?.id
    return (this.props.navigationType === NavigationType.Push || this.props.navigationType === NavigationType.Pop) && !isSameVisualization
  }

  handleLocationChange() {
    if (this.props.loadStatus === VisualizationLoadStatus.NOT_FOUND) return this.props.onVisualizationNotFound()
    if (isNil(this.props.visualization?.id) || !this.props.viewState) return
    if (this.shouldNotifyVisualizationChange()) this.handleVisualizationChange()

    const visualizationScope = this.props.visualization.id !== this.props.visualization?.scope ? this.props.visualization?.scope : undefined

    const newLocation = createLocation(
      this.props.fallbackVisualizationId,
      visualizationScope,
      this.props.viewState,
      this.props.currentFloor,
      this.props.selectedFilters,
      this.props.location,
    )

    if (`${newLocation.pathname}${newLocation.search}` === this.lastLocationUrl) return
    this.lastLocationUrl = `${newLocation.pathname}${newLocation.search}`
    this.lastLocationKey = this.props.location.key

    this.props.rewriteUrl(newLocation)
  }

  componentDidUpdate(): void {
    this.handleLocationChange()
  }

  componentDidMount(): void {
    this.handleLocationChange()
  }

  componentWillUnmount(): void {
    rewriteUrlDebounced.cancel()
  }

  render() {
    return this.props.children
  }
}

const mapState = (store: Store, props, navigation: PageNavigation): StateProps => ({
  visualizationId: navigation.getRouteParams().visualizationId,
  loadStatus: store.visualizationStore.loadStatus,
  tenant: navigation.getRouteParams().tenant,
  viewState: store.viewState,
  selectedFilters: store.filterStore.selectedFilters,
  visualization: store.visualizationStore.visualization,
  fallbackVisualizationId: navigation.getRouteParams().fallbackVisualizationId ?? store.visualizationStore.fallbackVisualizationId,
  authorization: store.auth.authorization,
  currentFloor: store.floorStore.getCurrent(),
  location: navigation.getLocation(),
  navigationType: navigation.getNavigationType(),
  children: props.children,
})

const mapActions = (dispatch: Dispatch, stateProps: StateProps, navigation: PageNavigation): ActionProps => ({
  notifyVisualizationChange: (location: Location) => {
    const params = getRouteParams(location, stateProps.visualizationId, stateProps.fallbackVisualizationId)
    const storedLocation = getStoredLocation(stateProps.tenant, stateProps.visualizationId, stateProps.fallbackVisualizationId)
    const storedParams = storedLocation ? getRouteParams(storedLocation, stateProps.visualizationId, stateProps.fallbackVisualizationId) : undefined
    dispatch(actions.visualization.routeChanged({
      params: isEmptyParams(params) ? storedParams ?? params : params,
      oldVisualizationType: stateProps.visualization?.type,
      oldParams: navigation.getRouteState()?.routeParams ? queryParamsToRouteParams(navigation.getRouteState()!.routeParams) : undefined,
      jumpBack: navigation.getRouteState()?.jumpBack !== false,
    }))
  },
  rewriteUrl: (newLocation: Location) => {
    rewriteUrlDebounced(navigation.urlNavigate.bind(navigation), newLocation, stateProps.tenant!, stateProps.visualizationId!, stateProps.fallbackVisualizationId)
  },
  onVisualizationNotFound: () => {
    navigation.navigate(PageType.NotFound, {tenant: stateProps.tenant})
  },
})

export const VisualizationRouteProvider = connect(mapState, mapActions)(Provider)
