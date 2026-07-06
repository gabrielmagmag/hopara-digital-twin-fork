# Global Images Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let image libraries be shared across tenants via a global `image/hopara/<library>/` namespace, served through a transparent fallback in `ImageService.get`, exactly mirroring the 3D model pattern.

**Architecture:** Three thin layers change. `ImagePath.get_base_dir` gains an empty-tenant → `image/hopara/<lib>/<name>` branch (like `ModelPath`). `ImageRepository` gains `get_from_global`, which scans the `image/hopara/` folder by name and reuses the existing `get`/`get_latest_version` with `tenant=''`. `ImageService.get` calls `get_from_global` as the last resort, after the per-tenant lookup and the same-library `fallback`. Global libraries are read-only by construction — no public route passes an empty tenant — and are populated out-of-band, so no permission code, consumer changes, or cache changes are needed.

**Tech Stack:** Python 3.11, Flask, `unittest` + `unittest.mock`, ruff, mypy, import-linter. Service: `services/resource`. All commands run from `services/resource/`.

## Global Constraints

- Mirror the **3D model** pattern; do not adopt the icon name convention (it would reinterpret existing per-tenant image libraries as global).
- Global namespace literal is `image/hopara/` (hardcoded in the repository, exactly like `ModelRepository` uses `'model/hopara/'`). Do not import `get_processed_libraries_dir` into `api/image/` (the model repository hardcodes its constant; follow that to avoid import-linter contract changes).
- The `hopara` branch must quote the name with `quote(name, "")` to stay consistent with `ResourcePath.get_base_dir`.
- Global resolution must be deterministic: when a name exists in two global libraries, the alphabetically-first library wins (`sorted`).
- Per-tenant behavior must not regress: with a non-empty tenant, paths still resolve to `image/customers/<tenant>/<library>/<name>`.
- Run `./pre_commit.sh` (ruff + lint-imports + mypy + tests) before the final commit.
- Tests use `unittest`. Run a module with `python -m unittest tests.<dotted.module> -v`.

---

### Task 1: Global branch in `ImagePath.get_base_dir`

**Files:**
- Modify: `services/resource/api/image/image_path.py`
- Create: `services/resource/tests/api/image/test_image_path.py`

**Interfaces:**
- Consumes: `common.resource_path.ResourcePath.get_base_dir(resource_type, tenant, library, name)` (existing).
- Produces: `ImagePath.get_base_dir(tenant: str, library: str, name: str) -> str`. When `tenant` is falsy, returns `f'image/hopara/{library}/{quote(name, "")}'`; otherwise unchanged (`image/customers/<tenant>/<library>/<quoted name>`).

- [ ] **Step 1: Write the failing test**

Create `services/resource/tests/api/image/test_image_path.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.api.image.test_image_path -v`
Expected: `test_get_base_dir_empty_tenant_is_global` FAILS — current code returns `image/customers//lab/...` (no global branch).

- [ ] **Step 3: Write minimal implementation**

In `services/resource/api/image/image_path.py`, add the `quote` import at the top:

```python
from typing import Optional
from urllib.parse import quote

from common.resolution import Resolution, ResolutionType
from common.resource_path import ResourcePath
```

Replace the existing `get_base_dir` (around lines 23-25) with:

```python
    @staticmethod
    def get_base_dir(tenant: str, library: str, name: str) -> str:
        if not tenant:
            return f'image/hopara/{library}/{quote(name, "")}'
        return ResourcePath.get_base_dir(image_type, tenant, library, name)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests.api.image.test_image_path -v`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add services/resource/api/image/image_path.py services/resource/tests/api/image/test_image_path.py
git commit -m "feat(resource): add global hopara namespace to ImagePath.get_base_dir"
```

---

### Task 2: `ImageRepository.get_from_global`

**Files:**
- Modify: `services/resource/api/image/image_repository.py`
- Modify: `services/resource/tests/api/image/test_image_repository.py`

**Interfaces:**
- Consumes:
  - `ImagePath.get_base_dir('', library, name)` from Task 1 (resolves to `image/hopara/<library>/<name>`).
  - Existing `ImageRepository.get_latest_version(tenant, library, name) -> int | None`.
  - Existing `ImageRepository.get(tenant, library, name, version, format, resolution=None, max_size=None, angle=None) -> ResourceResult`.
  - `self.storage.enum_folders(path: str, fast_mode: bool = False) -> list[str]` (returns folder paths like `image/hopara/lab/`).
- Produces: `ImageRepository.get_from_global(name: str, format: ImageRequestFormat, resolution: ResolutionType | None = None, max_size: int | None = None, angle: int | None = None) -> ResourceResult`. Scans global libraries (alphabetical) and returns the first match by name; `ResourceResult.not_found()` if none.

- [ ] **Step 1: Write the failing tests**

Add to `services/resource/tests/api/image/test_image_repository.py` (the suite uses a real local storage via `get_storage()` and clears `image` in `setUp`). Append these methods to the `TestImageRepository` class:

```python
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
```

Note: `any_name` is already imported in this file (`from tests.test_utils import (any_library, any_name, any_tenant, any_version, get_storage)`). `ImagePath` and `ResourceState` are already imported.

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m unittest tests.api.image.test_image_repository -v`
Expected: the three new tests FAIL with `AttributeError: 'ImageRepository' object has no attribute 'get_from_global'`.

