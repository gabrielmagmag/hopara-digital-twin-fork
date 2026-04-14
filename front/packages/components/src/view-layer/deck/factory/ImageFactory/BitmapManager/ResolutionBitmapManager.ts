import { Bounds } from '@hopara/spatial'
import { isEqual } from 'lodash'
import { BitmapManager } from './BitmapManager'

enum ImageBreakpoint {
  tb = 0,
  xxs = 1,
  xs = 2,
  sm = 3,
  md = 4,
  lg = 5,
  xl = 6,

}

const SIZE_BREAKPOINTS = {
  [ImageBreakpoint.tb]: 'tb',
  [ImageBreakpoint.xxs]: 'xxs',
  [ImageBreakpoint.xs]: 'xs',
  [ImageBreakpoint.sm]: 'sm',
  [ImageBreakpoint.md]: 'md',
  [ImageBreakpoint.lg]: 'lg',
  [ImageBreakpoint.xl]: 'xl',
}

const resolutions = {
  [ImageBreakpoint.tb]: 250,
  [ImageBreakpoint.xxs]: 512,
  [ImageBreakpoint.xs]: 1024,
  [ImageBreakpoint.sm]: 2048,
  [ImageBreakpoint.md]: 4096,
  [ImageBreakpoint.lg]: 8192,
  [ImageBreakpoint.xl]: 16383,
}

export const getRequiredResolution = (screenWidth, currentZoom, fitZoom) => {
  return Math.floor(screenWidth * Math.pow(2, currentZoom - fitZoom))
}

export class ResolutionBitmapManager implements BitmapManager {
  maxTextureSize: number
  deviceBreakpoints: ImageBreakpoint[]
  fitZoom: number | undefined
  isOrtographic: boolean

  constructor(maxTextureSize: number, isOrthographic:boolean) {
    this.maxTextureSize = maxTextureSize
    this.isOrtographic = isOrthographic
    this.deviceBreakpoints = this.getDeviceBreakpoints(maxTextureSize)
  }

  getDeviceBreakpoints(maxTextureSize: number) {
    if (maxTextureSize < resolutions[ImageBreakpoint.lg]) {
      return [ImageBreakpoint.xs, ImageBreakpoint.md]
    } else if (maxTextureSize < resolutions[ImageBreakpoint.xl]) {
      return [ImageBreakpoint.xs, ImageBreakpoint.md, ImageBreakpoint.lg] 
    }
    return [ImageBreakpoint.xs, ImageBreakpoint.md, ImageBreakpoint.xl] 
  }

  private getResolutionBreakpoint(breakpoint) {
    const resolution = Math.min(resolutions[breakpoint], this.maxTextureSize)
    return Object.keys(resolutions).find((res) => resolutions[res] === resolution)!
  }

  private setResolution(imageUrl: string, breakpoint: ImageBreakpoint) {
    const url = new URL(imageUrl)
    url.searchParams.delete('resolution')
    url.searchParams.append('resolution', SIZE_BREAKPOINTS[this.getResolutionBreakpoint(breakpoint)].toString())
    return url
  }

  lastBbox: {[index: number]: any} = {}
  lastBounds: {[index: number]: any} = {}

  private getIdealResolution(zoom: number, fitZoom: number, screenWidth: number) {
    const required = getRequiredResolution(screenWidth, zoom, fitZoom)

    for (const bp of this.deviceBreakpoints) {
      if (resolutions[bp] >= required) {
        return bp as ImageBreakpoint
      }
    }

    return this.deviceBreakpoints[this.deviceBreakpoints.length - 1]
  }

  private getFitZoom(viewport, bbox) {  
    if (this.fitZoom) {
      return this.fitZoom
    }
    
    const {zoom} = viewport.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]])
    this.fitZoom = zoom
    return zoom
  }

  private getImageResolution(viewport, bounds, index) {
    let bbox: any
    if (this.lastBbox[index] && isEqual(bounds, this.lastBounds[index])) {
      bbox = this.lastBbox[index]
    } else {
      bbox = Bounds.fromGeometry(bounds, {orthographic: this.isOrtographic}).toBBox()
    }

    this.lastBbox[index] = bbox
    this.lastBounds[index] = bounds

    const fitZoom = this.getFitZoom(viewport, bbox)
    return this.getIdealResolution(viewport.zoom, fitZoom, viewport.width * window.devicePixelRatio)
  }

  getImagesBreakpoint(viewport, boundsArray) {
    return boundsArray.map((bounds, index) => this.getImageResolution(viewport, bounds, index))
                      .reduce((breakpoint, boundsBreakpoint) => {
                        if (boundsBreakpoint > breakpoint) return boundsBreakpoint
                        return breakpoint
                      }, ImageBreakpoint.xs)
  }

  lastUrl = ''
  lastBreakpoint
  lastVersion: Date | undefined = undefined

  private isAskingLowerResolution(breakpoint: ImageBreakpoint) {
    return this.lastBreakpoint && breakpoint < this.lastBreakpoint
  }

  getLoadUrl(imageUrl:string, viewport, boundsArray, version: Date | undefined, isDragging:boolean, isVisible:boolean): string {
    if ((isDragging || !isVisible) && this.lastUrl) {
      return this.lastUrl
    }
    
    if (this.lastVersion !== version) {
      this.lastBreakpoint = undefined
      this.lastVersion = version
    }

    const breakpoint = this.getImagesBreakpoint(viewport, boundsArray)
    if (this.isAskingLowerResolution(breakpoint)) {
      return this.lastUrl
    }

    this.lastUrl = this.setResolution(imageUrl, breakpoint).toString()
    this.lastBreakpoint = breakpoint
    return this.lastUrl
  }

  isFirstFetch() : boolean {
    return !this.lastUrl
  }
}
