import { BackendDatasetRepository, createScopeFilter, DataLoaders, DatasetFilters, LoaderDatasetRepository, Queries, Query, Row } from '@hopara/dataset'
import { Layers } from '../layer/Layers'
import { getImageCandidates } from './ImageCandidates'
import { Authorization } from '@hopara/authorization'
import { Layer } from '../layer/Layer'
import { PositionNormalizer } from '@hopara/projector'
import { isEmpty, isEqual } from 'lodash'
import { ResourceRepository } from '../resource/ResourceRepository'
import { ImageEncoding } from '@hopara/encoding'
import { getInnerShapePercentages } from '../image/ImageShape'
import { ImageRepository } from '../image/ImageRepository'

interface FitRow {
  row: Row
  imageEncoding?: ImageEncoding
  imageDimensions?: {width: number, height: number}
}

export class FitToImageService {
  constructor(
  private readonly queries: Queries,
  private readonly loaders: DataLoaders,
  ) {
  }

  private getBackendDatasetRepository() { 
    return new BackendDatasetRepository()
  }

  private getDatasetRepository(query?:Query) {
    const loader = this.loaders.getLoader(query)
    if (loader) {
      return new LoaderDatasetRepository(loader.loader, loader.cache)
    } 
    return new BackendDatasetRepository()
  }

  private async getImageRow(layer: Layer, filters: DatasetFilters, authorization: Authorization): Promise<FitRow | undefined> {
    const positionNormalizer = new PositionNormalizer()
    const positionQuery = this.queries.findQuery(layer.getPositionQueryKey())
    const scopeFilter = layer.getPositionEncoding()?.scope ? createScopeFilter(layer.getPositionEncoding()!.scope!) : undefined
    if (scopeFilter) {
      const filter = filters.find((filter) => filter.column === scopeFilter.column)
      if (filter) filter.values = scopeFilter.values
      else filters.push(scopeFilter)
    }

    const params = { 
      filterSet: { filters, limit: 1 },
      query: positionQuery!,
      authorization,
    } 


    const positionResponse = await this.getBackendDatasetRepository().getRows(params)
      // Ensure rows exist and have at least one entry
    const rows = positionResponse?.rows ?? []
    if (rows.length === 0) return    
    const normalizedRow = positionNormalizer.normalize(rows[0], layer.encoding.position)
    if ( isEqual(layer.getQueryKey(), positionQuery?.toQueryKey()) ) {
      const imageMeta = await ImageRepository.getMetadata(layer.encoding.image!.getId(normalizedRow), layer.encoding.image!.scope!, authorization)
      return {
        row: normalizedRow,
        imageEncoding: layer.encoding.image,
        imageDimensions: {width: imageMeta.width, height: imageMeta.height},
      }
    }

    const query = this.queries.findQuery(layer.getQueryKey())
    try {
      const row = await this.getDatasetRepository(query).getRow(normalizedRow.getId()!, query!, filters, authorization)
      if (!row) return

      const imageMeta = await ImageRepository.getMetadata(layer.encoding.image!.getId(row), layer.encoding.image!.scope!, authorization)

      return {
        row: normalizedRow.merge(row),
        imageEncoding: layer.encoding.image,
        imageDimensions: {width: imageMeta.width, height: imageMeta.height},
      }
    } catch {
      // If the row is not found (e.g. still in the position table but deleted from the main table), we just ignore
      return
    }
  }

  async getFitRow(layers: Layers, targetLayer: Layer, filterMap: Record<string, DatasetFilters>, authorization: Authorization): Promise<FitRow | undefined> {
    const imageCandidates = getImageCandidates(layers, targetLayer!.visible?.zoomRange?.min?.value, layers.indexOf(targetLayer))
    if (isEmpty(imageCandidates)) return

    const rowsPromises = imageCandidates.map(async (imageCandidate) => this.getImageRow(imageCandidate, filterMap[imageCandidate.getId()], authorization))

    const rows = (await Promise.all(rowsPromises)).filter((rowsResponse) => rowsResponse)
    return rows[0]
  }

  async getShape(layers:Layers, targetLayer: Layer, filterMap: Record<string, DatasetFilters>, authorization: Authorization) {
      const fitRow = await this.getFitRow(layers, targetLayer, filterMap, authorization)
      if (!fitRow) return

      const resourceId = fitRow.imageEncoding?.getId(fitRow.row)
      const view = fitRow.imageEncoding?.getView(fitRow.row)

      try {
        const shape = await ResourceRepository.getShape(resourceId, fitRow.imageEncoding?.scope, view, authorization)
        return { row: fitRow.row, shape, dimensions: fitRow.imageDimensions }
      } catch {
        return { row: fitRow.row }
      }
  }

  async getInnerShape(fitGeometry: any, viewport: any, layers:Layers, targetLayer: Layer, filterMap: Record<string, DatasetFilters>, authorization: Authorization) {
    const fitRow = await this.getFitRow(layers, targetLayer, filterMap, authorization)
    if (!fitRow) return

    const resourceId = fitRow.imageEncoding?.getId(fitRow.row)
    const geometry = getInnerShapePercentages(fitRow.row.getCoordinates().getGeometryLike(), fitGeometry, viewport)

    try {
      const fitGeometry = await ResourceRepository.getShapeFromGeometry(geometry, resourceId, fitRow.imageEncoding?.scope, authorization)
      return { row: fitRow.row, shape: fitGeometry, dimensions: fitRow.imageDimensions }
    } catch {
      return { row: fitRow.row }
    }
  }
}
