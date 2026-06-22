import io
import os
import time
import unittest
from unittest.mock import patch

from dependency_injector.wiring import Provide, inject

from api.app import create_app
from api.container import Container
from api.image.image_path import ImagePath
from common.angle import angles
from common.client.storage import Storage
from common.path import path_join
from common.resource_path import ResourcePath
from consumer.app import consumer
from consumer.app import create_app as create_consumer_app
from tests.test_utils import (TEST_ROOT, any_library, any_tenant, any_version,
                              get_authorization_header, get_random_name,
                              upload)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

consumer_app = create_consumer_app()
test_consumer_app = consumer_app.test_client()


def mock_put(*args, **kwargs):
    obj_self, *args = args
    return test_consumer_app.put(*args, **kwargs)


class TestSystemImage(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        consumer.stop_listening()

    def setUp(self):
        self.png_path = path_join(TEST_ROOT, 'fixtures/sample_icon.png')
        self.pdf_path = path_join(TEST_ROOT, 'fixtures/sample_floorplan.pdf')
        self.svg_path = path_join(TEST_ROOT, 'fixtures/sample_image.svg')
        self.webp_path = path_join(TEST_ROOT, 'fixtures/sample.webp')
        self.host = f'http://127.0.0.1:2022/tenant/{any_tenant}'
        self.app = create_app()
        self.app.container.wire(modules=[__name__])
        self.test_app = self.app.test_client()

    def tearDown(self):
        self.app.container.unwire()

    @staticmethod
    def get_file_data(file_path):
        with open(file_path, 'rb') as file:
            return {'file': (io.BytesIO(file.read()), os.path.basename(file_path))}

    @staticmethod
    def get_file_buffer(file_path) -> bytes:
        with open(file_path, 'rb') as file:
            return file.read()

    @inject
    def test_get(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()
        url = f'{self.host}/image-library/{any_library}/image/{random_file_name}'

        response = self.test_app.get(url)
        self.assertEqual(404, response.status_code)

        storage.upload(
            self.get_file_buffer(self.png_path),
            f'image/customers/{any_tenant}/{any_library}/{random_file_name}/{any_version}/4096.webp'
        )

        response = self.test_app.get(url)
        self.assertEqual(200, response.status_code)

    @inject
    def test_get_json_with_fallback_angle(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()
        url = f'{self.host}/image-library/{any_library}/image/{random_file_name}?format=json'

        response = self.test_app.get(url)
        self.assertEqual(404, response.status_code)

        for angle in angles:
            storage.upload(
                self.get_file_buffer(self.png_path),
                f'image/customers/{any_tenant}/{any_library}/{random_file_name}/{any_version}/4096_{angle}.webp'
            )

        response = self.test_app.get(url)
        self.assertEqual(200, response.status_code)
        self.assertTrue(response.json['allow_rotation'])

    def test_get_not_found(self):
        response = self.test_app.get(f'{self.host}/image-library/{any_library}/image/invalid-file')
        self.assertEqual(404, response.status_code, response.json)

    @inject
    def test_get_fallback(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()
        storage.upload(
            self.get_file_buffer(self.png_path),
            f'image/customers/{any_tenant}/{any_library}/{random_file_name}/12345/4096.webp'
        )
        response = self.test_app.get(
            f'{self.host}/image-library/{any_library}/image/invalid-file?fallback={random_file_name}')
        self.assertEqual(200, response.status_code, response.json)

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_get_processing(self, storage: Storage = Provide[Container.storage]):
        name = get_random_name()

        url = f'{self.host}/image-library/{any_library}/image/{name}'
        response = self.test_app.get(url)
        self.assertEqual(404, response.status_code, response.json)

        cwd = ImagePath.get_base_dir(any_tenant, any_library, name)
        raw_path = ImagePath.get_raw_file_path(any_version)
        storage.upload(b'any_raw', raw_path, cwd=cwd)

        progress_image = ResourcePath.get_progress_image_path()
        storage.upload(b'any_image', progress_image, cwd=cwd)

        response = self.test_app.get(url)
        self.assertEqual(202, response.status_code)
        self.assertEqual("true", response.headers['Resource-Long-Processing'])
        self.assertEqual(response.data, b'any_image')

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_find_metadata(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()
        buffer = self.get_file_buffer(self.png_path)

        storage.upload(
            buffer,
            f'image/customers/{any_tenant}/{any_library}/{random_file_name}/{any_version}/4096.webp',
            {'width': '256', 'height': '256'}
        )

        # exercise
        response = self.test_app.get(f'{self.host}/image-library/{any_library}/image/{random_file_name}',
                                     headers={'accept': 'application/json'})

        # verify
        self.assertEqual(200, response.status_code, response.json)
        self.assertEqual('application/json', response.headers.get('Content-Type'))
        self.assertListEqual(
            ['dimensions', 'height', 'library', 'name', 'tenant', 'version', 'width'],
            sorted(list(response.json.keys()))
        )
        self.assertEqual(256, response.json['dimensions']['height'])
        self.assertEqual(256, response.json['dimensions']['width'])

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_save_pdf(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()

        response = self.test_app.put(
            f'{self.host}/image-library/{any_library}/image/{random_file_name}',
            data=self.get_file_data(self.pdf_path),
            headers=get_authorization_header()
        )

        # verify
        self.assertEqual(response.status_code, 200)
        self.assertEqual(2894, response.json['dimensions']['height'])
        self.assertEqual(4096, response.json['dimensions']['width'])

        version = response.json['version']
        cwd = ImagePath.get_base_dir(any_tenant, any_library, random_file_name)

        original_path = ImagePath.get_raw_file_path(version)
        processed_path = ImagePath.get_resolution_path(version, 'md')

        original_bytes, _ = storage.get(original_path, cwd)
        processed_bytes, _ = storage.get(processed_path, cwd)

        self.assertGreater(len(original_bytes), 0)
        self.assertGreater(len(processed_bytes), 0)

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_save_webp(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()

        response = self.test_app.put(
            f'{self.host}/image-library/{any_library}/image/{random_file_name}',
            data=self.get_file_data(self.webp_path),
            headers=get_authorization_header()
        )

        self.assertEqual(response.status_code, 200)

        version = response.json['version']
        cwd = ImagePath.get_base_dir(any_tenant, any_library, random_file_name)

        original_path = ImagePath.get_raw_file_path(version)
        processed_path = ImagePath.get_resolution_path(version, 'md')

        original_bytes, _ = storage.get(original_path, cwd)
        processed_bytes, _ = storage.get(processed_path, cwd)

        self.assertGreater(len(original_bytes), 0)
        self.assertGreater(len(processed_bytes), 0)

    @patch('requests.Session.put', new=mock_put)
    def test_put_invalid_image(self):
        random_file_name = get_random_name()

        response = self.test_app.put(
            f'{self.host}/image-library/{any_library}/image/{random_file_name}',
            data={'file': (io.BytesIO(b'invalid-image'), f'{random_file_name}.webp')},
            headers=get_authorization_header()
        )
        self.assertEqual(response.status_code, 400, response.json)
        self.assertEqual('Invalid image type: text/plain', response.json['message'])

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_history(self, storage: Storage = Provide[Container.storage]):
        suffix = int(time.time())
        name = f'blau-{suffix}'
        url = f'{self.host}/image-library/{any_library}/image/{name}'
        cwd = ImagePath.get_base_dir(any_tenant, any_library, name)
        for i in range(3):
            upload(
                storage,
                self.png_path,
                ImagePath.get_file_path(i + 1, '256.webp'),
                cwd=cwd
            )
            upload(
                storage,
                self.png_path,
                ImagePath.get_raw_file_path(i + 1),
                cwd=cwd
            )

        # enumerate versions
        response = self.test_app.get(f'{url}/history')
        self.assertEqual(200, response.status_code)
        versions = [item['version'] for item in response.json]
        self.assertEqual(4, len(versions))
        latest, middle, oldest, no_image_version = versions
        self.assertGreater(latest, middle, versions)
        self.assertGreater(middle, oldest, versions)
        self.assertGreater(oldest, no_image_version, versions)

        # get current version
        response = self.test_app.get(url)
        self.assertEqual(200, response.status_code, response.json)

        # rollback version
        rollback_response = self.test_app.put(f'{url}/history/{middle}/rollback', headers=get_authorization_header())
        self.assertEqual(200, rollback_response.status_code, response.json)
        get_response = self.test_app.get(url)
        self.assertEqual(200, get_response.status_code)
        rollback_version = rollback_response.json.get('version')
        self.assertTrue(rollback_version > latest, f'{rollback_version=} {versions=}')

        time.sleep(1)
        # restore version
        restore_response = self.test_app.put(f'{url}/history/{middle}/restore', headers=get_authorization_header())
        self.assertEqual(200, restore_response.status_code, response.json)
        get_response2 = self.test_app.get(url)
        self.assertEqual(200, get_response2.status_code, get_response2.json)

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_save_svg(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()

        response = self.test_app.put(
            f'{self.host}/image-library/{any_library}/image/{random_file_name}',
            data=self.get_file_data(self.svg_path),
            headers=get_authorization_header()
        )
        version = response.json['version']
        cwd = ImagePath.get_base_dir(any_tenant, any_library, random_file_name)
        original_path = ImagePath.get_raw_file_path(version)
        processed_path = ImagePath.get_resolution_path(version, 'md')

        original_bytes, _ = storage.get(original_path, cwd)
        processed_bytes, _ = storage.get(processed_path, cwd)

        self.assertGreater(len(original_bytes), 0)
        self.assertGreater(len(processed_bytes), 0)

    @inject
    def test_get_serves_global_image(self, storage: Storage = Provide[Container.storage]):
        random_file_name = get_random_name()
        # Seed a pre-processed image in the GLOBAL namespace (image/hopara/<lib>/<name>/<version>/md.webp).
        global_cwd = ImagePath.get_base_dir('', 'lab', random_file_name)
        storage.upload(
            self.get_file_buffer(self.png_path),
            ImagePath.get_resolution_path(any_version, 'md'),
            cwd=global_cwd,
        )

        # Request it under a tenant library that does NOT contain it.
        url = f'{self.host}/image-library/{any_library}/image/{random_file_name}'
        response = self.test_app.get(url)

        self.assertEqual(200, response.status_code)
        self.assertEqual(self.get_file_buffer(self.png_path), response.data)

    @patch('requests.Session.put', new=mock_put)
    def test_put_and_get_processing_resolution(self):
        random_file_name = get_random_name()

        url = f'{self.host}/image-library/{any_library}/image/{random_file_name}'
        response = self.test_app.put(
            url,
            data=self.get_file_data(self.pdf_path),
            headers=get_authorization_header()
        )
        self.assertEqual(response.status_code, 200, response.json)

        response = self.test_app.get(f'{url}?resolution=md')
        self.assertEqual(200, response.status_code)

        response = self.test_app.get(f'{url}?resolution=sm')
        self.assertEqual(200, response.status_code)

        response = self.test_app.get(f'{url}?resolution=xl')
        self.assertEqual(200, response.status_code)

    @patch('requests.Session.put', new=mock_put)
    @inject
    def test_crop(self, storage: Storage = Provide[Container.storage]):
        name = get_random_name()
        url = f'{self.host}/image-library/{any_library}/image/{name}'
        storage.upload(
            self.get_file_buffer(self.png_path),
            f'image/customers/{any_tenant}/{any_library}/{name}/{any_version}/raw'
        )
        response = self.test_app.post(
            f'{url}/crop', json={'left': 10, 'top': 10, 'bottom': 10, 'right': 10}, headers=get_authorization_header()
        )
        self.assertEqual(200, response.status_code)

        # should be able to crop a cropped image
        response = self.test_app.post(
            f'{url}/crop', json={'left': 10, 'top': 10, 'bottom': 10, 'right': 10}, headers=get_authorization_header()
        )
        self.assertEqual(200, response.status_code)
