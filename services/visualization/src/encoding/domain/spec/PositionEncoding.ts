import { Data } from '../../../data/domain/spec/Data.js'

export interface AxisPositionEncoding {
  value?: number
  field?: string
}

export interface FloorPositionEncoding {
  field: string
}

export interface CoordinatesPositionEncoding {
  field: string
}

export interface DataRef {
  layerId: string
}

export enum PositionType {
  MANAGED = 'MANAGED',
  CUSTOM = 'CUSTOM',
  CLIENT = 'CLIENT',
  FIXED = 'FIXED',
  REF = 'REF'
}

export enum Anchor {
  CENTROID = 'CENTROID',
  TOP_CENTER = 'TOP_CENTER',
  BOTTOM_CENTER = 'BOTTOM_CENTER',
  LOWER_CENTER = 'LOWER_CENTER',
  RIGHT_CENTER = 'RIGHT_CENTER',
  UPPER_CENTER = 'UPPER_CENTER',
  LEFT_CENTER = 'LEFT_CENTER',
}

export interface PositionEncoding {
  type?: PositionType
  data?: Data | DataRef
  scope?: string
  anchor?: Anchor
  coordinates?: CoordinatesPositionEncoding
  detailedCoordinates?: CoordinatesPositionEncoding
  x?: AxisPositionEncoding
  x2?: AxisPositionEncoding
  y?: AxisPositionEncoding
  y2?: AxisPositionEncoding
  z?: AxisPositionEncoding
  floor?: FloorPositionEncoding
}


