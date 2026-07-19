import { LayerExtension } from '@deck.gl/core'
import { Anchor, getAnchorWorldPoint } from '@hopara/spatial'
import { OrthographicViewport } from '../../../view/deck/OrthographicViewport'

const IDENTITY = [1, 0, 0, 1]

const isIdentity = (matrix?: number[]) => {
  return !matrix || (matrix[0] === 1 && matrix[1] === 0 && matrix[2] === 0 && matrix[3] === 1)
}


// Applies the same anti-skew the image layer performs in MultiBitmapLayer to any
// deck/nebula layer: the anchor point lands on the projected quad center and the
// geometry renders unskewed around it. Injected as a clip-space delta so the
// pixel/billboard offsets of edit handles are preserved (they translate rigidly)
export class UnskewExtension extends LayerExtension {
  // eslint-disable-next-line no-restricted-syntax
  static get componentName() {
    return 'UnskewExtension'
  }

  getShaders() {
    return {
      ...super.getShaders(null),
      inject: {
        'vs:#decl': `
          uniform mat2 unskewMatrix;
          uniform vec2 unskewCenter;
          uniform vec2 unskewAnchor;
          uniform bool unskewEnabled;
        `,
        'vs:DECKGL_FILTER_GL_POSITION': `
          if (unskewEnabled) {
            // geometry.position is in common space, which may be origin-shifted
            // relative to world space (fp64 offset mode) — bring the world-space
            // uniforms into the same space before comparing
            vec2 unskewCommonCenter = project_position(vec3(unskewCenter, 0.0)).xy;
            vec2 unskewCommonAnchor = project_position(vec3(unskewAnchor, 0.0)).xy;
            vec2 unskewDelta = unskewCommonCenter + (unskewMatrix * (geometry.position.xy - unskewCommonAnchor)) - geometry.position.xy;
            position += project_uViewProjectionMatrix * vec4(unskewDelta, 0.0, 0.0);
          }
        `,
      },
    }
  }

  updateState(params) {
    if (!params || !params.props) return

    const {
      unskewMatrix = IDENTITY,
      unskewCenter = [0, 0],
      unskewAnchor,
    } = params.props

    // Composite layers (GeoJson, nebula editable) have no GL models of their
    // own; the uniforms are set on their primitive sublayers instead
    const models = typeof (this as any).getModels === 'function' ? (this as any).getModels() : undefined
    if (!models?.length) return

    for (const model of models) {
      if (!model) continue
      model.setUniforms({
        unskewMatrix,
        unskewCenter,
        unskewAnchor: unskewAnchor ?? unskewCenter,
        unskewEnabled: !isIdentity(unskewMatrix),
      })
    }
  }

  getSubLayerProps() {
    if (!(this as any).props) return
    const { unskewMatrix, unskewCenter, unskewAnchor } = (this as any).props
    return { unskewMatrix, unskewCenter, unskewAnchor } as any
  }
}

// Extension + uniforms for a layer whose geometry must render like the image
// quad: unskewed around the bounds center, shifted by the layer anchor.
// Empty when there is nothing to cancel so unaffected layers stay untouched
export const getUnskewLayerProps = (viewport: any, bounds?: number[][], anchor?: Anchor) => {
  if (!(viewport instanceof OrthographicViewport) || !bounds?.length) return {}

  const unskewMatrix = viewport.getUnskewMatrix()
  if (isIdentity(unskewMatrix)) return {}

  return {
    extensions: [new UnskewExtension()],
    unskewMatrix,
    unskewCenter: getAnchorWorldPoint(bounds, Anchor.CENTROID),
    unskewAnchor: getAnchorWorldPoint(bounds, anchor),
  }
}
