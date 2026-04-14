import { OrthographicViewport } from '../../../../../view/deck/OrthographicViewport'
import { getRequiredResolution, ResolutionBitmapManager } from './ResolutionBitmapManager'

const testViewport = (overrides?: any) => new OrthographicViewport({
  width: 1920,
  height: 1080,
  target: [1920 / 2, 1080 / 2],
  zoom: 0,
  ...overrides,
})

const testBounds = (minX, minY, maxX, maxY) => {
  return [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]]
}

describe('get resolution', () => {
  it('small', () => {
    const resolution = getRequiredResolution(1000, 0, 3)
    expect(resolution).toEqual(125)
  })

  it('small', () => {
    const resolution = getRequiredResolution(1000, 1, 3)
    expect(resolution).toEqual(250)
  })

  it('fit', () => {
    const resolution = getRequiredResolution(1000, 3, 3)
    expect(resolution).toEqual(1000)
  })

  it('large', () => {
    const resolution = getRequiredResolution(1000, 10, 3)
    expect(resolution).toEqual(128000)
  })
})

describe('get the largest resolution for bounds list', () => {
  it('xs', () => {
    const manager = new ResolutionBitmapManager(Number.MAX_SAFE_INTEGER, true)
    const resolution = manager.getImagesBreakpoint(testViewport(), [testBounds(300, 300, 700, 700)])
    expect(resolution).toBe(2)
  })

  it('md', () => {
    const manager = new ResolutionBitmapManager(Number.MAX_SAFE_INTEGER, true)
    const resolution = manager.getImagesBreakpoint(testViewport({zoom: 2}), [testBounds(300, 300, 700, 700)])
    expect(resolution).toBe(4)
  })

  it('xl', () => {
    const manager = new ResolutionBitmapManager(Number.MAX_SAFE_INTEGER, true)
    const resolution = manager.getImagesBreakpoint(testViewport({zoom: 4}), [testBounds(300, 300, 700, 700)])
    expect(resolution).toBe(6)
  })

  it('multiple bounds get the first', () => {
    const manager = new ResolutionBitmapManager(Number.MAX_SAFE_INTEGER, true)
    const resolution = manager.getImagesBreakpoint(testViewport(), [
      testBounds(0, 0, 1500, 1500),
      testBounds(300, 300, 700, 700),
    ])
    expect(resolution).toBe(4)
  })

  it('multiple bounds zoomed', () => {
    const manager = new ResolutionBitmapManager(Number.MAX_SAFE_INTEGER, true)
    const resolution = manager.getImagesBreakpoint(testViewport({zoom: 5}), [
      testBounds(300, 300, 700, 700),
      testBounds(0, 0, 1500, 1500),
    ])
    expect(resolution).toBe(6)
  })
})
