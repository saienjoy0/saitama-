import os
import psycopg
# CI/local development only. No product schema or family data.
with psycopg.connect(os.environ["YATTEMI_DEV_DATABASE_URL"]) as conn:
    with conn.cursor() as cursor:
        cursor.execute("select version(), 1")
        version, value = cursor.fetchone()
        assert "PostgreSQL 16." in version and value == 1
print("PASS: local PostgreSQL 16 connection; no product schema created")
