import io
import math
import unittest

from PIL import Image

from common.path import path_join
from consumer.image.isometric import ISO_VERTICAL_SCALE, to_isometric_top
from tests.test_utils import TEST_ROOT


def _read(name: str) -> bytes:
    with open(path_join(TEST_ROOT, f'fixtures/{name}'), 'rb') as fp:
        return fp.read()


class IsometricTransformTest(unittest.TestCase):
    def test_iso_scale_is_tan_30(self):
        # 30deg rhombus edges => vertical squash factor == tan(30deg).
        self.assertAlmostEqual(ISO_VERTICAL_SCALE, math.tan(math.radians(30)), places=4)

    def test_width_is_preserved_and_height_is_foreshortened(self):
        buffer = _read('sample_icon.png')
        source = Image.open(io.BytesIO(buffer)).convert('RGBA')
        rotated_width, rotated_height = source.rotate(45, expand=True).size

        out, width, height = to_isometric_top(buffer, 45)

        # Only the vertical axis is squashed; width matches the rotated image.
        self.assertEqual(width, rotated_width)
        self.assertEqual(height, max(1, round(rotated_height * ISO_VERTICAL_SCALE)))
        self.assertLess(height, rotated_height)
        self.assertGreater(len(out), 0)

    def test_output_preserves_transparency(self):
        out, _, _ = to_isometric_top(_read('sample_icon.png'), 45)
        result = Image.open(io.BytesIO(out))
        self.assertEqual(result.mode, 'RGBA')
        # the corners are outside the rotated content => fully transparent
        self.assertEqual(result.getpixel((0, 0))[3], 0)

    def test_angles_produce_different_images(self):
        buffer = _read('sample_icon.png')
        out_45, _, _ = to_isometric_top(buffer, 45)
        out_135, _, _ = to_isometric_top(buffer, 135)
        self.assertNotEqual(out_45, out_135)

    def test_transform_is_deterministic(self):
        buffer = _read('sample_icon.png')
        self.assertEqual(to_isometric_top(buffer, 45)[0], to_isometric_top(buffer, 45)[0])

    def test_large_plan_stays_within_webp_limit(self):
        # A large plan rotated 45deg expands to ~(W+H)*0.707 wide, which can
        # exceed WebP's 16383 px limit. The output must be capped and still
        # encode without raising.
        source = Image.new('RGBA', (12000, 12000), (255, 0, 0, 255))
        buf = io.BytesIO()
        source.save(buf, 'PNG')

        out, width, height = to_isometric_top(buf.getvalue(), 225)

        self.assertLessEqual(width, 16383)
        self.assertLessEqual(height, 16383)
        self.assertGreater(len(out), 0)
        # aspect ratio of the (uncapped) iso projection is preserved
        self.assertAlmostEqual(width / height, 1 / ISO_VERTICAL_SCALE, places=1)
