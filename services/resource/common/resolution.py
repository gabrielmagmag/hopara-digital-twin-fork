from typing import Literal, Optional

from common.dictionary import get_with_default

ResolutionType = Literal['tb', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl']

sizes: dict[ResolutionType, int] = {
    'tb': 256,
    'xxs': 512,
    'xs': 1024,
    'sm': 2048,
    'md': 4096,
    'lg': 8192,
    'xl': 16383
}

default_resolution: ResolutionType = 'md'


class Resolution:
    @staticmethod
    def all() -> list[ResolutionType]:
        return list(sizes.keys())

    @staticmethod
    def get_resolutions_desc():
        return list(reversed(list(sizes.keys())))

    @staticmethod
    def default():
        return default_resolution, sizes[default_resolution]

    @staticmethod
    def default_resolution() -> ResolutionType:
        return default_resolution

    @staticmethod
    def default_size() -> int:
        return sizes[default_resolution]

    @staticmethod
    def get_compatible(max_size: Optional[int] = None, ignore_default: bool = False) -> list:
        resolutions = []
        for resolution, size in sizes.items():
            if ignore_default and resolution == default_resolution:
                continue
            if not max_size or size <= max_size:
                resolutions.append(resolution)
        return list(reversed(resolutions))

    @staticmethod
    def get_size(resolution: ResolutionType | None) -> int:
        return get_with_default(sizes, resolution, Resolution.default_size())

    @staticmethod
    def get_resolution(size: str) -> ResolutionType | None:
        if not size.isdigit():
            return None
        for resolution, res_size in sizes.items():
            if res_size == int(size):
                return resolution
        return None
