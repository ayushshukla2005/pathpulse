import re
from pathlib import Path
from typing import get_args
from app.schemas import CategoryLiteral

def test_categories_match_prisma_schema_exactly():
    schema_path = Path(__file__).resolve().parent.parent.parent / "api" / "prisma" / "schema.prisma"
    assert schema_path.exists(), f"Prisma schema not found at {schema_path}"

    content = schema_path.read_text(encoding="utf-8")
    match = re.search(r"enum\s+ReportCategory\s*\{([^}]+)\}", content)
    assert match is not None, "ReportCategory enum not found in schema.prisma"

    prisma_categories = set(re.findall(r"\b[A-Z_]+\b", match.group(1)))
    ai_categories = set(get_args(CategoryLiteral))

    assert ai_categories == prisma_categories
    assert ai_categories == {"BROKEN_LIFT", "BLOCKED_RAMP", "INACCESSIBLE_ENTRANCE", "OTHER"}

def test_categories_match_shared_types_exactly():
    types_path = Path(__file__).resolve().parent.parent.parent.parent / "packages" / "shared-types" / "src" / "index.ts"
    assert types_path.exists(), f"shared-types index not found at {types_path}"

    content = types_path.read_text(encoding="utf-8")
    match = re.search(r'export\s+type\s+ReportCategory\s*=\s*([^;]+);', content)
    assert match is not None, "ReportCategory type not found in shared-types"

    shared_categories = set(re.findall(r'"([A-Z_]+)"', match.group(1)))
    ai_categories = set(get_args(CategoryLiteral))

    assert ai_categories == shared_categories

