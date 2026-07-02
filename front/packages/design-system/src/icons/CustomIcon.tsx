import React from 'react'

// Custom Icons
import { ReactComponent as SuccessOutlined } from './custom-icons/success-outlined.svg'
import { ReactComponent as EmailSentIcon } from './custom-icons/email-sent.svg'
import { ReactComponent as FiltersIcon } from './custom-icons/filters.svg'
import { ReactComponent as FloorsIcon } from './custom-icons/floors.svg'
import { ReactComponent as GeneralIcon } from './custom-icons/general.svg'
import { ReactComponent as HelperIcon } from './custom-icons/helper-icon.svg'
import { ReactComponent as InitialPositionIcon } from './custom-icons/initial-position.svg'
import { ReactComponent as JumpBackIcon } from './custom-icons/jump-back.svg'
import { ReactComponent as KeyIcon } from './custom-icons/key.svg'
import { ReactComponent as LayersIcon } from './custom-icons/layers.svg'
import { ReactComponent as LevelDownIcon } from './custom-icons/level-down.svg'
import { ReactComponent as LevelUpIcon } from './custom-icons/level-up.svg'
import { ReactComponent as LineLayer } from './custom-icons/line-layer.svg'
import { ReactComponent as MultipleIcon } from './custom-icons/multiple.svg'
import { ReactComponent as OrbitIcon } from './custom-icons/orbit.svg'
import { ReactComponent as PadlockIcon } from './custom-icons/padlock.svg'
import { ReactComponent as PanIcon } from './custom-icons/pan.svg'
import { ReactComponent as PlaceholderIcon } from './custom-icons/placeholder.svg'
import { ReactComponent as PolygonModifyMode } from './custom-icons/polygon-modify-mode.svg'
import { ReactComponent as PolygonTransformMode } from './custom-icons/polygon-transform-mode.svg'
import { ReactComponent as PolygonFitToImage } from './custom-icons/polygon-fit-to-image.svg'
import { ReactComponent as PolygonFitToBuilding } from './custom-icons/polygon-fit-to-building.svg'
import { ReactComponent as PolygonFitToRoom } from './custom-icons/polygon-fit-to-room.svg'
import { ReactComponent as ImageFitToBuilding } from './custom-icons/image-fit-to-building.svg'
import { ReactComponent as ProgressActivity } from './custom-icons/progress-activity.svg'
import { ReactComponent as RectangleLayerIcon } from './custom-icons/rectangle.svg'
import { ReactComponent as ObjectEditorLineLayer } from './custom-icons/object-editor-line-layer.svg'
import { ReactComponent as SceneBuilderIcon } from './custom-icons/scene-builder.svg'
import { ReactComponent as SearchIcon } from './custom-icons/search.svg'
import { ReactComponent as SearchInput } from './custom-icons/search-input.svg'
import { ReactComponent as SingleIcon } from './custom-icons/single.svg'
import { ReactComponent as ToastCheckmarkIcon } from './custom-icons/success.svg'
import { ReactComponent as ToastUndoIcon } from './custom-icons/undo.svg'
import { ReactComponent as VisualizationsListIcon } from './custom-icons/visualizations-list.svg'
import { ReactComponent as WarningIcon } from './custom-icons/warning.svg'
import { ReactComponent as ZoomInIcon } from './custom-icons/zoom-in.svg'
import { ReactComponent as ZoomOutIcon } from './custom-icons/zoom-out.svg'
import { ReactComponent as ChipRemove } from './custom-icons/chip-remove.svg'
import { ReactComponent as BarLayer } from './custom-icons/bar-layer.svg'
import { ReactComponent as Visualizations } from './custom-icons/visualizations.svg'
import { ReactComponent as Visualization } from './custom-icons/visualization.svg'
import { ReactComponent as DataSource } from './custom-icons/data-source.svg'
import { ReactComponent as Database } from './custom-icons/database.svg'
import { ReactComponent as Resource } from './custom-icons/resource.svg'
import { ReactComponent as Tenant } from './custom-icons/tenant.svg'
import { ReactComponent as Place } from './custom-icons/place.svg'
import { ReactComponent as Unplace } from './custom-icons/unplace.svg'
import { ReactComponent as ReplaceImage } from './custom-icons/replace-image.svg'
import { ReactComponent as ReplaceModel } from './custom-icons/replace-model.svg'
import { ReactComponent as Error } from './custom-icons/error.svg'
import { ReactComponent as NotFound } from './custom-icons/notfound.svg'
import { ReactComponent as SendBackward } from './custom-icons/send-backward.svg'
import { ReactComponent as BringForward } from './custom-icons/bring-forward.svg'

