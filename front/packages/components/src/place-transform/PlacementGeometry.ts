import ViewState from '../view-state/ViewState'
import { getPlaneMatrix } from '../view/deck/OrthographicProjection'
import { OrthographicViewport } from '../view/deck/OrthographicViewport'

// Images render unskewed (the image shader cancels the plane transform around
// the quad center), so placement geometry unprojected from screen space — a
// skewed parallelogram in world space — is skewed back around its centroid into
// the plain rectangle the renderer expects. No-op when the plane transform is
// identity, so non-isometric whiteboards are unaffected
export const toUnskewedGeometry = (geometry: number[][], viewState: ViewState): number[][] => {
  const viewport = viewState.getViewport()
  if (!(viewport instanceof OrthographicViewport) || (!viewport.isometric && !viewport.rotationOffset)) {
    return geometry
  }

  const matrix = getPlaneMatrix({rotation: viewport.rotationOffset, isometric: viewport.isometric})
  const isClosed = geometry.length > 1 &&
    geometry[0][0] === geometry[geometry.length - 1][0] &&
    geometry[0][1] === geometry[geometry.length - 1][1]
  const vertices = isClosed ? geometry.slice(0, -1) : geometry
  const cx = vertices.reduce((sum, point) => sum + point[0], 0) / vertices.length
  const cy = vertices.reduce((sum, point) => sum + point[1], 0) / vertices.length

  return geometry.map(([x, y, ...rest]) => {
    const [tx, ty] = matrix.transformAsPoint([x - cx, y - cy, 0])
    return [cx + tx, cy + ty, ...rest]
  })
}
