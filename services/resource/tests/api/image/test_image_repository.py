import unittest

from api.image.image_path import ImagePath
from api.image.image_repository import ImageRepository
from common.angle import angles
from common.resource_path import ResourcePath
from common.resource_result import ResourceResult
from common.resource_state import ResourceState
from tests.test_utils import (any_library, any_name, any_tenant, any_version,
                              get_storage)

base_path = f'image/customers/{any_tenant}/{any_library}'
invalidation_base_path = f'/tenant/{any_tenant}/image-library/{any_library}/image'
cwd = ImagePath.get_base_dir(any_tenant, any_library, any_name)


class TestImageRepository(unittest.TestCase):
    def setUp(self):
        self.storage = get_storage()
        self.repository = ImageRepository(self.storage)
        self.storage.delete_folder('image')

    ### GET ###
    def test_get_not_found(self):
        result = self.repository.get(any_tenant, any_library, 'not_found', any_version, 'image')
        self.assertEqual(result, ResourceResult(ResourceState.NOT_FOUND, None))

    def test_get_processing(self):
        cwd = ImagePath.get_base_dir(any_tenant, any_library, any_name)
        self.storage.upload(b'raw', ImagePath.get_raw_file_path(any_version), cwd=cwd)
        self.storage.upload(b'processing', ResourcePath.get_progress_image_path(), cwd=cwd)

        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image')
        self.assertEqual(result, ResourceResult.processing(b'processing'))

    def test_get_only_one_resolution(self):
        self.storage.upload(b'4096', ImagePath.get_resolution_path(any_version, 'md'), {'width': 1234}, cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image')
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.metadata['tenant'], any_tenant)
        self.assertEqual(result.metadata['library'], any_library)
        self.assertEqual(result.metadata['name'], any_name)
        self.assertEqual(result.metadata['version'], any_version)
        self.assertEqual(str(result.metadata['width']), '1234')
        self.assertEqual(result.buffer, b'4096')

    def test_get_has_only_lower_resolution(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(any_version, 'sm'), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', resolution='md')
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'2048')

    def test_get_has_only_higher_resolution(self):
        self.storage.upload(b'8092', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        self.storage.upload(b'16383', ImagePath.get_resolution_path(any_version, 'xl'), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', resolution='md')
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'8092')

    def test_get_has_higher_resolution_but_surpasses_max_size(self):
        self.storage.upload(b'8092', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        self.storage.upload(b'16383', ImagePath.get_resolution_path(any_version, 'xl'), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', 'md', 8200)
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'8092')

    def test_get_not_found_if_resolutions_surpass_max_size(self):
        self.storage.upload(b'8092', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        self.storage.upload(b'16383', ImagePath.get_resolution_path(any_version, 'xl'), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', 'md', 8000)
        self.assertEqual(result.state, ResourceState.NOT_FOUND)
        self.assertIsNone(result.buffer)

    def test_get_with_angle(self):
        for angle in angles:
            self.storage.upload(b'any', ImagePath.get_resolution_path(any_version, 'md', angle), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', angle=45)
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'any')
        self.assertEqual(result.metadata.get('allow_rotation'), True)

    def test_get_with_invalid_angle(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(any_version, 'sm', 45), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', angle=135)
        self.assertEqual(result.state, ResourceState.NOT_FOUND)
        self.assertIsNone(result.buffer)

    def test_get_fallback_to_angle(self):
        for angle in angles:
            self.storage.upload(b'any', ImagePath.get_resolution_path(any_version, 'md', angle), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image')
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'any')
        self.assertEqual(result.metadata.get('allow_rotation'), True)

    def test_get_json_fallback_to_angle(self):
        for angle in angles:
            self.storage.upload(b'any', ImagePath.get_resolution_path(any_version, 'md', angle), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'json')
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.metadata.get('allow_rotation'), True)

    def test_get_fallback_to_regular_if_angle_not_found(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(any_version, 'sm'), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'json', angle=45)
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertFalse(result.metadata.get('allow_rotation', False))

    def test_get_processing_with_image(self):
        self.storage.upload(b'2048', ImagePath.get_file_path(any_version, 'raw'), cwd=cwd)
        self.storage.upload(b'processing-image', 'progress.webp', cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image')
        self.assertEqual(result.state, ResourceState.PROCESSING)
        self.assertEqual(result.buffer, b'processing-image')

    def test_get_processing_with_image_json(self):
        self.storage.upload(b'2048', ImagePath.get_file_path(any_version, 'raw'), cwd=cwd)
        self.storage.upload(b'processing-image', 'progress.webp', cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'json')
        self.assertEqual(result.state, ResourceState.PROCESSING)
        self.assertEqual(result.buffer, b'{"dimensions": {"width": 4096, "height": 4096}}')

    def test_get_success_if_there_is_only_one_angle_and_it_was_requested(self):
        self.storage.upload(b'any', ImagePath.get_file_path(any_version, 'raw'), cwd=cwd)
        self.storage.upload(b'any', ImagePath.get_resolution_path(any_version, 'md', 45), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image', angle=45)
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(b'any', result.buffer)
        self.assertIsNone(result.metadata.get('allow_rotation'), None)

    def test_get_success_with_default_angle_if_there_is_only_one_angle(self):
        self.storage.upload(b'any', ImagePath.get_file_path(any_version, 'raw'), cwd=cwd)
        self.storage.upload(b'any', ImagePath.get_resolution_path(any_version, 'md', 45), cwd=cwd)
        result = self.repository.get(any_tenant, any_library, any_name, any_version, 'image')
        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(b'any', result.buffer)
        self.assertIsNone(result.metadata.get('allow_rotation'), None)

    ### END GET ###

    ## GET HIGHER RESOLUTION PATH ##
    def test_get_higher_resolution_path(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(any_version, 'sm'), cwd=cwd)
        self.storage.upload(b'8192', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        path = self.repository.get_higher_resolution_path(cwd, any_version)
        self.assertEqual(
            path, f'image/customers/{any_tenant}/{any_library}/{any_name}/{any_version}/8192.webp'
        )

    ### END GET HIGHER RESOLUTION PATH ###

    ## GET HIGHER RESOLUTION PATH ##
    def test_get_lower_resolution_path(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(any_version, 'sm'), cwd=cwd)
        self.storage.upload(b'8192', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        path = self.repository.get_lower_resolution_path(cwd, any_version)
        self.assertEqual(
            path, f'image/customers/{any_tenant}/{any_library}/{any_name}/{any_version}/2048.webp'
        )

    ### END GET HIGHER RESOLUTION PATH ###

    ### CLEAR CACHE ###
    def test_clear_cache(self):
        cache_path = ImagePath.get_base_dir(any_tenant, any_library, any_name) + '/cache_any.txt'
        self.storage.upload(b'any_cache', cache_path)
        self.assertTrue(self.storage.file_exists(cache_path))
        self.repository.clear_cache(any_tenant, any_library, any_name)
        self.assertFalse(self.storage.file_exists(cache_path))

    ### END CLEAR CACHE ###

    ### GET LATEST VERSION ###
    def test_get_latest_version(self):
        self.storage.upload(b'any', ImagePath.get_resolution_path(12345, 'md'), cwd=cwd)
        self.storage.upload(b'any', ImagePath.get_resolution_path(12346, 'md'), cwd=cwd)
        self.storage.upload(b'any', ImagePath.get_resolution_path(12344, 'md'), cwd=cwd)
        latest = self.repository.get_latest_version(any_tenant, any_library, any_name)
        self.assertEqual(latest, 12346)

    ### END GET LATEST VERSION ###

    ### SAVE ###
    def test_save_original(self):
        cwd = ImagePath.get_base_dir(any_tenant, any_library, any_name)
        original_path = ImagePath.get_raw_file_path(any_version)
        self.assertFalse(self.storage.file_exists(original_path, cwd=cwd))
        self.repository.save(any_tenant, any_library, any_name, any_version, b'test')
        self.assertTrue(self.storage.file_exists(original_path, cwd=cwd))

    ### END SAVE ###

    ### GET BEST RESOLUTION FILE ###
    def test_get_best_resolution_file_with_max_size(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(any_version, 'sm'), cwd=cwd)
        self.storage.upload(b'4096', ImagePath.get_resolution_path(any_version, 'md'), cwd=cwd)
        self.storage.upload(b'8192', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        buffer, metadata = self.repository._get_best_resolution_file(cwd, any_version, 'lg', 4096)
        self.assertEqual(b'4096', buffer)

    def test_get_best_resolution_file_with_has_exact_resolution(self):
        self.storage.upload(b'4096', ImagePath.get_resolution_path(
            any_version, 'md'
        ), cwd=cwd)
        buffer, metadata = self.repository._get_best_resolution_file(cwd, any_version, 'md', None)
        self.assertEqual(b'4096', buffer)

    def test_get_best_resolution_file_with_has_only_lower(self):
        self.storage.upload(b'2048', ImagePath.get_resolution_path(
            any_version, 'sm'
        ), cwd=cwd)
        self.storage.upload(b'4096', ImagePath.get_resolution_path(
            any_version, 'md'
        ), cwd=cwd)

        buffer, metadata = self.repository._get_best_resolution_file(cwd, any_version, 'xl', None)
        self.assertEqual(b'4096', buffer)

    def test_get_best_resolution_file_with_has_only_higher(self):
        self.storage.upload(b'8192', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        self.storage.upload(b'16383', ImagePath.get_resolution_path(any_version, 'xl'), cwd=cwd)

        buffer, metadata = self.repository._get_best_resolution_file(cwd, any_version, 'sm', 10000)
        self.assertEqual(b'8192', buffer)

    def test_get_best_resolution_file_with_has_only_higher_with_max_size(self):
        self.storage.upload(b'8192', ImagePath.get_resolution_path(any_version, 'lg'), cwd=cwd)
        self.storage.upload(b'16383', ImagePath.get_resolution_path(any_version, 'xl'), cwd=cwd)

        buffer, metadata = self.repository._get_best_resolution_file(cwd, any_version, 'sm', 8000)
        self.assertIsNone(buffer)

    ### END GET BEST RESOLUTION FILE ###

    ### GET FROM GLOBAL ###
    def test_get_from_global_not_found(self):
        result = self.repository.get_from_global('missing', 'image')
        self.assertEqual(result.state, ResourceState.NOT_FOUND)

    def test_get_from_global_found_in_library(self):
        global_cwd = ImagePath.get_base_dir('', 'lab', any_name)
        self.storage.upload(b'4096', ImagePath.get_resolution_path(any_version, 'md'), {'width': 10}, cwd=global_cwd)

        result = self.repository.get_from_global(any_name, 'image')

        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'4096')
        self.assertEqual(result.metadata['library'], 'lab')

    def test_get_from_global_is_deterministic_across_libraries(self):
        # Same name in two global libraries: alphabetically-first ('a-lib') must win over 'b-lib'.
        a_cwd = ImagePath.get_base_dir('', 'a-lib', any_name)
        b_cwd = ImagePath.get_base_dir('', 'b-lib', any_name)
        self.storage.upload(b'from-a', ImagePath.get_resolution_path(any_version, 'md'), cwd=a_cwd)
        self.storage.upload(b'from-b', ImagePath.get_resolution_path(any_version, 'md'), cwd=b_cwd)

        result = self.repository.get_from_global(any_name, 'image')

        self.assertEqual(result.state, ResourceState.SUCCESS)
        self.assertEqual(result.buffer, b'from-a')
        self.assertEqual(result.metadata['library'], 'a-lib')
