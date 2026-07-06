import io
import unittest

from PIL import Image

from common.resolution import Resolution
from consumer.image.image_utils import (
    MAX_WEBP_DIMENSION,
    _fit_within_webp_limit,
    convert_to_webp,
    encode_webp,
    get_image_dimensions,
)

DEFAULT_MAX_TEXTURE_SIZE = Resolution.default()[1]


class ImageUtilsTestCase(unittest.TestCase):
    def test_get_image_dimensions(self):
        self.assertEqual(get_image_dimensions(4096, 4096, DEFAULT_MAX_TEXTURE_SIZE), (4096, 4096))
        self.assertEqual(get_image_dimensions(4096, 2048, DEFAULT_MAX_TEXTURE_SIZE), (4096, 2048))
        self.assertEqual(get_image_dimensions(2048, 4096, DEFAULT_MAX_TEXTURE_SIZE), (2048, 4096))

        self.assertEqual(get_image_dimensions(8192, 8192, DEFAULT_MAX_TEXTURE_SIZE), (4096, 4096))
        self.assertEqual(get_image_dimensions(8192, 4096, DEFAULT_MAX_TEXTURE_SIZE), (4096, 2048))
        self.assertEqual(get_image_dimensions(4096, 8192, DEFAULT_MAX_TEXTURE_SIZE), (2048, 4096))

        self.assertEqual(get_image_dimensions(5148, 3700, DEFAULT_MAX_TEXTURE_SIZE), (4096, 2943))
        self.assertEqual(get_image_dimensions(7852, 5000, DEFAULT_MAX_TEXTURE_SIZE), (4096, 2608))

        self.assertEqual(get_image_dimensions(40960, 20480, DEFAULT_MAX_TEXTURE_SIZE), (4096, 2048))

        self.assertEqual(get_image_dimensions(40960, 20480, 100), (100, 50))


class EncodeWebpTest(unittest.TestCase):
    def test_oversized_image_is_capped_and_encodes(self):
        img = Image.new('RGBA', (20000, 10000), (0, 128, 255, 255))

        out, width, height = encode_webp(img)

        self.assertLessEqual(width, MAX_WEBP_DIMENSION)
        self.assertLessEqual(height, MAX_WEBP_DIMENSION)
        # aspect ratio preserved (2:1), and the limiting side hits the cap
        self.assertEqual(width, MAX_WEBP_DIMENSION)
        self.assertAlmostEqual(width / height, 2.0, places=1)
        self.assertGreater(len(out), 0)
        decoded = Image.open(io.BytesIO(out))
        self.assertEqual(decoded.size, (width, height))

    def test_small_image_passes_through_unchanged(self):
        img = Image.new('RGBA', (640, 480), (10, 20, 30, 255))

        out, width, height = encode_webp(img)

        self.assertEqual((width, height), (640, 480))
        self.assertGreater(len(out), 0)
        self.assertEqual(Image.open(io.BytesIO(out)).size, (640, 480))

    def test_fit_within_webp_limit_returns_same_object_when_small(self):
        img = Image.new('RGBA', (100, 100), (0, 0, 0, 255))
        self.assertIs(_fit_within_webp_limit(img), img)


class ConvertToWebpTest(unittest.TestCase):
    def test_oversized_png_is_capped(self):
        img = Image.new('RGB', (20000, 5000), (255, 0, 0))
        png = io.BytesIO()
        img.save(png, 'PNG')

        out, width, height = convert_to_webp(png.getvalue())

        self.assertLessEqual(width, MAX_WEBP_DIMENSION)
        self.assertLessEqual(height, MAX_WEBP_DIMENSION)
        # returned dims are the FINAL (post-cap) size and match the bytes
        self.assertEqual(Image.open(io.BytesIO(out)).size, (width, height))
