import sys
from importlib import import_module
assert sys.version_info[:2] == (3, 12), "Python 3.12 required"
for name in ("fastapi", "sqlalchemy", "alembic", "psycopg", "httpx", "pytest"):
    import_module(name)
print("PASS: Python 3.12 and development dependencies import")
