import React from 'react'
import {LayerType} from './LayerType'
import {Icon} from '@hopara/design-system/src/icons/Icon'
import { Row } from '@hopara/dataset'
import { Layer } from './Layer'
import { IconAccessor } from '@hopara/encoding'

function getIconLayerIcon(layer: Layer, row?: Row) {
  const encoding = layer.encoding
  if (!row) {
    return layer.encoding.icon?.value ?? layer.name
  } else {
    return IconAccessor.getIcon(encoding.icon, row).url
  }
}

export function getIcon(layer: Layer, row?: Row) {
  if (layer.icon && !row) {
    return layer.icon
  }

  if (layer.type === LayerType.icon) {
    return getIconLayerIcon(layer, row)
  }

  if (layer.hasRenderChildren()) {
    const iconLayer = layer.getRenderLayers().reverse().find((child) => child.isType(LayerType.icon) && (row || child.encoding.icon?.value))
    if (iconLayer) return getIcon(iconLayer, row)
  }

  return layer.name
}

export enum LayerIconContext {
  GENERAL = 'general',
  OBJECT_EDITOR = 'object-editor',
}

interface Props {
  type: LayerType,
  isChart?: boolean,
  size?: number,
  context?: LayerIconContext
}

export const LayerIcon = (props: Props) => {
  const {
    type,
    context = LayerIconContext.GENERAL,
    size,
    isChart = false,
  } = props
  switch (type) {
    case LayerType.circle:
      return <Icon icon="circle-layer" size={size}/>
    case LayerType.line:
      if (isChart) {
        return <Icon icon="line-chart-layer" size={size}/>
      }
      if (context === LayerIconContext.OBJECT_EDITOR) {
        return <Icon icon="object-editor-line-layer" size={size}/>
      }
      return <Icon icon="line-layer" size={size}/>
    case LayerType.image:
      return <Icon icon="image-layer" size={size}/>
    case LayerType.polygon:
      return <Icon icon="polygon-layer" size={size}/>
    case LayerType.text:
      if (context === LayerIconContext.OBJECT_EDITOR) {
        return <Icon icon="object-editor-text-layer" size={size}/>
      }
      return <Icon icon="text-layer" size={size}/>
    case LayerType.icon:
      return <Icon icon="icon-layer" size={size}/>
    case LayerType.model:
      return <Icon icon="model-layer" size={size}/>
    case LayerType.arc:
      return <Icon icon="arc-layer" size={size}/>
    case LayerType.rectangle:
      return <Icon icon="rectangle-layer" size={size}/>
    case LayerType.bar:
      return <Icon icon="bar-layer" size={size}/>
    case LayerType.area:
      return <Icon icon="area-layer" size={size}/>
    case LayerType.composite:
      return <Icon icon="composite-layer" size={size}/>
    case LayerType.map:
      return <Icon icon="map-layer" size={size}/>
    case LayerType.template:
      return <Icon icon="template-layer" size={size}/>
    default:
      return <Icon icon="circle-layer" size={size}/>
  }
}
