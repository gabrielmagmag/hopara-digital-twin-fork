import { Anchor } from './Anchor'

// Anchor in quad param space: the texture point that lands on the projected quad center
export const ANCHOR_POINTS: { [anchor in Anchor]: [number, number] } = {
  [Anchor.CENTROID]: [0.5, 0.5],
  [Anchor.BOTTOM_CENTER]: [0.5, 0],
  [Anchor.LOWER_CENTER]: [0.5, 0.25],
  [Anchor.UPPER_CENTER]: [0.5, 0.75],
  [Anchor.TOP_CENTER]: [0.5, 1],
  [Anchor.LEFT_CENTER]: [0, 0.5],
  [Anchor.RIGHT_CENTER]: [1, 0.5],
}

export const getAnchorPoint = (anchor?: Anchor): [number, number] => {
  return ANCHOR_POINTS[anchor ?? Anchor.CENTROID] ?? ANCHOR_POINTS[Anchor.CENTROID]
}

const mix = (p: number[], q: number[], t: number): number[] => {
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
}

// World-space point of the anchor: bilinear mix of the quad corners at the param
// point, matching the interpolation in the image/unskew vertex shaders.
// Corners ordered [bottomLeft, topLeft, topRight, bottomRight]
export const getAnchorWorldPoint = (corners: number[][], anchor?: Anchor): [number, number] => {
  const [u, v] = getAnchorPoint(anchor)
  const [c0, c1, c2, c3] = corners
  const left = mix(c0, c1, v)
  const right = mix(c3, c2, v)
  const point = mix(left, right, u)
  return [point[0], point[1]]
}
