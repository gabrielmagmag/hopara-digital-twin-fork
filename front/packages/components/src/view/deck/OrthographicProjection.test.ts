import { getViewMatrix } from './OrthographicProjection'
import { OrthographicViewport } from './OrthographicViewport'

// BL, TL, TR, BR of an 80x40 rectangle centered at [50, 40]
const RECT = [[10, 20], [10, 60], [90, 60], [90, 20]]
const CENTROID = [50, 40]

const createViewport = (props = {}) => new OrthographicViewport({
  width: 800,
  height: 600,
  zoom: 0,
  limitNavigation: false,
  isometric: true,
  ...props,
})

// Mirrors the MultiBitmapLayer vertex shader: the column-major mat2 applied around the quad center
const applyUnskew = (matrix: number[], geometry: number[][]) => {
  return geometry.map(([x, y]) => {
    const [dx, dy] = [x - CENTROID[0], y - CENTROID[1]]
    return [
      CENTROID[0] + matrix[0] * dx + matrix[2] * dy,
      CENTROID[1] + matrix[1] * dx + matrix[3] * dy,
    ]
  })
}

const expectGeometryCloseTo = (geometry: number[][], expected: number[][]) => {
  geometry.forEach((point, i) => {
    expect(point[0]).toBeCloseTo(expected[i][0])
    expect(point[1]).toBeCloseTo(expected[i][1])
  })
}

describe('getUnskewMatrix', () => {
  it('returns the identity when the viewport is not isometric and not rotated', () => {
    expect(createViewport({isometric: false}).getUnskewMatrix()).toEqual([1, 0, 0, 1])
  })

  const getScreenOffsets = (geometry: number[][], {rotation = 0, isometric = true} = {}) => {
    const viewMatrix = getViewMatrix({scale: 1, flipY: false, isometric, rotation})
    const screenCentroid = viewMatrix.transformAsPoint([...CENTROID, 0])
    return geometry.map(([x, y]) => {
      const [sx, sy] = viewMatrix.transformAsPoint([x, y, 0])
      return [sx - screenCentroid[0], sy - screenCentroid[1]]
    })
  }

  const UPRIGHT_OFFSETS = RECT.map(([x, y]) => [x - CENTROID[0], y - CENTROID[1]])

  it('renders the quad as the original unskewed rectangle around the projected center', () => {
    const unskewed = applyUnskew(createViewport().getUnskewMatrix(), RECT)
    expectGeometryCloseTo(getScreenOffsets(unskewed), UPRIGHT_OFFSETS)
  })

  it('stays upright under a view rotation offset', () => {
    const unskewed = applyUnskew(createViewport({rotationOffset: 90}).getUnskewMatrix(), RECT)
    expectGeometryCloseTo(getScreenOffsets(unskewed, {rotation: 90}), UPRIGHT_OFFSETS)
  })

  it('stays upright under a view rotation offset on non-isometric whiteboards', () => {
    const unskewed = applyUnskew(createViewport({isometric: false, rotationOffset: 90}).getUnskewMatrix(), RECT)
    expectGeometryCloseTo(getScreenOffsets(unskewed, {rotation: 90, isometric: false}), UPRIGHT_OFFSETS)
  })
})
