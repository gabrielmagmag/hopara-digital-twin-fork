import { Anchor } from './Anchor'
import { getAnchorPoint, getAnchorWorldPoint } from './AnchorPoints'

// BL, TL, TR, BR of an 80x40 rectangle centered at [50, 40]
const CORNERS = [[10, 20], [10, 60], [90, 60], [90, 20]]

describe('getAnchorPoint', () => {
  it('defaults to the centroid', () => {
    expect(getAnchorPoint()).toEqual([0.5, 0.5])
    expect(getAnchorPoint(undefined)).toEqual([0.5, 0.5])
  })
})

describe('getAnchorWorldPoint', () => {
  it('returns the quad center for the centroid anchor', () => {
    expect(getAnchorWorldPoint(CORNERS, Anchor.CENTROID)).toEqual([50, 40])
  })

  it('returns the bottom edge midpoint for the bottom-center anchor', () => {
    expect(getAnchorWorldPoint(CORNERS, Anchor.BOTTOM_CENTER)).toEqual([50, 20])
  })

  it('returns the quarter-height midpoint for the lower-center anchor', () => {
    expect(getAnchorWorldPoint(CORNERS, Anchor.LOWER_CENTER)).toEqual([50, 30])
  })

  it('returns the side edge midpoints for the side anchors', () => {
    expect(getAnchorWorldPoint(CORNERS, Anchor.LEFT_CENTER)).toEqual([10, 40])
    expect(getAnchorWorldPoint(CORNERS, Anchor.RIGHT_CENTER)).toEqual([90, 40])
  })
})
