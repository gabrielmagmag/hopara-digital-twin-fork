import unittest
from typing import Any, cast

from common.path import path_join
from common.process_resource_event import EventData
from consumer.image.image_to_isometric_top_worker import ImageToIsometricTopWorker
from tests.test_utils import TEST_ROOT

worker = ImageToIsometricTopWorker(cast(Any, {}))


def _read(name: str) -> bytes:
    with open(path_join(TEST_ROOT, f'fixtures/{name}'), 'rb') as fp:
        return fp.read()


class ImageToIsometricTopWorkerTest(unittest.TestCase):
    def test_process_returns_image_and_dimensions(self):
        data = cast(EventData, {'origin': 'raw', 'angles': [45]})
        buffers, metadata = worker.process(data, _read('sample_icon.png'), {})

        self.assertEqual(len(buffers), 1)
        self.assertGreater(len(buffers[0]), 0)
        self.assertGreater(metadata['width'], 0)
        self.assertGreater(metadata['height'], 0)

    def test_process_uses_first_angle(self):
        buffer = _read('sample_icon.png')
        out_45, _ = worker.process(cast(EventData, {'origin': 'raw', 'angles': [45]}), buffer, {})
        out_135, _ = worker.process(cast(EventData, {'origin': 'raw', 'angles': [135]}), buffer, {})
        self.assertNotEqual(out_45[0], out_135[0])

    def test_process_without_angle_raises(self):
        with self.assertRaisesRegex(ValueError, 'No angle provided'):
            worker.process(cast(EventData, {'origin': 'raw'}), _read('sample_icon.png'), {})
