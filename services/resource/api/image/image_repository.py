import json
import os
from typing import List, Optional

from api.image.image import ImageRequestFormat
from api.image.image_path import ImagePath
from common.angle import DEFAULT_ANGLE, angles
from common.client.storage import Storage
from common.resolution import Resolution, ResolutionType
from common.resource_path import ResourcePath
from common.resource_result import ResourceResult
from common.version import VersionFactory


class ImageRepository:
    def __init__(self, storage: Storage):
        self.storage = storage
        self.version_factory = VersionFactory()

    def _all_angles_exist(self, cwd: str, version: int) -> bool:
        for angle in angles:
            if not self.storage.file_exists(ImagePath.get_resolution_path(version, Resolution.default(), angle), cwd):
                return False
        return True

    def __get_best_resolution(
            self, cwd: str, version: int, resolutions: List[ResolutionType], angle: Optional[int] = None
    ) -> tuple[Optional[bytes], Optional[dict]]:
        for resolution in resolutions:
            buffer, metadata = self.storage.get(ImagePath.get_resolution_path(version, resolution, angle), cwd)
            if buffer:
                return buffer, metadata
        return None, None

    @staticmethod
    def _set_allow_rotation(metadata: Optional[dict]) -> Optional[dict]:
        metadata = metadata or {}
        metadata['allow_rotation'] = True
        return metadata

    def _get_first_compatible_file(
            self, cwd: str, version: int, resolutions: List[ResolutionType],
            angle: Optional[int] = None
    ) -> tuple[Optional[bytes], Optional[dict]]:
        # pediu sem angulo
        if not angle:
            buffer, metadata = self.__get_best_resolution(cwd, version, resolutions)
            if buffer:
                return buffer, metadata

            # se pediu sem angulo, mas não existe vamos tentar com angulo
            buffer, metadata = self.__get_best_resolution(cwd, version, resolutions, DEFAULT_ANGLE)
            if buffer:
                if self._all_angles_exist(cwd, version):
                    metadata = self._set_allow_rotation(metadata)
                return buffer, metadata
            return None, None

        # pediu com angulo
        buffer, metadata = self.__get_best_resolution(cwd, version, resolutions, angle)
        if buffer:
            if self._all_angles_exist(cwd, version):
                metadata = self._set_allow_rotation(metadata)
            return buffer, metadata

        # se pediu com angulo, mas não achou vamos tentar sem angulo
        buffer, metadata = self.__get_best_resolution(cwd, version, resolutions)
        if buffer: return buffer, metadata

        return None, None

    def _get_best_resolution_file(
            self, cwd: str, version: int, resolution: ResolutionType | None,
            max_size: int | None, angle: Optional[int] = None
    ) -> tuple[Optional[bytes], Optional[dict]]:
        asked_and_lower = Resolution.get_compatible(Resolution.get_size(resolution), ignore_default=False)

        compatible_to_max_size = Resolution.get_compatible(max_size, ignore_default=False)
        asked_compatible = list(filter(
            lambda res: res in compatible_to_max_size, asked_and_lower
        ))
        higher_resolutions = list(reversed(
            [res for res in compatible_to_max_size if res not in asked_compatible]
        ))

        # Vamos tentar pegar a resolução pedida ou menor
        buffer, metadata = self._get_first_compatible_file(
            cwd, version, asked_compatible, angle
        )
        if buffer: return buffer, metadata
        # Caso não ache nada, vamos pegar maiores desde que obedeçam o max_size
        return self._get_first_compatible_file(cwd, version, higher_resolutions, angle)

    def get(
            self, tenant: str, library: str, name: str, version: int,
            format: ImageRequestFormat,
            resolution: ResolutionType | None = None, max_size: Optional[int] = None,
            angle: Optional[int] = None
    ) -> ResourceResult:
        cwd = ImagePath.get_base_dir(tenant, library, name)
        buffer, metadata = self._get_best_resolution_file(cwd, version, resolution, max_size, angle)
        if metadata is not None:
            metadata['tenant'] = tenant
            metadata['library'] = library
            metadata['name'] = name
            metadata['version'] = version

        if buffer:
            if format == 'json':
                return ResourceResult.success(None, metadata)
            return ResourceResult.success(buffer, metadata)

        # processing
        if self.storage.file_exists(ImagePath.get_raw_file_path(version), cwd):
            buffer = self.storage.get_bytes(ResourcePath.get_progress_image_path(), cwd)
            if format == 'json':
                return ResourceResult.processing(json.dumps({
                    'dimensions': {
                        'width': Resolution.default_size(),
                        'height': Resolution.default_size(),
                    }
                }).encode())
            return ResourceResult.processing(buffer)
        return ResourceResult.not_found()

    def _list_global_libraries(self) -> List[str]:
        general_dir = 'image/hopara/'
        # fast_mode lists only the top-level library folders (S3 CommonPrefixes / one
        # listdir level) instead of enumerating every object under the prefix.
        folders = self.storage.enum_folders(general_dir, fast_mode=True)
        return sorted({
            os.path.basename(folder.rstrip('/'))
            for folder in folders
            if folder.rstrip('/')
        })

    def get_from_global(
            self, name: str, format: ImageRequestFormat,
            resolution: Optional[ResolutionType] = None, max_size: Optional[int] = None,
            angle: Optional[int] = None,
    ) -> ResourceResult:
        for library in self._list_global_libraries():
            version = self.get_latest_version('', library, name)
            if version:
                return self.get('', library, name, version, format, resolution, max_size, angle)
        return ResourceResult.not_found()

    def get_higher_resolution_path(self, cwd: str, version: int) -> Optional[str]:
        for resolution in Resolution.get_resolutions_desc():
            path = f'{cwd}/{ImagePath.get_resolution_path(version, resolution)}'
            if self.storage.file_exists(path):
                return path
        # Generate (isometrify) output versions only contain angle-suffixed
        # resolution files; the un-rotated source image is preserved as `raw`,
        # which is the correct input for re-generating from such a version.
        raw_path = f'{cwd}/{ImagePath.get_raw_file_path(version)}'
        if self.storage.file_exists(raw_path):
            return raw_path
        return None

    def get_lower_resolution_path(self, cwd: str, version: int) -> Optional[str]:
        for resolution in Resolution.all():
            path = f'{cwd}/{ImagePath.get_resolution_path(version, resolution)}'
            if self.storage.file_exists(path):
                return path
        return None

    def clear_cache(self, tenant: str, library: str, name: str) -> None:
        processed_dir = ImagePath.get_base_dir(tenant, library, name)
        files = self.storage.search_files(processed_dir, 'cache_')
        for file in files:
            self.storage.delete(f'{processed_dir}/{file}')

    def get_latest_version(self, tenant: str, library: str, name: str) -> int | None:
        return self.storage.get_latest_version(ImagePath.get_base_dir(tenant, library, name))

    def save(self, tenant: str, library: str, name: str, version: int, buffer: bytes) -> None:
        cwd = ImagePath.get_base_dir(tenant, library, name)
        self.storage.upload(buffer, ImagePath.get_raw_file_path(version), cwd=cwd)
