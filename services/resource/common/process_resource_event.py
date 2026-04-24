from typing import Dict, List, Literal, Optional, Required, TypedDict

from common.crop import CropArea
from common.resolution import ResolutionType


class RequiredEventData(TypedDict):
    origin: str


class EventData(RequiredEventData, total=False):
    destination: Optional[str]
    destinations: Optional[List[str]]
    # common fields
    metadata: Optional[Dict]  # Additional metadata for processing

    # model to image processor
    angles: Optional[List[int]]  # Angle in degrees for rendering
    resolution: Optional[ResolutionType]

    # image to image processor
    hint: Optional[str]  # Prompt for image generation
    model: Optional[str]  # Model name for image generation

    # resize image processor
    max_size: Optional[int]  # Maximum size for image processing
    crop_area: Optional[CropArea]  # Crop area for image processing

    # model compression processor
    extension: Optional[str]  # File extension for models
    compressed_gltf: Optional[bool]  # Whether to compress GLTF models
    compression_level: Optional[int]  # Compression level for models
    reset_centroid: Optional[bool]  # Whether to reset the centroid for models


ResourceStepType = Literal[
    "sequential",
    "parallel",
    "copy",
    "icon_resize",
    'image_crop',
    "image_resize",
    'image_to_fake_render',
    'image_to_model',
    "image_to_rooms",
    "image_to_shape",
    'image_to_wireframe',
    "model_compress",
    'model_to_image',
    'image_remove_text',
    'image_change_material',
]


class ResourceStepNotification(TypedDict, total=False):
    tenant: str
    library: str
    name: str
    progress: float
    event: Required[str]


class RequiredProcessResourceEvent(TypedDict):
    cwd: str
    type: ResourceStepType


class ResourceStep(RequiredProcessResourceEvent, total=False):
    invalidation_urls: List[str]
    use_cache: Optional[bool]
    timeout: Optional[int]
    ready: Optional[bool]
    notification: Optional[ResourceStepNotification]
    steps: List['ResourceStep']
    data: EventData