- [ ] **Step 3: Write minimal implementation**

In `services/resource/api/image/image_repository.py`, add `import os` at the top (the file currently starts with `import json`):

```python
import json
import os
from typing import List, Optional
```

Add these two methods to the `ImageRepository` class (e.g. just after `get`):

```python
    def _list_global_libraries(self) -> List[str]:
        general_dir = 'image/hopara/'
        libraries: List[str] = []
        for folder in self.storage.enum_folders(general_dir):
            name = os.path.basename(folder.rstrip('/'))
            if name and name not in libraries:
                libraries.append(name)
        return sorted(libraries)

    def get_from_global(
            self, name: str, format: ImageRequestFormat,
            resolution: Optional[ResolutionType] = None, max_size: Optional[int] = None,
            angle: Optional[int] = None,
    ) -> ResourceResult:
        for library in self._list_global_libraries():
            version = self.get_latest_version('', library, name)
            if version:
                return self.get('', library, name, version, format, resolution, max_size, angle)
        return ResourceResult.not_found()
```

(`ImageRequestFormat`, `ResolutionType`, `Optional`, `ResourceResult` are already imported in this file.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m unittest tests.api.image.test_image_repository -v`
Expected: PASS (all tests in the module, including the three new ones).

- [ ] **Step 5: Commit**

```bash
git add services/resource/api/image/image_repository.py services/resource/tests/api/image/test_image_repository.py
git commit -m "feat(resource): add ImageRepository.get_from_global to scan global libraries"
```

---

### Task 3: Global fallback in `ImageService.get`

**Files:**
- Modify: `services/resource/api/image/image_service.py:190-203`
- Modify: `services/resource/tests/api/image/test_image_service.py`

**Interfaces:**
- Consumes: `ImageRepository.get_from_global(name, format, resolution, max_size, angle) -> ResourceResult` from Task 2.
- Produces: unchanged signature `ImageService.get(tenant, library, name, format, resolution, max_size, fallback=None, angle=None) -> ResourceResult`. New behavior: when the per-tenant lookup and the `fallback` lookup both miss, it returns `repository.get_from_global(...)` instead of `ResourceResult.not_found()`.

- [ ] **Step 1: Update existing tests that now exercise the global fallback, and add a new one**

Two existing tests construct the service with a bare `MagicMock()` repository and expect `NOT_FOUND` when nothing is found. They now reach `get_from_global`, so its return value must be stubbed. In `services/resource/tests/api/image/test_image_service.py`:

In `test_get_image_not_found_no_fallback`, after the line `repository_mock.get.return_value = not_found_result`, add:

```python
        repository_mock.get_from_global.return_value = ResourceResult.not_found()
```

In `test_get_image_not_found_fallback_also_not_found`, after the line `repository_mock.get.return_value = not_found_result`, add:

```python
        repository_mock.get_from_global.return_value = ResourceResult.not_found()
```

Then add a new test (place it in the `### GET ###` section, before `### END GET ###`):

```python
    def test_get_serves_global_when_tenant_missing(self):
        repository_mock = MagicMock()
        repository_mock.get_latest_version.return_value = None

        global_result = ResourceResult.success(MagicMock(), {'library': 'lab'})
        repository_mock.get_from_global.return_value = global_result

        service = ImageService(repository_mock, MagicMock(), MagicMock(), MagicMock(), MagicMock(), MagicMock())

        result = service.get(any_tenant, any_library, any_name, 'image', any_resolution, any_max_size)

        repository_mock.get_latest_version.assert_called_once_with(any_tenant, any_library, any_name)
        repository_mock.get.assert_not_called()
        repository_mock.get_from_global.assert_called_once_with(
            any_name, 'image', any_resolution, any_max_size, None
        )
        self.assertEqual(result, global_result)
        self.assertEqual(result.state, ResourceState.SUCCESS)
```

- [ ] **Step 2: Run tests to verify the new one fails (and existing ones are aligned)**

Run: `python -m unittest tests.api.image.test_image_service -v`
Expected: `test_get_serves_global_when_tenant_missing` FAILS — current `get` returns `ResourceResult.not_found()` and never calls `get_from_global` (so `assert_called_once_with` fails / result mismatch).

- [ ] **Step 3: Write minimal implementation**

In `services/resource/api/image/image_service.py`, change the final `return` of `get` (currently `return ResourceResult.not_found()` at line ~203):

```python
    def get(
            self, tenant: str, library: str, name: str, format: ImageRequestFormat,
            resolution: ResolutionType | None, max_size: int | None, fallback: Optional[str] = None,
            angle: Optional[int] = None
    ) -> ResourceResult:
        version = self.repository.get_latest_version(tenant, library, name)
        if version:
            image = self.repository.get(tenant, library, name, version, format, resolution, max_size, angle)
            if image.state != ResourceState.NOT_FOUND: return image
        if fallback:
            version = self.repository.get_latest_version(tenant, library, fallback)
            if version:
                return self.repository.get(tenant, library, fallback, version, format, resolution, max_size, angle)
        return self.repository.get_from_global(name, format, resolution, max_size, angle)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m unittest tests.api.image.test_image_service -v`
Expected: PASS (all tests in the module).

- [ ] **Step 5: Commit**

```bash
git add services/resource/api/image/image_service.py services/resource/tests/api/image/test_image_service.py
git commit -m "feat(resource): fall back to global image libraries in ImageService.get"
```

---

### Task 4: System test — serve a global image through the public API

**Files:**
- Modify: `services/resource/tests/api/image/test_system_image.py`

**Interfaces:**
- Consumes: the full wired app (`create_app`), real `Storage` via `Container.storage`, and the public route `GET /tenant/<tenant>/image-library/<library>/image/<name>`.
- Produces: an end-to-end test proving an image seeded under `image/hopara/<lib>/...` is served when requested under a tenant/library that doesn't contain it.

- [ ] **Step 1: Write the failing test**

Add to the `TestSystemImage` class in `services/resource/tests/api/image/test_system_image.py` (the file already imports `ImagePath`, `Provide`, `inject`, `Container`, `Storage`, `get_random_name`, `any_library`):

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.api.image.test_system_image.TestSystemImage.test_get_serves_global_image -v`
Expected: FAIL with `404 != 200` if run against code before Tasks 1-3 land. (When run after Tasks 1-3, it should pass — this task only adds coverage.)

- [ ] **Step 3: No new implementation**

Tasks 1-3 already implement the behavior. This task adds the end-to-end guard only. If the test fails after Tasks 1-3, debug using superpowers:systematic-debugging — do not weaken the assertion.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests.api.image.test_system_image.TestSystemImage.test_get_serves_global_image -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/resource/tests/api/image/test_system_image.py
git commit -m "test(resource): system test for serving global images"
```

---

### Task 5: Full verification (pre-commit gate)

**Files:** none (verification only).

- [ ] **Step 1: Run the full pre-commit suite**

Run: `./pre_commit.sh`
Expected: ruff, lint-imports, mypy, and the full test suite all PASS. (lint-imports confirms no new cross-package import was introduced — the repository hardcodes `'image/hopara/'`, so this should stay green.)

- [ ] **Step 2: If anything fails, fix inline and re-run**

Address any ruff/mypy/import-linter findings (e.g. type annotations), then re-run `./pre_commit.sh` until clean. Do not commit until green.

- [ ] **Step 3: Final commit (only if pre-commit changed files)**

```bash
git add -A
git commit -m "chore(resource): pre-commit fixes for global images support"
```

---

## Self-Review

**Spec coverage:**
- "ImagePath.get_base_dir global branch" → Task 1. ✓
- "ImageRepository.get_from_global scanning hopara/ by name, deterministic" → Task 2. ✓
- "ImageService.get global fallback as last resort, preserves format/resolution/max-size/angle" → Task 3 (signature forwards all params). ✓
- "Read-only by construction, no permission code, no consumer change, no cache change" → no task adds any; population is out-of-band (covered by Task 4 seeding storage directly). ✓
- "Quoting consistent with ResourcePath" → Task 1 uses `quote(name, "")`; asserted in Task 1 test. ✓
- "Testing: path, repository (incl. determinism), service precedence + global serve, system test" → Tasks 1-4. ✓
- "Out of scope: listing endpoints, public global writes" → no task adds them. ✓

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to Task N" — all code is shown inline. ✓

**Type consistency:** `get_from_global(name, format, resolution, max_size, angle)` is defined identically in Task 2 (definition), Task 2 tests, and Task 3 (call + assertion `get_from_global(any_name, 'image', any_resolution, any_max_size, None)`). `get_base_dir(tenant, library, name)` consistent across Tasks 1, 2, 4. ✓
