import {polygonCentroid, lineAngle, polygonRotate, polygonBounds, lineLength, lineMidpoint} from 'geometric'
import { BaseBounds } from './BaseBounds'
import { getExtrudedBoundsGeometry, getExtrudedBoundsGeometryKeepingLargeSide } from './Extrude'
import { BoundsOrientation } from '../Bounds'

export class OrthographicBounds extends BaseBounds {
  static nearestPoint(point: number[], geometry: number[][]) {
    const sortByDistance = [...geometry].sort((a, b) => lineLength([point as any, a as any]) - lineLength([point as any, b as any]))
    return sortByDistance[0]
  }

  private static getPolygonBounds(geometry: number[][], flipY = false) {
    const [[minX, minY], [maxX, maxY]] = polygonBounds(geometry as any) as any
    return flipY ? [minX, maxY, maxX, minY] : [minX, minY, maxX, maxY]
  }

  static fromGeometry(geometry: number[][], flipY = false): OrthographicBounds {
    const [minX, minY, maxX, maxY] = this.getPolygonBounds(geometry, flipY)
    const bottomLeftPoint = this.nearestPoint([minX, minY], geometry)
    const topLeftPoint = this.nearestPoint([minX, maxY], geometry)

    // When both nearest points resolve to the same vertex, lineAngle returns 0
    // for the zero-length segment, producing a bogus bearing of 90° that swaps
    // width/height. Fall back to an axis-aligned bounding box in this case.
    if (bottomLeftPoint[0] === topLeftPoint[0] && bottomLeftPoint[1] === topLeftPoint[1]) {
      return new OrthographicBounds([minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY])
    }

    const bearing = lineAngle([bottomLeftPoint as any, topLeftPoint as any]) + 90
    let centroid
    if ( minX == maxX || minY == maxY ) {
      centroid = lineMidpoint([[minX, minY], [maxX, maxY]])
    } else {  
      centroid = polygonCentroid([[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]])
    }
    
    const rotatedPolygon = polygonRotate(geometry as any, bearing * -1, centroid as any)
    const [[rMinX, rMinY], [rMaxX, rMaxY]] = polygonBounds(rotatedPolygon as any) as any
    const rotatedBBoxPolygon = polygonRotate([[rMinX, rMinY], [rMinX, rMaxY], [rMaxX, rMaxY], [rMaxX, rMinY], [rMinX, rMinY]], bearing, centroid as any)

    const bounds = rotatedBBoxPolygon.slice(0, 4)
    const zeroPoint = this.nearestPoint(flipY ? topLeftPoint : geometry[0], bounds)
    const zeroPointIndex = bounds.findIndex((point) => point[0] === zeroPoint[0] && point[1] === zeroPoint[1])
    const orderedBounds = bounds.slice(zeroPointIndex, bounds.length).concat(bounds.slice(0, zeroPointIndex))

    return new OrthographicBounds(...orderedBounds)
  }

  getCentroid() {
    const [[minX, minY], [maxX, maxY]] = polygonBounds(this) as any
    if ( minX == maxX || minY == maxY ) {
      return lineMidpoint([[minX, minY], [maxX, maxY]])
    } else {
      return polygonCentroid([...this as any, this[0]])
    }
  }  

  extrudeGeometry(refWidth: number, refHeight: number, forceWidth = true) {
    const normalized = this.rotateToBearing(0)
    const extrudedBounds = forceWidth ? getExtrudedBoundsGeometry(normalized, refWidth, refHeight) : getExtrudedBoundsGeometryKeepingLargeSide(normalized, refWidth, refHeight)
    const rotatedPolygon = polygonRotate(extrudedBounds as any, this.getBearing() as any)
    const plainBounds = rotatedPolygon.slice(0, 4)

    return new OrthographicBounds(...plainBounds as any)
  }

  rotateToBearing(targetBearing = 0): OrthographicBounds {
    const rotatedPolygon = polygonRotate([...this as any, this[0]], targetBearing - this.getBearing(), this.getCentroid() as any)
    const plainBounds = rotatedPolygon.slice(0, 4)
    return new OrthographicBounds(...plainBounds as any)
  }

  getWidth(): number {
    return lineLength([this.getTopLeft() as any, this.getTopRight() as any])
  }

  getHeight(): number {
    return lineLength([this.getTopLeft() as any, this.getBottomLeft() as any])
  }

  getBearing() {
    return lineAngle([this.getTopLeft() as any, this.getTopRight() as any])
  }

  getAngle() {
    return lineAngle([this.getTopLeft() as any, this.getTopRight() as any])
  }

  scaleToRatio(targetRatio: number): OrthographicBounds {
    const normalized = this.rotateToBearing(0)
    
    const width = normalized.getWidth()
    const height = normalized.getHeight()
    const centroid = normalized.getCentroid()
    const ratio = width / height

    const newWidth = ratio > targetRatio ? height * targetRatio : width
    const newHeight = ratio > targetRatio ? height : width / targetRatio
    const minX = centroid[0] - (newWidth / 2)
    const minY = centroid[1] - (newHeight / 2)
    const maxX = centroid[0] + (newWidth / 2)
    const maxY = centroid[1] + (newHeight / 2)

    const scaledBoundsPolygon = [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]] as any
    const rotated = polygonRotate(scaledBoundsPolygon, this.getBearing(), centroid)

    const bounds = rotated.slice(0, 4)
    const zeroPoint = OrthographicBounds.nearestPoint(this[0], bounds)
    const zeroPointIndex = bounds.findIndex((point) => point[0] === zeroPoint[0] && point[1] === zeroPoint[1])
    const orderedBounds = bounds.slice(zeroPointIndex, bounds.length).concat(bounds.slice(0, zeroPointIndex))

    return new OrthographicBounds(...orderedBounds)
  }

  getOrientation(): BoundsOrientation {
    const width = this.getWidth()
    const height = this.getHeight()
    if (width > height) {
      return BoundsOrientation.LANDSCAPE
    } else if (width < height) {
      return BoundsOrientation.PORTRAIT
    }
    return BoundsOrientation.SQUARE
  }

  fixOrientation(referenceBounds: OrthographicBounds): OrthographicBounds {
    const orientation = this.getOrientation()
    const referenceOrientation = referenceBounds.getOrientation()
    if (orientation === referenceOrientation) {
      return this
    }
    
    // reordering the points to rotate the bounds and make it match the reference orientation
    const newBounds = this.getBearing() >= 0 ?
      [this.getTopLeft(), this.getTopRight(), this.getBottomRight(), this.getBottomLeft()] :
      [this.getBottomRight(), this.getBottomLeft(), this.getTopLeft(), this.getTopRight()]
    
    return new OrthographicBounds(...newBounds)
  }

  rotateGeometry(geometry: number[][], reverse = false): number[][] {
    const polygonBearing = lineAngle([this.getTopLeft() as any, this.getTopRight() as any])
    const rotatedPolygon = polygonRotate(geometry as any, reverse ? polygonBearing * -1 : polygonBearing, this.getCentroid() as any)
    return rotatedPolygon
  }
}
