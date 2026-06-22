# Global Images Support — Design

**Issue:** [#71 Global images support](https://github.com/hopara-io/hopara-digital-twin/issues/71)
**Service:** `services/resource` (Python, resource-api)
**Date:** 2026-06-22

## Goal

Allow image libraries to be **shared across tenants**, the same way icons and 3D
models already are. Today images only live in a per-tenant namespace
(`image/customers/<tenant>/<library>/…`). This adds support for a **global**
namespace (`image/hopara/<library>/…`) that any tenant can read, making it easy
to structure shared image libraries (e.g. lab assets).

The implementation mirrors the **3D model** pattern end-to-end.

## How models do it today (the pattern we copy)

Models resolve global resources through a **transparent fallback**, not a special
URL:

1. `ModelPath.get_base_dir` switches namespace by tenant:
   ```python
   if not tenant:  # global
       return f'model/hopara/{library}/{name}'
   return ResourcePath.get_base_dir(model_type, tenant, library, name)  # per-tenant
   ```
2. `ModelService.get` tries the tenant namespace first; if the resource is not
   found, `ModelRepository.get_from_template` scans **all** libraries under
   `model/hopara/` looking for a resource with that name (the requested library
   is intentionally ignored on the fallback — same as the icon `find` path).

Global libraries are **read-only by construction**: every public route carries a
`<tenant>` path segment, so no request ever reaches the empty-tenant (global)
write path. Global libraries are populated out-of-band (admin tooling), exactly
like icons and models today.

## Why not the icon name convention

Icons decide global-vs-private purely by library name (`library == tenant`
→ private, otherwise → global). That rule is **unsafe for images**, because
images already rely on arbitrary per-tenant named libraries (`default`, `lab`,
etc.). Adopting the icon rule would reinterpret every existing per-tenant image
library as global and require a data migration. The model approach
(empty-tenant → global, plus a name-based fallback) is non-breaking, so we use
it.

## Scope

In scope (this iteration):

- Read/serve global images via a transparent fallback in `ImageService.get`.
- Respect `format`, `resolution`, `max-size`, and `angle` for global images.

Out of scope (explicitly deferred):

- Library-listing / discovery endpoints (`GET /image-library`,
  `GET /image-library/<lib>/image`). The model does not expose these, and we are
  staying 1:1 with the model. The `LibraryRepository` already targets
  `image/hopara/`, so this can be added later without rework.
- Writing to global libraries through the public API (remains out-of-band).
- Consumer/processing changes (global images are populated already-processed).

## Components

### 1. `api/image/image_path.py` — `ImagePath.get_base_dir`

Add the global branch, mirroring `ModelPath`:

```python
from urllib.parse import quote

@staticmethod
def get_base_dir(tenant: str, library: str, name: str) -> str:
    if not tenant:
        return f'image/hopara/{library}/{quote(name, "")}'   # global
    return ResourcePath.get_base_dir(image_type, tenant, library, name)  # per-tenant (unchanged)
```

`name` is quoted to stay consistent with `ResourcePath.get_base_dir`. Because
every other path/repository helper derives from `get_base_dir`, reading a global
image becomes "call the existing methods with `tenant=''`".

### 2. `api/image/image_repository.py` — `get_from_global`

New method that mirrors `ModelRepository._get_template_file_path` +
`get_from_template`:

```python
def get_from_global(
        self, name: str, format: ImageRequestFormat,
        resolution: ResolutionType | None = None, max_size: int | None = None,
        angle: int | None = None,
) -> ResourceResult:
    for library in self._enum_global_libraries():            # enum_folders('image/hopara/'), sorted
        version = self.get_latest_version('', library, name)  # tenant='' -> image/hopara/<library>/<name>
        if version:
            return self.get('', library, name, version, format, resolution, max_size, angle)
    return ResourceResult.not_found()
```

- `_enum_global_libraries` enumerates folders under `image/hopara/` (reuse
  `get_processed_libraries_dir('image')` from `api/paths.py`) and returns them
  **sorted** for deterministic resolution.
- Reuses the existing `ImageRepository.get` / `get_latest_version` — no new
  serving logic.

### 3. `api/image/image_service.py` — `ImageService.get`

Add the global fallback as the last resort, mirroring `ModelService.get`:

```python
def get(self, tenant, library, name, format, resolution, max_size, fallback=None, angle=None):
    version = self.repository.get_latest_version(tenant, library, name)
    if version:
        image = self.repository.get(tenant, library, name, version, format, resolution, max_size, angle)
        if image.state != ResourceState.NOT_FOUND:
            return image
    if fallback:
        version = self.repository.get_latest_version(tenant, library, fallback)
        if version:
            return self.repository.get(tenant, library, fallback, version, format, resolution, max_size, angle)
    return self.repository.get_from_global(name, format, resolution, max_size, angle)  # NEW
```

### Not changed

- **Permissions:** none added — global is read-only by construction (no route
  passes an empty tenant).
- **Consumer:** none — global images are populated already-processed, out-of-band.
- **Cache:** no new invalidation — global libraries are never written via the API.

## Resolution order & edge cases

- **Order:** tenant namespace → `fallback` (same library) → scan global libraries
  by name.
- **Name present in multiple global libraries:** the first in alphabetical order
  wins (deterministic; `sorted` over the `hopara/` folder enumeration).
- **`format` / `resolution` / `max-size` / `angle`:** preserved — `get_from_global`
  forwards everything to `repository.get('', lib, …)`, so JSON metadata, sizing,
  angles, and shape lookups behave identically to per-tenant images.
- **Quoting:** the `hopara` branch quotes `name` to match
  `ResourcePath.get_base_dir`.

## Testing (unittest, service convention)

- `ImagePath.get_base_dir`: empty tenant → `image/hopara/<lib>/<name>`; with
  tenant → `image/customers/...` (no regression).
- `ImageRepository.get_from_global`: finds by name across `hopara/`; returns
  `not_found` when absent; deterministic winner when the name exists in two
  global libraries.
- `ImageService.get`: serves a global image when the tenant has none; tenant
  takes precedence over global; respects `resolution` / `angle` / `format`.
- System test mirroring `tests/api/icon/test_system_icon.py` (which already
  uploads to `icon/hopara/...`), adapted to seed `image/hopara/...` and fetch via
  the public image route.
