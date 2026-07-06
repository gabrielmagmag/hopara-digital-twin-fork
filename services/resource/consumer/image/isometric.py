import io
import math
from typing import Tuple

from PIL import Image

from consumer.image.image_utils import encode_webp

# Vertical squash that turns a 45deg-rotated square into a true-isometric
# rhombus with 30deg edges: tan(30deg) == 1/sqrt(3) ~= 0.57735.
ISO_VERTICAL_SCALE = 1 / math.sqrt(3)


def to_isometric_top(buffer: bytes, angle: int) -> Tuple[bytes, int, int]:
    """Project a flat top-down image to a true-isometric (30deg) rhombus.

    Rotates the plan in-plane by ``angle`` degrees, then foreshortens the
    vertical axis. ``angle`` 45 is the canonical isometric orientation;
    135/225/315 add +90/180/270 degrees. Transparency is preserved.

    The 45deg-class rotation expands the canvas (~(W+H)*0.707 wide), so a large
    plan can exceed WebP's limit; ``encode_webp`` scales it down to fit.
    """
    source = Image.open(io.BytesIO(buffer)).convert('RGBA')
    rotated = source.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    width, height = rotated.size
    new_height = max(1, round(height * ISO_VERTICAL_SCALE))
    iso = rotated.resize((width, new_height), Image.Resampling.LANCZOS)

    return encode_webp(iso, quality=90, optimize=False)
