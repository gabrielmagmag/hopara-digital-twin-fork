import { Row } from '@hopara/dataset'
import { LayerType } from '../layer/LayerType'
import { BaseViewLayerProps } from './LayerFactory'
import { getSelectedRow } from './deck/interaction/RowSelection'
import { getSizeAccessor, MaxLengthType, PositionAccessorFactory } from '@hopara/encoding'
import { getTextDimensions } from '../zoom/translate/TextDimensions'
import { SizeUnits } from '@hopara/encoding/src/size/SizeEncoding'
import { fromString } from '@hopara/encoding/src/color/Colors'
import { getMaxPixels } from './deck/factory/BaseFactory'
import { decorateOffset } from './deck/offset/OffsetDecorator'
import { CubeLayer } from './deck/cube/cube-layer'
import { PolygonLayer } from '@deck.gl/layers'
import { Anchor, Bounds } from '@hopara/spatial'
import { OrthographicViewport } from '../view/deck/OrthographicViewport'
import { LayerFactoryChain } from './LayerFactoryChain'
import { PathLayer } from 'deck.gl'
import { getUnskewLayerProps } from './deck/unskew/UnskewExtension'

export const SELECTION_LAYER_ID_SUFFIX = '#selectionFeedback'

export class SelectionFeedbackDecorator<P extends BaseViewLayerProps> extends LayerFactoryChain<P> {
  constructor(private rowSelection: any, private rowHovering: any) {
    super()
  }

  editableLayerTypes = [LayerType.circle, LayerType.icon, LayerType.text, LayerType.line]
  coordinateBasedLayerTypes = [LayerType.image, LayerType.polygon]

  getDeckProps(props: P, selectedRow?: Row, feedbackType: 'hover' | 'edit' = 'hover') {
    return {
      data: [selectedRow],
      id: `${props.id}-${SELECTION_LAYER_ID_SUFFIX}-#${feedbackType}`,
      pickable: false,
      visible: props.visible?.value,
      updateTriggers: {
        getSize: [selectedRow?._id],
        getPosition: [selectedRow?._id],
        getPositionAnchor: [selectedRow?._id],
        getPolygon: [selectedRow?._id],
        getColor: [selectedRow?._id],
        getPath: [selectedRow?._id],
      },
      zIndex: 1000,
    }
  }

  getCircleDeckProps(props: P, selectedRow?: Row, feedbackType: 'hover' | 'edit' = 'hover') {
    const deckProps = {
      ...this.getDeckProps(props, selectedRow, feedbackType),
      getPosition: PositionAccessorFactory.create(Anchor.CENTROID),
      getSize: (r) => {
        const accessor = getSizeAccessor(props.rows, props.encoding?.size)
        const size = typeof accessor === 'function' ? accessor(r) || 0 : accessor || 0
        if (!props.encoding.text) return size
        const pixelSize = props.viewState.viewport?.getSizePixels(size, props.encoding?.getUnits())
        const dimensions = getTextDimensions(props.encoding.text.getValue(r), pixelSize!)
        const width = props.encoding.getUnits() === SizeUnits.PIXELS ? dimensions.width : props.viewState.viewport?.getSizeCommons(dimensions.width, SizeUnits.PIXELS)
        const height = props.encoding.getUnits() === SizeUnits.PIXELS ? dimensions.height : props.viewState.viewport?.getSizeCommons(dimensions.height, SizeUnits.PIXELS)
        return [width, height, 0]
      },
      getFillColor: [255, 0, 0, 0],
      sizeUnits: props.encoding?.getUnits(),
      sizeMaxPixels: props.encoding?.size ? getMaxPixels(props.viewState.viewport, props.encoding?.size, props.encoding?.config) : Number.MAX_SAFE_INTEGER,
      getPositionAnchor: () => props.encoding?.text?.getAnchor() ?? 'middle',
      padding: props.encoding.getUnits() === SizeUnits.PIXELS ? 6 : 10,
      paddingRelativeToSize: props.encoding?.getUnits() !== SizeUnits.PIXELS,
      stroked: true,
      getLineWidth: 2,
      lineWidthUnits: SizeUnits.PIXELS,
    } as any

    return decorateOffset(props as any, deckProps)
  }