import {
  ReactComponent as ChevronRight,
  ReactComponent as PanelMenuChevronRight
} from './custom-icons/panel-menu-chevron-right.svg'
import { ReactComponent as PanelMenuChevronLeft } from './custom-icons/panel-menu-chevron-left.svg'
import { ReactComponent as FullScreen } from './custom-icons/full-screen.svg'
import { ReactComponent as ImageHistory } from './custom-icons/image-history.svg'
import { ReactComponent as FileUpload } from './custom-icons/file-upload.svg'
import { ReactComponent as Decimal } from './custom-icons/decimal.svg'
import { ReactComponent as Settings } from './custom-icons/settings.svg'
import { ReactComponent as Reset } from './custom-icons/reset.svg'
import MapStyleBuilding from './custom-icons/map-styles/building.png'
import MapStyleDark from './custom-icons/map-styles/dark.png'
import MapStyleLight from './custom-icons/map-styles/light.png'
import MapStyleLightStreet from './custom-icons/map-styles/light-street.png'
import MapStyleNavigation from './custom-icons/map-styles/navigation.png'
import MapStyleNone from './custom-icons/map-styles/none.png'
import MapStyleSatellite from './custom-icons/map-styles/satellite.png'
import MapStyleGoogleMapsSatellite from './custom-icons/map-styles/google-maps-satellite.png'
import { ReactComponent as Brush } from './custom-icons/brush.svg'
import { ReactComponent as Hopara } from './custom-icons/hopara.svg'
import { ReactComponent as Crop } from './custom-icons/crop.svg'
import { ReactComponent as PanelClose } from './custom-icons/panel-close.svg'
import { ReactComponent as ColorLegendExpand } from './custom-icons/color-legend-expand.svg'
import { ReactComponent as ColorLegendClose } from './custom-icons/color-legend-close.svg'
import { ReactComponent as StartAutoRotate } from './custom-icons/start-auto-rotate.svg'
import { ReactComponent as StopAutoRotate } from './custom-icons/stop-auto-rotate.svg'
import { ReactComponent as ObjectIcon } from './custom-icons/object.svg'
import { ReactComponent as MoreIcon } from './custom-icons/more.svg'
import { ReactComponent as ArrowUp } from './custom-icons/arrow-up.svg'
import { ReactComponent as ArrowDown } from './custom-icons/arrow-down.svg'
import { ReactComponent as UserLocation } from './custom-icons/user-location.svg'
import { ReactComponent as UserLocationActive } from './custom-icons/user-location-active.svg'
import { ReactComponent as PDF } from './custom-icons/pdf.svg'
import { ReactComponent as GenerateIsometric } from './custom-icons/generate-isometric.svg'
import { ReactComponent as ProjectToIsometric } from './custom-icons/project-to-isometric.svg'
import { ReactComponent as ChevronExpand } from './custom-icons/chevron-expand.svg'
import { ReactComponent as ChevronClose } from './custom-icons/chevron-close.svg'
import { ReactComponent as RotateLeft } from './custom-icons/rotate-left.svg'
import { ReactComponent as RotateRight } from './custom-icons/rotate-right.svg'
import { ReactComponent as Rotate } from './custom-icons/rotate.svg'  
import { Box } from '@mui/material'


export const sizeToPx = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 72
}

