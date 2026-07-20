import {getMeta} from '@hopara/resource'
import {GetCoordinatesTransformProps, Transform} from './Transform'
import { Coordinates, RowCoordinates } from '@hopara/spatial'
import { drawTargetGeometry } from './DrawGeometry'
import { toUnskewedGeometry } from './PlacementGeometry'
import { ImageEncoding } from '@hopara/encoding'

export class ImageTransform implements Transform {
  encoding: ImageEncoding

  constructor(encoding: ImageEncoding) {
    this.encoding = encoding
  }

  async getCoordinates({position, row, viewState, targetZoom, placeCoordinates, authorization}: GetCoordinatesTransformProps): Promise<RowCoordinates> {
    if (!position.hasCoordinates()) return new RowCoordinates()
    
    let ratio
    if (this.encoding.getId(row)) {
      try {
        const meta = await getMeta(this.encoding.getId(row), this.encoding.scope, authorization?.tenant)
        ratio = meta.ratio
      } catch {
        ratio = 1
      }
    }

    const targetGeometry = drawTargetGeometry([viewState.dimensions.width / 2, viewState.dimensions.height / 2], ratio)
    const geometry = targetGeometry.map((coordinate) => {
      return viewState.unprojectCoordinate(Coordinates.fromArray(coordinate), targetZoom, placeCoordinates.toArray() as any)
    })
    return new RowCoordinates({geometry: toUnskewedGeometry(geometry as number[][], viewState)})
  }
}
