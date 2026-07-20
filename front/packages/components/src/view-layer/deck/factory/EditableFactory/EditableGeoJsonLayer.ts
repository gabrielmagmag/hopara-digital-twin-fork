import { EditableGeojsonLayerProps } from '@nebula.gl/layers/dist-types/layers/editable-geojson-layer'
import {EditableGeoJsonLayer as NebulaEditableGeoJsonLayer} from 'nebula.gl'

export class EditableGeoJsonLayer extends NebulaEditableGeoJsonLayer {
  static layerName = 'EditableGeoJsonLayer'

  // Billboarded path strokes compute their width offsets from the raw projected
  // segment directions AFTER the DECKGL_FILTER_GL_POSITION hook, so the
  // UnskewExtension can only move the centerline — the thickness band stays
  // perpendicular to the pre-unskew (skewed) direction, making edge thickness
  // uneven. Non-billboard strokes fold the offset into geometry.position before
  // the hook and render uniformly. Billboarding is only needed for pitched
  // views, and this app always renders with pitch 0.
  // Nebula also scales stroke widths by 2/3 (PROJECTED_PIXEL_SIZE_MULTIPLIER),
  // making its lines thinner than the same nominal width on regular layers
  static defaultProps = {
    billboard: false,
    lineWidthScale: 1,
  }

  _onpanmove(event: any) {
    const { srcEvent } = event
    const screenCoords = this.getScreenCoords(srcEvent) as any
    const mapCoords = this.getMapCoords(screenCoords)

    const {
      pointerDownPicks,
      pointerDownScreenCoords,
      pointerDownMapCoords,
    } = this.state._editableLayerState

    this.onDragging({
      screenCoords,
      mapCoords,
      picks: [],
      pointerDownPicks,
      pointerDownScreenCoords,
      pointerDownMapCoords,
      sourceEvent: srcEvent,
      cancelPan: event.stopImmediatePropagation,
    })
  }
 
  picks = []
  _onpointermove(event: any) {
    const { srcEvent } = event
    const screenCoords = this.getScreenCoords(srcEvent) as any
    const mapCoords = this.getMapCoords(screenCoords)

    const {
      pointerDownPicks,
      pointerDownScreenCoords,
      pointerDownMapCoords,
    } = this.state._editableLayerState
    
    if (!event.rightButton && !event.leftButton) {
      this.picks = this.getPicks(screenCoords)
    }

    this.onPointerMove({
      screenCoords,
      mapCoords,
      picks: this.picks,
      pointerDownPicks,
      pointerDownScreenCoords,
      pointerDownMapCoords,
      sourceEvent: srcEvent,
    } as any)
  }

  createTooltipsLayers() {
    return []
  }

  getModeProps(props: EditableGeojsonLayerProps<any> & {onUpdateCursor?: (cursor: string) => void}) {
    const modeProps = super.getModeProps(props)
    modeProps.onUpdateCursor = (cursor) => props.onUpdateCursor && props.onUpdateCursor(cursor)
    return {...modeProps, pickingRadius: props.pickingRadius ?? NebulaEditableGeoJsonLayer.defaultProps.pickingRadius}
  }
}