export const customIcons = {
  'success-outlined': SuccessOutlined,
  'filters': FiltersIcon,
  'general': GeneralIcon,
  'helper': HelperIcon,
  'email-sent': EmailSentIcon,
  'key': KeyIcon,
  'layers': LayersIcon,
  'padlock': PadlockIcon,
  'orbit': OrbitIcon,
  'pan': PanIcon,
  'placeholder': PlaceholderIcon,
  'single': SingleIcon,
  'success': ToastCheckmarkIcon,
  'undo': ToastUndoIcon,
  'object': ObjectIcon,
  'scene-builder': SceneBuilderIcon,
  'initial-position': InitialPositionIcon,
  'zoom-in': ZoomInIcon,
  'zoom-out': ZoomOutIcon,
  'search': SearchIcon,
  'search-input': SearchInput,
  'expand-less': LevelUpIcon,
  'expand-more': LevelDownIcon,
  'jump-back': JumpBackIcon,
  'floors': FloorsIcon,
  'visualizations-list': VisualizationsListIcon,
  'visualization': Visualization,
  'visualizations': Visualizations,
  'data-source': DataSource,
  'resource': Resource,
  'warning': WarningIcon,
  'multiple': MultipleIcon,
  'progress-activity': ({ width, height }) => (
    <ProgressActivity width={width} height={height} />
  ),
  'polygon-modify-mode': PolygonModifyMode,
  'polygon-transform-mode': PolygonTransformMode,
  'polygon-fit-to-image': PolygonFitToImage,
  'polygon-fit-to-building': PolygonFitToBuilding,
  'polygon-fit-to-room': PolygonFitToRoom,
  'image-fit-to-building': ImageFitToBuilding,
  'line-layer': LineLayer,
  'object-editor-line-layer': ObjectEditorLineLayer,
  'rectangle-layer': RectangleLayerIcon,
  'bar-layer': BarLayer,
  'chip-remove': ChipRemove,
  'tenant': Tenant,
  'unplace': Unplace,
  'place': Place,
  'replace-image': ReplaceImage,
  'replace-model': ReplaceModel,
  'error': Error,
  'notfound': NotFound,
  'chevron-right': ChevronRight,
  'panel-menu-chevron-right': PanelMenuChevronRight,
  'full-screen': FullScreen,
  'image-history': ImageHistory,
  'file-upload': FileUpload,
  'map-style-building': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleBuilding} />,
  'map-style-dark': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleDark} />,
  'map-style-light': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleLight} />,
  'map-style-light-street': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleLightStreet} />,
  'map-style-navigation': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleNavigation} />,
  'map-style-none': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleNone} />,
  'map-style-satellite': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleSatellite} />,
  'map-style-google-maps-satellite': ({ height }) => <Box component='img' sx={{ height: height ?? '32px' }} src={MapStyleGoogleMapsSatellite} />,
  'type-decimal': Decimal,
  'brush': Brush,
  'hopara': Hopara,
  'crop': Crop,
  'panel-close': PanelClose,
  'panel-menu-chevron-left': PanelMenuChevronLeft,
  'color-legend-expand': ColorLegendExpand,
  'color-legend-close': ColorLegendClose,
  'start-auto-rotate': StartAutoRotate,
  'stop-auto-rotate': StopAutoRotate,
  'settings': Settings,
  'more': MoreIcon,
  'reset': Reset,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'database': Database,
  'user-location': UserLocation,
  'user-location-active': UserLocationActive,
  'pdf': PDF,
  'generate-isometric': GenerateIsometric,
  'project-to-isometric': ProjectToIsometric,
  'chevron-expand': ChevronExpand,
  'chevron-close': ChevronClose,
  'rotate-left': RotateLeft,
  'rotate-right': RotateRight,
  'rotate': Rotate,
  'send-backward': SendBackward,
  'bring-forward': BringForward
}

export const customIconKeys = Object.keys(customIcons) as CustomIconKey[]

export type CustomIconKey = keyof typeof customIcons

interface Props {
  size: number;
  icon: CustomIconKey;
  color?: string;
  style?: any;
}

const CustomIcon = (props: Props): React.ReactElement | null => {
  const IconComponent = customIcons[props.icon]
  if (IconComponent) {
    return <IconComponent width={props.size} height={props.size} color={props.color} style={props.style}
                          data-testid={`${props.icon}-icon`} />
  }
  return null
}

export default CustomIcon
