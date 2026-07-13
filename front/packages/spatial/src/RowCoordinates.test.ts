import { Anchor } from './Anchor'
import {RowCoordinates} from './RowCoordinates'

test('Assumes 0 as default', () => {
  const coordinates = new RowCoordinates({})
  expect(coordinates.getCentroidX()).toStrictEqual(0)
  expect(coordinates.getCentroidY()).toStrictEqual(0)
})

test('is placed', () => {
  expect(new RowCoordinates({geometry: [1, 2, 3]}).isPlaced()).toBeTruthy()
  expect(new RowCoordinates({x: 1, y: 0}).isPlaced()).toBeTruthy()
  expect(new RowCoordinates({x: 1}).isPlaced()).toBeFalsy()
  expect(new RowCoordinates({y: 1}).isPlaced()).toBeFalsy()
  expect(new RowCoordinates({}).isPlaced()).toBeFalsy()
})

test('XYZ as geometry', () => {
  const geometry = [
    [-71.13646153273015, 42.38977076363466],
    [-71.13646716349945, 42.39060279954907],
    [-71.13410026188511, 42.39061187038382],
    [-71.13409463415051, 42.38977983451801],
    [-71.13646153273015, 42.38977076363466]]

  const coordinates = new RowCoordinates({x: geometry})
  expect(coordinates.getCentroidX()).toEqual(-71.13528089808119)
})

test('top center anchor', () => {
  const geometry = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0]]

  const coordinates = new RowCoordinates({x: geometry, y: geometry})
  expect(coordinates.getAnchoredX(Anchor.TOP_CENTER)).toEqual(5)
  expect(coordinates.getAnchoredY(Anchor.TOP_CENTER)).toEqual(10)
  expect(coordinates.toArray(Anchor.TOP_CENTER)).toEqual([5, 10, 0])
})

test('upper center anchor', () => {
  const geometry = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0]]

  const coordinates = new RowCoordinates({x: geometry, y: geometry})
  expect(coordinates.getAnchoredX(Anchor.UPPER_CENTER)).toEqual(5)
  expect(coordinates.getAnchoredY(Anchor.UPPER_CENTER)).toEqual(7.5)
  expect(coordinates.toArray(Anchor.UPPER_CENTER)).toEqual([5, 7.5, 0])
})

test('lower center anchor', () => {
  const geometry = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0]]

  const coordinates = new RowCoordinates({x: geometry, y: geometry})
  expect(coordinates.getAnchoredX(Anchor.LOWER_CENTER)).toEqual(5)
  expect(coordinates.getAnchoredY(Anchor.LOWER_CENTER)).toEqual(2.5)
  expect(coordinates.toArray(Anchor.LOWER_CENTER)).toEqual([5, 2.5, 0])
})


test('to box', () => {
  const geometry = [
    [0, 3],
    [1, 3],
    [1, 4],
    [0, 4],
    [0, 3]]

  const coordinates = new RowCoordinates({geometry})
  const box = coordinates.toBox()
  expect(box.x.min).toEqual(0)
  expect(box.x.max).toEqual(1)
  expect(box.y.min).toEqual(3)
  expect(box.y.max).toEqual(4)
})

test('Is geometry like', () => {
  const geometry = [
    [-71.13646153273015, 42.38977076363466],
    [-71.13646716349945, 42.39060279954907],
    [-71.13410026188511, 42.39061187038382],
    [-71.13409463415051, 42.38977983451801],
    [-71.13646153273015, 42.38977076363466]]

  const coordinates = new RowCoordinates({x: geometry, y: geometry})
  expect(coordinates.isGeometryLike()).toBeTruthy()
})

test('Pure geometry', () => {
  const geometry = [
    [-71.13646153273015, 42.38977076363466],
    [-71.13646716349945, 42.39060279954907],
    [-71.13410026188511, 42.39061187038382],
    [-71.13409463415051, 42.38977983451801],
    [-71.13646153273015, 42.38977076363466]]

  const coordinates = new RowCoordinates({geometry})
  expect(coordinates.getCentroidX()).toEqual(-71.13528089808119)
})

test('get polygon centroid', () => {
  const geometry = [[1, 1], [1, 5], [5, 5], [5, 1], [1, 1]]
  const coordinates = new RowCoordinates({geometry})
  expect(coordinates.getCentroidX()).toEqual(3)
  expect(coordinates.getCentroidY()).toEqual(3)
})

test('get point centroid', () => {
  const geometry = [[1, 2]]
  const coordinates = new RowCoordinates({geometry})
  expect(coordinates.getCentroidX()).toEqual(1)
  expect(coordinates.getCentroidY()).toEqual(2)
})

test('clone placed', () => {
  const rowCoordinates = new RowCoordinates({})
  expect(rowCoordinates.isPlaced()).toBeFalsy()
  expect(new RowCoordinates(rowCoordinates).isPlaced()).toBeFalsy()
})

