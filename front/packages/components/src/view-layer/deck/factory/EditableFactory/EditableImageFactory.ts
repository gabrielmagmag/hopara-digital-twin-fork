import * as DeckExtensions from '@deck.gl/extensions'
import { FixedRowTranslator, Row } from '@hopara/dataset'
import { Bounds, OrthographicBounds, RowCoordinates, WebMercatorBounds } from '@hopara/spatial'
import {BaseFactory} from '../BaseFactory'
import {DeckLayer} from '../../DeckLayer'
import { DeckLayerProps } from '../../../DeckLayerFactory'
import { OrthographicViewport } from '../../../../view/deck/OrthographicViewport'
import { EditableGeoJsonLayer } from '../EditableFactory/EditableGeoJsonLayer'
import { EditableGeometryFactory } from '../EditableFactory/EditableGeometryFactory'
import { TransformMode } from '../EditableFactory/TransformMode/TransformMode'
import { TranslateMode } from '../EditableFactory/TransformMode/TranslateMode'
import { ScaleMode } from '../EditableFactory/TransformMode/ScaleMode'
import { RotateMode } from '../EditableFactory/TransformMode/RotateMode'
import { CallbacksFactory, DeckLayerCallbacks } from '../../interaction/CallbacksFactory'
import { ViewLayerEditingMode } from '../../../ViewLayerStore'
import { BitmapLayer, GeoJsonLayer } from '@deck.gl/layers'
import { DistortMode } from './TransformMode/DistortMode'
import { polygon } from '@turf/helpers'
import { geometricFromViewport } from '../../../../geometric/GeometricFactory'
import { getUnskewLayerProps } from '../../unskew/UnskewExtension'

const ImageTransformMode = new TransformMode([new TranslateMode(), new ScaleMode(), new RotateMode()])
const ImageCropMode = new TransformMode([new TranslateMode(), new ScaleMode(), new DistortMode()])

interface EditableImageFactoryProps extends DeckLayerProps {
  row: Row
  id: string
  selected: boolean
  bounds: WebMercatorBounds | OrthographicBounds
  imageProps: any
}

export class EditableImageFactory extends BaseFactory<DeckLayerProps> {
  dragging = false

  isCropMode(props: EditableImageFactoryProps) {
    return props.edit.editingMode === ViewLayerEditingMode.CROP
  }

  // Renders the overlay with the same anti-skew the image layer applies in its
  // vertex shader, so selection/crop overlays hug the upright image while the
  // edited geometry stays in plain 2D space (nothing to reskew on save)
  getUnskewProps(props: EditableImageFactoryProps) {
    return getUnskewLayerProps(props.viewport, [...props.bounds], props.encoding.position?.anchor)
  }

  handleCropEdit(props: EditableImageFactoryProps, callbacks: DeckLayerCallbacks, event: any) {
    const featureIndex = event.updatedData?.features.length > 1 ? 1 : 0
    const bounds = event.updatedData?.features[featureIndex].geometry.coordinates[0]
    const geometric = geometricFromViewport(props.viewport)
    const boundsCentroid = geometric.getCentroid(event.updatedData?.features[featureIndex])
    const info = {
      layer: { props: { layerId: props.layerId, pickable: props.edit.pickable } },
      layerId: props.layerId,
      rowsetId: props.rowsetId,
      boundsColumn: props.encoding?.position?.coordinates?.field,
      editType: event.editType,
      bounds,
      coordinate: boundsCentroid.geometry.coordinates,
      row: props.row,
    } as any

    if (['translated', 'scaled', 'rotated', 'extruded', 'distorted'].indexOf(event.editType) > -1) {
      return callbacks.onCropEditEnd && callbacks.onCropEditEnd(info, {} as any)
    }

    return callbacks.onCropEdit && callbacks.onCropEdit(info, {} as any)
  }

  handleEdit(props: EditableImageFactoryProps, callbacks: DeckLayerCallbacks, event: any) {
    const bounds = event.updatedData!.features[0].geometry.coordinates[0]
    const detailedBounds = props.row.getCoordinates().getDetailedGeometry() ? event.updatedData!.features[1].geometry.coordinates[0] : undefined
    const rowCoordinates = new RowCoordinates({geometry: bounds, detailedGeometry: detailedBounds})
    const pixel = props.viewport!.project(rowCoordinates.to2DArray())
    const info = {
      layer: { props: { layerId: props.layerId, pickable: props.edit.pickable } },
      layerId: props.layerId,
      rowsetId: props.rowsetId,
      boundsColumn: props.encoding?.position?.coordinates?.field,
      editType: event.editType,
      bounds,
      coordinate: rowCoordinates.to2DArray(),
      rowCoordinates,
      pixel,
    }

    if (['translated', 'scaled', 'rotated', 'extruded'].indexOf(event.editType) > -1) {
      this.dragging = false
      return callbacks.onEditEnd && callbacks.onEditEnd(info as any, {} as any)
    }

    if (!this.dragging) {
      this.dragging = true
      return callbacks.onEditStart && callbacks.onEditStart(info as any, {} as any)
    }

    return callbacks.onEdit && callbacks.onEdit(info as any, {} as any)
  }

