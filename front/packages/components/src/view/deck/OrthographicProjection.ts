import {Matrix4, clamp} from 'math.gl'
import { AxesDimensions } from '../../chart/domain/AxesDimension'

const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 1]})

export const getProjectionMatrix = ({
  width,
  height,
  near,
  far,
  padding,
  translationMatrix,
}: {
  width: number;
  height: number;
  near: number;
  far: number;
  padding: any | null;
  translationMatrix: any;
}) => {
  let left = -width / 2
  let right = width / 2
  let bottom = -height / 2
  let top = height / 2
  if (padding) {
    const {left: l = 0, right: r = 0, top: t = 0, bottom: b = 0} = padding
    const offsetX = clamp((l + width - r) / 2, 0, width) - width / 2
    const offsetY = clamp((t + height - b) / 2, 0, height) - height / 2
    left -= offsetX
    right -= offsetX
    bottom += offsetY
    top += offsetY
  }

  return new Matrix4().ortho({
    left,
    right,
    bottom,
    top,
    near,
    far,
  }).clone().translate(translationMatrix)
}

function scale(value:number, zoom:number) {
  return value / Math.pow(2, zoom)
}

function getLowerBoundary(dimension:number, zoom:number, padding: number) {
  return scale((dimension / 2), zoom) - padding
}

function getUpperBoundary(dimension:number, zoom:number, padding: number) {
  return dimension - scale((dimension / 2), zoom) + scale(padding, zoom)
}

export const limitTarget = (target, width, height, zoom, axesDimensions?: AxesDimensions) => {
  target[0] = Math.max(target[0], getLowerBoundary(width, zoom, axesDimensions?.y.width || 0))
  target[0] = Math.min(target[0], getUpperBoundary(width, zoom, 0))

  target[1] = Math.max(target[1], getLowerBoundary(height, zoom, axesDimensions?.x.height || 0))
  target[1] = Math.min(target[1], getUpperBoundary(height, zoom, 0))

  return target
}
export const getViewMatrix = ({scale, flipY, rotation = 0}: {scale: number, flipY: boolean, rotation?: number}) => {
  const mat = viewMatrix.clone().scale([scale, scale * (flipY ? -1 : 1), scale])
  if (rotation) mat.rotateZ(rotation * Math.PI / 180)
  return mat
}

export const getZoomX = (zoom, fixed: boolean) : number => {
  if (fixed) {
    return 0
  }

  return Array.isArray(zoom) ? zoom[0] : zoom
}

export const getZoomY = (zoom, fixed: boolean) : number => {
  if (fixed) {
    return 0
  }

  return Array.isArray(zoom) ? zoom[1] : zoom
}

export const getDistanceScales = (zoomX: number, zoomY: number, scaleFactor: number, scale: number) => {
  if (zoomX === zoomY) {
    return
  }

  const scaleX = Math.pow(2, zoomX) / scaleFactor
  const scaleY = Math.pow(2, zoomY) / scaleFactor

  return {
    unitsPerMeter: [scaleX / scale, scaleY / scale, 1],
    metersPerUnit: [scale / scaleX, scale / scaleY, 1],
  }
}
