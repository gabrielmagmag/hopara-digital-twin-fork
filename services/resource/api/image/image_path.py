from typing import Optional
from urllib.parse import quote

from common.resolution import Resolution, ResolutionType
from common.resource_path import ResourcePath

image_type = 'image'
default_ext = 'webp'


class ImagePath:
    @staticmethod
    def get_invalidation_path(tenant: str, library: str, name: str) -> str:
        return ResourcePath.get_resource_library_path(image_type, tenant, name, library) + '*'
    
    @staticmethod
    def get_shape_list_invalidation_path(tenant: str, library: str) -> str:
        return ResourcePath.get_resource_library_base_path(image_type, tenant, library) + '/shape'

    @staticmethod
    def get_raw_file_path(version: int) -> str:
        return ResourcePath.get_raw_file_path(version)

    @staticmethod
    def get_base_dir(tenant: str, library: str, name: str) -> str:
        if not tenant:
            return f'image/hopara/{library}/{quote(name, "")}'
        return ResourcePath.get_base_dir(image_type, tenant, library, name)

    @staticmethod
    def get_version_dir(tenant: str, library: str, name: str, version: int) -> str:
        return ResourcePath.get_version_dir(image_type, tenant, library, name, version)

    @staticmethod
    def get_file_path(version: int, file_name: str) -> str:
        return ResourcePath.get_file_path(version, file_name)

    @staticmethod
    def get_resolution_path(
            version: int, resolution: ResolutionType, angle: Optional[int] = None
    ) -> str:
        angle_str = f'_{angle}' if angle is not None else ''
        return f'{version}/{Resolution.get_size(resolution)}{angle_str}.{default_ext}'

