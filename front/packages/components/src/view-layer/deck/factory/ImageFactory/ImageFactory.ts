import {BaseFactory} from '../BaseFactory'
import {DeckLayer} from '../../DeckLayer'
import {Row} from '@hopara/dataset'
import {DeckLayerProps} from '../../../DeckLayerFactory'
import {Anchor, Bounds} from '@hopara/spatial'
import {CoordinatesPositionEncoding, ImageEncoding} from '@hopara/encoding'
import {OrthographicViewport} from '../../../../view/deck/OrthographicViewport'
import {BitmapManager} from './BitmapManager/BitmapManager'
import {DetailsCallbackFactory} from '../../interaction/DetailsCallbackFactory'
import {EditableImageFactory} from '../EditableFactory/EditableImageFactory'
import {ViewLayerEditingMode} from '../../../ViewLayerStore'
import {isNil} from 'lodash/fp'
import {ImageFetch} from '@hopara/resource'
import {ImageRotation} from '../../../../image/ImageRotation'
import { ImageLoader } from './ImageLoader'
import GL from '@luma.gl/constants'
import ViewState from '../../../../view-state/ViewState'
import { BitmapManagerFactory } from './BitmapManager/BitmapManagerFactory'
import { Image } from './Image'
import MultiBitmapLayer from './MultiBitmapLayer'

const editableImageFactory = new EditableImageFactory()

// Anchor in quad param space: the texture point that lands on the projected quad center
const ANCHOR_POINTS: { [anchor in Anchor]: [number, number] } = {
  [Anchor.CENTROID]: [0.5, 0.5],
  [Anchor.BOTTOM_CENTER]: [0.5, 0],
  [Anchor.TOP_CENTER]: [0.5, 1],
  [Anchor.LEFT_CENTER]: [0, 0.5],
  [Anchor.RIGHT_CENTER]: [1, 0.5],
}
type ImageMap = {
  [imageId: string]: {
    rows: Row[]
    image: Image
  }
}

export class ImageFactory extends BaseFactory<DeckLayerProps> {
  bitmapManagers: { [layerId: string]: BitmapManager } = {}
  abortControllers: { [fetchUrl: string]: AbortController } = {}

  getImageUpdateTrigger(viewState: ViewState) {
    return [viewState.getPositionKey()]
  }

  getBounds(props: DeckLayerProps, row: Row, positionEncoding?: CoordinatesPositionEncoding) {
    if (!positionEncoding) return []

    const bounds = row.getCoordinates().getGeometryLike() as any
    if (!bounds?.length) return []

    return Bounds.fromGeometry(bounds as any, {orthographic: props.viewport instanceof OrthographicViewport})
  }

  getBitmapManager(id: string, imageEncoding: ImageEncoding, maxTextureSize: number, isOrthographic:boolean) {
    if (!this.bitmapManagers[id]) this.bitmapManagers[id] = BitmapManagerFactory.getManager(imageEncoding, maxTextureSize, isOrthographic)
    return this.bitmapManagers[id]
  }

  getLastModified(props: DeckLayerProps, row: Row) {
    const library = props.encoding.image?.scope
    const resourceId = props.encoding.image?.getId(row)
    const uploadState = props.resource.resourceUploadState?.find((state) => state.library === library && state.resourceId === resourceId)
    const generateState = props.resource.resourceGenerateState?.find((state) => state.library === library && state.resourceId === resourceId)
    const historyState = props.resource.imageHistory
    const lastModifieds: Date[] = []
    if (historyState?.lastModified) lastModifieds.push(historyState.lastModified)
    if (uploadState?.lastModified) lastModifieds.push(uploadState?.lastModified)
    if (generateState?.lastModified) lastModifieds.push(generateState?.lastModified)
    return lastModifieds.length ? new Date(Math.max(...lastModifieds as any)) : undefined
  }

  getImageUrl(props: DeckLayerProps, row: Row, bounds, image: Image) {
    const imageUrl = new ImageFetch().getUrl({...image, webGLMaxTextureSize: props.resource.maxTextureSize}, props.resource.imageHistory)?.toString()
    const isOrthographic = props.viewport instanceof OrthographicViewport
    const boundsPolygon = bounds.length ? bounds.map((b) => b.toPolygon()) : bounds
    const lastModified = this.getLastModified(props, row)
    return this.getBitmapManager(image.getId(), props.encoding.image!, props.resource.maxTextureSize, isOrthographic)
               .getLoadUrl(imageUrl, props.viewport, boundsPolygon, lastModified, props.edit.isDragging, !!props.visible?.value)
  }

