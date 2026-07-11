import {isNumber} from 'lodash/fp'
import {Viewport} from '@deck.gl/core'
import {pixelsToWorld} from '@math.gl/web-mercator'
import * as vec2 from 'gl-matrix/vec2'
import { AxesDimensions } from '../../chart/domain/AxesDimension'
import { Box, Coordinates, Dimensions } from '@hopara/spatial'
import { Padding } from '@deck.gl/core/typed/viewports/viewport'
import {OrthographicViewportOptions as DeckOrthographicViewportOptions} from '@deck.gl/core/src/viewports/orthographic-viewport'
import { getDistanceScales, getProjectionMatrix, getViewMatrix, getZoomX, getZoomY, limitTarget } from './OrthographicProjection'
import { fitBounds } from './OrthographicFitBounds'
import { getSizeCommons, getSizePixels, getVisibleWorld, getVisibleWorldDimensions } from './Viewport'

export type OrthographicViewportOptions = DeckOrthographicViewportOptions & {
  fixedY?: boolean
  fixedX?: boolean
  translationMatrix?: number[]
  centerCoordinates?: Coordinates
  scaleFactor?: number
  limitNavigation: boolean
  axesDimensions?: AxesDimensions
  rotationOffset?: number
  isometric?: boolean
};

export class OrthographicViewport extends Viewport {
  scaleFactor: number
  centerCoordinates?: Coordinates
  flipY?: boolean
  fixedY?: boolean
  fixedX?: boolean
  limitNavigation?: boolean
  translationMatrix?: number[]
  axesDimensions?: AxesDimensions
  rotationOffset?: number
  isometric?: boolean

  constructor(props: Partial<OrthographicViewportOptions>) {
    let {
      width,
      height,
      near = 0.1,
      far = 1000,
      zoom = 0,
      target = [0, 0, 0],
      padding = null,
      flipY = true,
      fixedY = false,
      fixedX = false,
      limitNavigation = false,
      translationMatrix = [0, 0, 0],
      centerCoordinates = new Coordinates(),
      scaleFactor = 1,
      axesDimensions,
      rotationOffset = 0,
      isometric = false,
    } = {...props}

    const zoomX = getZoomX(zoom, fixedX)
    const zoomY = getZoomY(zoom, fixedY)
    const maxZoom = Math.max(zoomX, zoomY)
    const scale = Math.pow(2, maxZoom) / scaleFactor
    
    if (limitNavigation) {
      target = limitTarget(target, width, height, zoom as number, axesDimensions)
    }    

    super({
      ...props,
      // in case viewState contains longitude/latitude values,
      // make sure that the base Viewport class does not treat this as a geospatial viewport
      longitude: null,
      position: [
        fixedX && centerCoordinates && isNumber(centerCoordinates.x) ? centerCoordinates.x : target[0],
        fixedY && centerCoordinates && isNumber(centerCoordinates.y) ? centerCoordinates.y : target[1],
        target[2]],
      viewMatrix: getViewMatrix({
        scale,
        flipY,
        rotation: rotationOffset,
        isometric,
      }),
      projectionMatrix: getProjectionMatrix({
        width: width || 1,
        height: height || 1,
        padding,
        near,
        far,
        translationMatrix,
      }),
      zoom: maxZoom,
      distanceScales: getDistanceScales(zoomX, zoomY, scaleFactor, scale),
    })

    this.scale = scale
    this.scaleFactor = scaleFactor
    this.flipY = flipY
    this.centerCoordinates = centerCoordinates
    this.fixedY = fixedY
    this.fixedX = fixedX
    this.limitNavigation = limitNavigation
    this.translationMatrix = translationMatrix
    this.axesDimensions = axesDimensions
    this.rotationOffset = rotationOffset
    this.isometric = isometric
  }

  projectFlat([X, Y]) {
    const {unitsPerMeter} = (this as any).distanceScales
    return [X * unitsPerMeter[0], Y * unitsPerMeter[1]]
  }

  unprojectFlat([x, y]) {
    const {metersPerUnit} = (this as any).distanceScales
    return [x * metersPerUnit[0], y * metersPerUnit[1]]
  }

  /* Needed by LinearInterpolator */
  panByPosition(coords, pixel) {
    const fromLocation = pixelsToWorld(pixel, (this as any).pixelUnprojectionMatrix)
    const toLocation = this.projectFlat(coords)

    const translate = vec2.add([], toLocation, vec2.negate([], fromLocation))
    const newCenter = vec2.add([], (this as any).center, translate)

    return {target: this.unprojectFlat(newCenter)}
  }

  getVisibleWorld(): Box {
    return getVisibleWorld(this)
  }

  getVisibleWorldDimensions(): Dimensions {
    return getVisibleWorldDimensions(this)
  }

  getSizePixels(value: number, unit?: string, targetZoom?: number, scale?: boolean): number {
    return getSizePixels(this, value, unit, targetZoom, scale)
  }

  getSizeCommons(value: number, unit?: string, targetZoom?: number, scale?: boolean): number {
    return getSizeCommons(this, value, unit, targetZoom, scale)
  }

  isPolygonInRange(polygon: number[][]) {
    return this.getVisibleWorld().isPolygonInRange(polygon)
  }

  somePolygonInRange(polygons: number[][][]) {
    return polygons.some((polygon) => this.isPolygonInRange(polygon))
  }

  isCoordinateInRange(coordinates: Coordinates, visibleWorld?: Box) {
    const world = visibleWorld || this.getVisibleWorld()
    return !!world?.isPointInRange(coordinates)
  }

  fitBounds(
    /** [[x, y], [x, y]] */
   
  bounds: [[number, number], [number, number]],
   
  options: {
    /** If not supplied, will use the current width of the viewport (default `1`) */
    width?: number;
    /** If not supplied, will use the current height of the viewport (default `1`) */
    height?: number;
    /** In degrees, 0.01 would be about 1000 meters */
    minExtent?: number;
    /** Max zoom level */
    maxZoom?: number;
    /** Extra padding in pixels */
    padding?: number | Required<Padding>;
    /** Center shift in pixels */
    offset?: number[];
  } = {}) {
    const {zoom, target} = fitBounds(
      bounds,
      options.width ?? this.width,
      options.height ?? this.height,
      this.scaleFactor,
      options.maxZoom,
      options.minExtent,
      options.padding,
      options.offset)
    return new OrthographicViewport({...this, zoom, target} as any)
  }

  // eslint-disable-next-line no-restricted-syntax
  get ViewportType() {
    return OrthographicViewport
  }
}
