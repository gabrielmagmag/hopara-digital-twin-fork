import unittest

from api.image.image_path import ImagePath


class TestImagePath(unittest.TestCase):
    def test_get_base_dir_tenant_is_per_customer(self):
        self.assertEqual(
            ImagePath.get_base_dir('acme', 'lab', 'floor plan'),
            'image/customers/acme/lab/floor%20plan',
        )

    def test_get_base_dir_empty_tenant_is_global(self):
        self.assertEqual(
            ImagePath.get_base_dir('', 'lab', 'floor plan'),
            'image/hopara/lab/floor%20plan',
        )
