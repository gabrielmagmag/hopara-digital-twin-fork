from typing import List

from common.process_resource_event import EventData
from consumer.image.isometric import to_isometric_top
from consumer.worker import ImageWorker, WorkerImageMetadataResult


class ImageToIsometricTopWorker(ImageWorker):
    def process(
            self, data: EventData, input_buffer: bytes, input_metadata: dict
    ) -> tuple[List[bytes], WorkerImageMetadataResult]:
        angles = data.get('angles') or []
        if not angles:
            raise ValueError('No angle provided for isometric transform')
        buffer, width, height = to_isometric_top(input_buffer, angles[0])
        metadata: WorkerImageMetadataResult = {
            'width': width,
            'height': height,
        }
        return [buffer], metadata
