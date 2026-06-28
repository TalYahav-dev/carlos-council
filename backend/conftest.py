"""Shared test setup.

Runs before any backend module is imported, so `config` picks up a dummy API
key and `database` binds to an isolated throwaway SQLite file. No test touches a
real key or the developer's local database.
"""

import os
import tempfile

# A dummy key so `config.validate()` passes and the OpenAI client can be
# constructed. Every test mocks the network, so this key is never used.
os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy")

# Isolated database for the whole test session.
_tmp_dir = tempfile.mkdtemp(prefix="carlos-council-tests-")
os.environ["DB_PATH"] = os.path.join(_tmp_dir, "test_council.db")