  getImageMap(props: DeckLayerProps) {
    const imageMap: ImageMap = {}

    for (const row of props.rows) {
      const lastModified = this.getLastModified(props, row)
      const rotation = new ImageRotation(Number(props.encoding.image?.getView(row)))
      const view = rotation.getAngleWithOffset(props.viewState.rotationOffset)
      const image = new Image({
        id: props.encoding.image?.getId(row),
        fallback: props.encoding.image?.getFallback(row),
        library: props.encoding.image?.scope,
        view: String(view),
        resolution: props.encoding.image?.resolution,
        tenant: props.resource.authorization.tenant,
        version: lastModified,
      })

      if (imageMap[image.getId()]) {
        imageMap[image.getId()] = { rows: imageMap[image.getId()].rows.concat(row), image }
      } else {
        imageMap[image.getId()] = { rows: [row], image }
      }
    }

    return imageMap
  }

  getDownloadProgressCallback(props: DeckLayerProps, imageId: string) {
    const bitmapManager = this.bitmapManagers[imageId]
    if ( !bitmapManager ) return props.resource.onResourceDownloadProgressChange
  } 

  getAbortController(props: DeckLayerProps, imageId: string) {
    return () => {
      const id = `${props.id}#${imageId}`
      if (this.abortControllers[id]) {
        this.abortControllers[id].abort()
      }
      this.abortControllers[id] = new AbortController()
      return this.abortControllers[id]
    }
  }

  getImageProps(props: DeckLayerProps, imageId: string) {
    const opacity = props.edit.editingMode === ViewLayerEditingMode.CROP ? 0.15 : (props.encoding?.color?.opacity ?? 1)
    const fetch = new ImageFetch().fetch(this.getDownloadProgressCallback(props, imageId), this.getAbortController(props, imageId)).bind(this)
    return {
      desaturate: !isNil(props.encoding.color?.saturation) ? 1 - props.encoding.color!.saturation : 0,
      loadOptions: { fetch, progress: {accentColor: props.editAccentColor} },
      loaders: [ImageLoader],
      pickable: props.edit.pickable,
      opacity,
      parameters: opacity === 1 ? {
        blendFunc: [GL.ONE, GL.ONE_MINUS_SRC_ALPHA], // we change the blend function to avoid the grey border
      } : {},
    }
  }

  getImageLayer(props: DeckLayerProps, rows: Row[], image: Image) {
    const allBounds = rows.map((row) => this.getBounds(props, row, props.encoding?.position!.coordinates)).filter((bounds) => bounds.length)
    return new MultiBitmapLayer(super.getDeckProps(props, {
        ...this.getImageProps(props, image.getId()),
        id: `${props.id}-${image.getId()}`,
        data: rows,
        getBounds: (row) => this.getBounds(props, row, props.encoding?.position!.coordinates),
        unskewMatrix: props.viewport instanceof OrthographicViewport ? props.viewport.getUnskewMatrix() : [1, 0, 0, 1],
        anchorPoint: ANCHOR_POINTS[props.encoding.position?.anchor ?? Anchor.CENTROID] ?? ANCHOR_POINTS[Anchor.CENTROID],
        image: this.getImageUrl(props, rows[0], allBounds, image),
        updateTriggers: {
          getBounds: super.getPositionUpdateTrigger(props.encoding.position, props.edit.isDragging, props.rows),
        },
        ...DetailsCallbackFactory.createCallbacks(props.callbacks, props),
      })) as any
  }

  getSelectionLayers(props: DeckLayerProps) {
    const selectedRow = props.edit.rowSelection?.rowId && props.layerId === props.edit.rowSelection?.layerId && props.rows.getById(props.edit.rowSelection?.rowId)
    if (!selectedRow) return null

    const id = `${props.id}-${selectedRow._id}`
    const bounds = this.getBounds(props, selectedRow, props.encoding?.position!.coordinates)
    const lastModified = this.getLastModified(props, selectedRow)
    const rotation = new ImageRotation(Number(props.encoding.image?.getView(selectedRow)))
    const view = rotation.getAngleWithOffset(props.viewState.rotationOffset)
    const imageFetchUrl = new ImageFetch().getUrl({
      id: props.encoding.image?.getId(selectedRow),
      fallback: props.encoding.image?.getFallback(selectedRow),
      library: props.encoding.image?.scope,
      view: String(view),
      tenant: props.resource.authorization.tenant,
      version: lastModified,
      webGLMaxTextureSize: props.resource.maxTextureSize,
    }, props.resource.imageHistory)?.toString()

    return editableImageFactory.create({
      ...props,
      row: selectedRow,
      id,
      selected: true,
      bounds: bounds as any,
      imageProps: {
        ...this.getImageProps(props, imageFetchUrl),
        bounds,
        image: imageFetchUrl,
      },
    })
  }

  create(props: DeckLayerProps): DeckLayer[] {
    const layers: DeckLayer[] = []

    const imageMap = this.getImageMap(props)
    for (const imageId of Object.keys(imageMap)) {
      layers.push(this.getImageLayer(props, imageMap[imageId].rows, imageMap[imageId].image))
    }

    const selectionLayers = this.getSelectionLayers(props)
    if (selectionLayers?.length) layers.push(...selectionLayers)

    return layers.flat()
  }
}
