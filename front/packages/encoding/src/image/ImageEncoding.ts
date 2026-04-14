import { Row } from '@hopara/dataset'
import { ResourceEncoding } from '../ResourceEncoding'
import { isNil } from 'lodash'
import { VIEW_MANAGED_FIELD, ViewEncoding } from './ViewEncoding'

export enum ImageResolution {
  tb = 'tb',
  xxs = 'xxs',
  xs = 'xs',
  sm = 'sm',
  md = 'md',
  lg = 'lg',
  xl = 'xl',
}

export class ImageEncoding extends ResourceEncoding<ImageEncoding> {
  scope?: string
  view?: ViewEncoding
  resolution?: ImageResolution

  constructor(props?: Partial<ImageEncoding>) {
    super()
    Object.assign(this, props)
  }

  getView(row?:Row) {
    return this.getValue(row, this.view)
  }

  isViewManaged() {
    return !isNil(this.view) && this.view.field === VIEW_MANAGED_FIELD
  }
}
