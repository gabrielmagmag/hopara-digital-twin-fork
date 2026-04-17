import { createAnyGeometry } from './BaseBounds.test'
import { OrthographicBounds } from './OrthographicBounds'

describe('OrthographicBounds', () => {
  it('from geomery', () => {
    const geometry = [
      [-77.23115879432737, 39.12589350423319],
      [-77.23224023073317, 39.12473830274571],
      [-77.23227518227412, 39.12475799394921],
      [-77.23230098950859, 39.12473042722516],
      [-77.23232395057774, 39.12474336349157],
      [-77.2323315340937, 39.124735262577566],
      [-77.23250939822483, 39.12483546812174],
      [-77.23251923646512, 39.12482498732847],
      [-77.23391479725922, 39.125613363390286],
      [-77.23390627378654, 39.12562244340962],
      [-77.2341212716326, 39.12574356944005],
      [-77.23411366897258, 39.12575169083905],
      [-77.23449775916822, 39.1259680872561],
      [-77.23307877115388, 39.12748379903856],
      [-77.23088201002662, 39.12624615010752],
      [-77.2311937246555, 39.12591318335095],
      [-77.23115879432737, 39.12589350423319],
    ]

    const bounds = OrthographicBounds.fromGeometry(geometry)

    expect(bounds.toPolygon()).toEqual([
      [-77.23078672664346, 39.126459326987316],
      [-77.23168624573314, 39.12444683890718],
      [-77.23459633001211, 39.125747555362295],
      [-77.23369681092242, 39.12776004344242],
      [-77.23078672664346, 39.126459326987316],
    ])
  })

  it('should return a polygon feature', () => {
    const bounds = new OrthographicBounds(...createAnyGeometry({positionCount: 4}))
    expect(bounds.toGeoJSON()).toEqual({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 1], [2, 2], [3, 3], [0, 0]]],
      },
    })
  })

  it('should return a feature collection with just one item', () => {
    const bounds = new OrthographicBounds(...createAnyGeometry({positionCount: 4}))
    expect(bounds.toFeatureCollection()).toEqual({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [bounds.toPolygon()],
        },
      }],
    })
  })

  it('should return 5,5 when bounds is a 10x10 square', () => {
    const bounds = new OrthographicBounds([0, 0], [0, 10], [10, 10], [10, 0])
    expect(bounds.getCentroid()).toEqual([5, 5])
  })

  it('should extrude angled rectangle using 3/1 ratio', () => {
    const bounds = new OrthographicBounds(
      [-71.1087928851, 42.3566827933],
      [-71.1095294371, 42.3571005172],
      [-71.1088312042, 42.3577728053],
      [-71.1080946521, 42.3573550858],
    )
    const newBounds = bounds.extrudeGeometry(1500, 500)
    expect(newBounds).toEqual([
      [-80.60327512757324, -18.80866549150902],
      [-80.60349922360658, -18.80843274720903],
      [-80.60280099070658, -18.807760459109037],
      [-80.60257689467326, -18.80799320340903],
    ])
  })

  it('should extrude not angled rect using 2/1 ratio', () => {
    const bounds = new OrthographicBounds([0, 0], [0, 10], [10, 10], [10, 0])
    const newBounds = bounds.extrudeGeometry(4, 2)
    expect(newBounds).toEqual(new OrthographicBounds(
      [0, 2.5],
      [0, 7.5],
      [10, 7.5],
      [10, 2.5],
    ))
  })

  it('should not swap dimensions when nearest bottom-left and top-left resolve to the same vertex', () => {
    const geometry = [
      [-8.336415319846012, 38.6693323624786],
      [-5.439742855198681, 40.32278417982161],
      [-5.029993576060981, 40.059687779285014],
      [-2.8424050528369875, 41.35143429134041],
      [-1.0101989297820282, 40.30246678297408],
      [1.7196515258774099, 41.88984842039645],
      [12.902808261545378, 35.43100781412795],
      [4.512337585163305, 31.188085765810683],
      [-8.336415319846012, 38.6693323624786],
    ]

    const bounds = OrthographicBounds.fromGeometry(geometry)
    const width = bounds.getWidth()
    const height = bounds.getHeight()

    // The polygon is wider than tall (~21 x ~11), so the OBB should preserve that
    expect(width).toBeGreaterThan(height)
  })
})
