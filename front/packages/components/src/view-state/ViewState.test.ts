import ViewState from './ViewState'
import {clone} from '@hopara/object/src/clone'
import {Box, Dimensions, Range} from '@hopara/spatial'
import WebMercatorViewport from '../view/deck/WebMercatorViewport'
import { OrthographicViewport } from '../view/deck/OrthographicViewport'

// Test helper, sets a GeoDimension directly instead of calculating it
export class TestViewState extends ViewState {
  worldBox?: Box
  worldDimensions?: Dimensions

  // Assigns all attributes from the incoming parameter to this object
  public constructor(props:any) {
    super(props)
    Object.assign(this, props)

    if (props?.orthographic) this.viewport = new OrthographicViewport(props?.dimensions)
    else this.viewport = new WebMercatorViewport(props?.dimensions)
    
    // should process the viewport with viewstate props
    const viewport = this.createViewport()
    if (viewport) this.viewport = viewport
  }

  getVisibleWorld(): Box | undefined {
    if (this.worldBox) return this.worldBox
    return super.getVisibleWorld()
  }

  getVisibleWorldDimensions(): Dimensions | undefined {
    if (this.worldDimensions) return this.worldDimensions
    return super.getVisibleWorldDimensions()
  }
}

const whatever = 10
const anyViewState = new TestViewState(
  {
    zoom: whatever,
    dimensions: {width: 1200, height: 768},
  },
)

export function getAnyViewState(props = {}) : ViewState {
  return clone<ViewState>(anyViewState, props)
}

test('get min & max zoom', () => {
  const viewState = getAnyViewState({
    zoomRange: new Range({min: 1, max: 5.5}),
  })
  expect(viewState.getMinZoom()).toEqual(1)
  expect(viewState.getMaxZoom()).toEqual(5.49)
})

test('has default dimensions if both values are 1', () => {
  const viewState1 = getAnyViewState({dimensions: {width: 1, height: 1}})
  expect(viewState1.hasDefaultDimensions()).toBeTruthy()

  const viewState2 = getAnyViewState({dimensions: {width: 10, height: 10}})
  expect(viewState2.hasDefaultDimensions()).toBeFalsy()

  const viewState3 = new ViewState({dimensions: undefined})
  expect(viewState3.hasDefaultDimensions()).toBeTruthy()
})

test('get zoom', () => {
  const viewState = getAnyViewState({zoomRange: new Range({min: 1, max: 5.5})})
  expect(viewState.getTargetZoom(10)).toEqual(5.49)
  expect(viewState.getTargetZoom(0)).toEqual(1)
  expect(viewState.getTargetZoom(2)).toEqual(2)
})

test('setRotationOffset propagates to the recreated viewport', () => {
  const viewState = new TestViewState({
    orthographic: true,
    dimensions: {width: 1200, height: 768},
  })

  const rotated = viewState.setRotationOffset(90)
  expect((rotated.viewport as OrthographicViewport).rotationOffset).toEqual(90)
})
