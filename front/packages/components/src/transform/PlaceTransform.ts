 
import {Columns, Rows} from '@hopara/dataset'
import {TransformType} from '@hopara/encoding/src/transform/Transform'
import ViewState from '../view-state/ViewState'
import { Coordinates, RowCoordinates } from '@hopara/spatial'
import { memoize } from '@hopara/memoize'
import { Exclude } from 'class-transformer'
import { FrontOnlyTransform } from './FrontOnlyTransform'
import { drawGeometryFromDimensions } from '../place-transform/DrawGeometry'
import { toUnskewedGeometry } from '../place-transform/PlacementGeometry'

export class PlaceTransform extends FrontOnlyTransform {
  @Exclude()
  cacheStore: Map<string, any>

  type: TransformType.place
  padding?: number
  zoom?: number

  constructor(props: Partial<PlaceTransform>) {
    super()
    Object.assign(this, props)
    this.type = TransformType.place
    this.cacheStore = new Map()
  }

  getParams() {
    return {}
  }

  isRowPlacing(): boolean {
      return true
  }

  getGeometry(viewState:ViewState) {
    const targetCentroid: [number, number] = [viewState.dimensions.width / 2, viewState.dimensions.height / 2]
    const targetGeometry = drawGeometryFromDimensions(targetCentroid, viewState.getDimensions()!, this.padding)
    const geometry = targetGeometry.map((coordinate) => {
      return viewState.unprojectCoordinate(
        Coordinates.fromArray(coordinate),
        this.zoom,
        viewState.unprojectCoordinate(Coordinates.fromArray(targetCentroid)),
      )
    })
    return toUnskewedGeometry(geometry as number[][], viewState)
  }

  apply(rows: Rows, columns: Columns, viewState: ViewState) : Rows {
    if (!viewState.viewport) return rows

    const placedRows = rows.map((row) => {
      if (row.isPlaced()) {
        return row
      }

      // Persist the image geometry so it doesnt move on zoom
      const cachedGetGeometry = memoize(this.getGeometry.bind(this), {cacheKey: row._id, cacheStore: this.cacheStore})
      const geometry = cachedGetGeometry(viewState)
      return row.updateCoordinates(new RowCoordinates({geometry}))
    })

    return new Rows(...placedRows)
  }
}
