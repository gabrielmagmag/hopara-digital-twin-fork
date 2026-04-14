export interface ViewEncoding {
  field?: string
  value?: string
}

export enum ImageResolution {
  tb = 'tb',
  xxs = 'xxs',
  xs = 'xs',
  sm = 'sm',
  md = 'md',
  lg = 'lg',
  xl = 'xl',
}

export interface ImageEncoding {
  field?: string
  fallback?: ImageEncoding
  resolution?: ImageResolution
  scope?: string
  value?: string
  view?: ViewEncoding
}
