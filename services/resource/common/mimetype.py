import magic


def is_gltf(buffer: bytes) -> bool:
    return buffer.startswith(b'glTF')


def is_svg(buffer: bytes) -> bool:
    head = buffer[:1024].decode("utf-8", errors="ignore").lower()
    return "<svg" in head


def is_webp(buffer: bytes) -> bool:
    return len(buffer) >= 12 and buffer[:4] == b'RIFF' and buffer[8:12] == b'WEBP'


def discover_mimetype(buffer: bytes) -> str:
    if is_gltf(buffer):
        return 'model/gltf-binary'
    if is_svg(buffer):
        return 'image/svg+xml'
    if is_webp(buffer):
        return 'image/webp'
    return magic.from_buffer(buffer, mime=True)