  getGeometryDeckProps(props: P, selectedRow?: Row, feedbackType: 'hover' | 'edit' = 'hover') {
    const deckProps = {
      ...this.getDeckProps(props, selectedRow, feedbackType),
      ...this.getUnskewProps(props, selectedRow),
      getPolygon: (row: Row) => {
        const geometry = row.getCoordinates().getGeometryLike() as any
        if (props.layerType === LayerType.line) return geometry
        const bounds = Bounds.fromGeometry(geometry, {orthographic: (props as any).viewport instanceof OrthographicViewport})
        return bounds.toPolygon()
      },
      getLineColor: fromString(props.editAccentColor, feedbackType === 'edit' ? 1 : 0.85),
      getLineWidth: 2,
      filled: false,
      stroked: true,
      lineWidthUnits: SizeUnits.PIXELS,
    } as any

    return decorateOffset(props as any, deckProps)
  }

  // The feedback outline must follow the image quad, which renders unskewed
  private getUnskewProps(props: P, selectedRow?: Row) {
    const geometry = selectedRow?.getCoordinates().getGeometryLike() as any
    if (!geometry?.length || !((props as any).viewport instanceof OrthographicViewport)) return {}

    const bounds = Bounds.fromGeometry(geometry, {orthographic: true})
    return getUnskewLayerProps((props as any).viewport, [...bounds], props.encoding?.position?.anchor)
  }

    getPolygonDeckProps(props: P, selectedRow?: Row, feedbackType: 'hover' | 'edit' = 'hover') {
    const deckProps = {
      ...this.getDeckProps(props, selectedRow, feedbackType),
      getPolygon: (row: Row) => row.getCoordinates().getGeometryLike(),
      getLineColor: fromString(props.editAccentColor, feedbackType === 'edit' ? 1 : 0.85),
      getLineWidth: 2,
      filled: false,
      stroked: true,
      lineWidthUnits: SizeUnits.PIXELS,
    } as any

    return decorateOffset(props as any, deckProps)
  }

   getLineDeckProps(props: P, selectedRow?: Row, feedbackType: 'hover' | 'edit' = 'hover') {
    const deckProps = {
      ...this.getDeckProps(props, selectedRow, feedbackType),
      getPath: (row: Row) => {
        return row.getCoordinates().getGeometryLike() as any
      },
      getColor: fromString(props.editAccentColor, feedbackType === 'edit' ? 1 : 0.85),
      getWidth: 2,
      widthUnits: SizeUnits.PIXELS,
    } as any

    return decorateOffset(props as any, deckProps)
  }

  isTextBox(props: P, selectedRow?: Row) {
    return props.layerType === LayerType.text && selectedRow?.getCoordinates().isGeometryLike() && props.encoding.text?.maxLength?.type === MaxLengthType.AUTO
  }

  getFeedbackLayer(props: P, selectedRow?: Row, feedbackType: 'hover' | 'edit' = 'hover') {
    if (!selectedRow) return []
    if ( props.layerType === LayerType.polygon) {
      return feedbackType === 'hover' ? [new PolygonLayer(this.getPolygonDeckProps(props, selectedRow, feedbackType))] : []
    }
    if (this.coordinateBasedLayerTypes.includes(props.layerType)) {
      return feedbackType === 'hover' ? [new PolygonLayer(this.getGeometryDeckProps(props, selectedRow, feedbackType))] : []
    } else if ( props.layerType === LayerType.line) {
      return [new PathLayer(this.getLineDeckProps(props, selectedRow, feedbackType))]
    } else if (this.isTextBox(props, selectedRow)) {
      return [new PolygonLayer(this.getGeometryDeckProps(props, selectedRow, feedbackType))]
    }
    return [new CubeLayer(this.getCircleDeckProps(props, selectedRow, feedbackType))]
  }

  shouldDecorate(props: P): boolean {
    if ( !props.canMove ) {
      return false
    }

    return this.editableLayerTypes.includes(props.layerType) || this.coordinateBasedLayerTypes.includes(props.layerType)
  }

  create(props: P) {
    if (!this.shouldDecorate(props)) return this.chain(props)

    const selectedRow = getSelectedRow(props.rows, this.rowSelection)
    const editableLayer = this.getFeedbackLayer(props, selectedRow, 'edit')

    const hoveringRow = this.rowHovering?.row ? getSelectedRow(props.rows, {...this.rowHovering, rowId: this.rowHovering.row._id}) : undefined
    const hoveringLayer = hoveringRow && hoveringRow._id !== selectedRow?._id ? this.getFeedbackLayer(props, hoveringRow, 'hover') : []

    const layers = this.chain(props)
    layers.push(editableLayer)
    layers.push(hoveringLayer)
    return layers
  }
}