  handleOnEdit(props: EditableImageFactoryProps, event: any) {
    if (!event.updatedData?.features[0].geometry.coordinates[0]) return
    const callbacks = CallbacksFactory.create(this.getEditCallbackProps(props), new FixedRowTranslator(props.row))

    if (this.isCropMode(props)) this.handleCropEdit(props, callbacks, event)
    else this.handleEdit(props, callbacks, event)
  }

  getEditMode(editingMode?: ViewLayerEditingMode) {
    return editingMode === ViewLayerEditingMode.CROP ? ImageCropMode : ImageTransformMode
  }

  getCropBounds(props: EditableImageFactoryProps) {
    if (!this.isCropMode(props) || !props.edit.rowEdit?.cropGeometry) {
      return undefined
    }
    
    return Bounds.fromGeometry(props.edit.rowEdit.cropGeometry, {orthographic: props.viewport instanceof OrthographicViewport})
  }

  createEditableLayer(props: EditableImageFactoryProps) {
    const boundsColumn = props.encoding?.position?.coordinates?.field
    const bounds = props.bounds.toFeatureCollection()

    if (props.row.getCoordinates().getDetailedGeometry()) {
      bounds.features.push(polygon([props.row.getCoordinates().getDetailedGeometry()]))
    }

    const cropBounds = this.getCropBounds(props)
    if (cropBounds) bounds.features.push(cropBounds.toFeatureCollection().features[0])

    return new EditableGeoJsonLayer(super.getDeckProps(props, {
      id: `${props.id}-editable-${props.edit.editingMode}`,
      data: bounds,
      mode: this.getEditMode(props.edit.editingMode),
      modeConfig: {
        viewport: props.viewport,
        screenSpace: props.viewport instanceof OrthographicViewport,
        fixedGuides: true,
      },
      visible: props.visible && props.selected,
      pickable: true,
      boundsColumn,
      selected: props.selected,
      editable: true,
      selectedFeatureIndexes: props.edit.editingMode === ViewLayerEditingMode.CROP && cropBounds ? [1] : props.row.getCoordinates().getDetailedGeometry() ? [0, 1] : [0],
      getFillColor: [0, 0, 0, 0],
      getLineWidth: 0,
      getLineColor: [0, 0, 0, 0],
      onEdit: (event) => this.handleOnEdit(props, event),
      onUpdateCursor: props.callbacks.onUpdateCursor,
      ...EditableGeometryFactory.getEditingHandlerProps(props.editAccentColor, props.viewport, props.edit.editingMode, cropBounds ?? props.bounds),
      ...this.getUnskewProps(props),
    }))
  }

  createMaskLayers(props: EditableImageFactoryProps) {
    if (!props.bounds.length || !this.isCropMode(props)) return []

    const cropBounds = this.getCropBounds(props)
    if (!cropBounds) return []

    // The mask operation layer stays raw: masking is evaluated in data space
    // (raw mask geometry against raw sampling positions), while the unskew only
    // moves where the visible layers render
    const unskewProps = this.getUnskewProps(props) as any
    const unskewExtensions = unskewProps.extensions ?? []

    return [
      new GeoJsonLayer({
        ...unskewProps,
        id: `${props.id}-mask-fill`,
        data: props.bounds.toFeatureCollection(),
        getFillColor: [0, 0, 0, 20],
        stroked: false,
      }),
      new GeoJsonLayer({
        ...unskewProps,
        id: `${props.id}-mask-fill-inner`,
        data: props.bounds.toFeatureCollection(),
        getFillColor: [255, 255, 255, 255],
        stroked: false,
        extensions: [...unskewExtensions, new (DeckExtensions as any).MaskExtension()],
        maskId: 'mask',
      }),
      new BitmapLayer({
        ...props.imageProps,
        ...unskewProps,
        opacity: 1,
        id: `${props.id}-mask`,
        extensions: [...unskewExtensions, new (DeckExtensions as any).MaskExtension()],
        maskId: 'mask',
      } as any),
      new GeoJsonLayer({
        id: 'mask',
        data: cropBounds.toFeatureCollection(),
        operation: 'mask',
      }),
    ]
  }

  create(props: EditableImageFactoryProps) {
    const layers: DeckLayer[] = []
    if (!props.edit.editable || !props.edit.editing || !props.selected || !props.bounds.length) return layers
    
    layers.push(...this.createMaskLayers(props))
    layers.push(this.createEditableLayer(props))

    return layers
  }
}
