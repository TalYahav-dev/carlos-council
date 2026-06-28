from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import create_profile_source, init_db, upsert_profile
from dossier import parse_business_dossier_markdown


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import a business dossier markdown document into the council profile store."
    )
    parser.add_argument("path", nargs="?", help="Path to the dossier markdown file")
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read the dossier markdown from stdin instead of a file path",
    )
    parser.add_argument(
        "--source-name",
        default="business-dossier.md",
        help="Friendly source name to store alongside the imported profile",
    )
    parser.add_argument(
        "--source-type",
        default="chatgpt_memory_extract",
        help="Source type label for the stored import metadata",
    )
    parser.add_argument(
        "--skip-source-record",
        action="store_true",
        help="Import the profile without writing a profile_sources record",
    )
    args = parser.parse_args()

    if args.stdin == bool(args.path):
        parser.error("Provide either a file path or --stdin")

    return args


async def _run() -> int:
    args = _parse_args()
    if args.stdin:
        text = sys.stdin.read()
    else:
        text = Path(args.path).read_text(encoding="utf-8")

    parsed = parse_business_dossier_markdown(text)

    await init_db()
    record = await upsert_profile(parsed.profile)

    if not args.skip_source_record:
        await create_profile_source(
            source_type=args.source_type,
            source_name=args.source_name,
            payload={
                "executive_summary": parsed.executive_summary,
                "missing_questions": parsed.missing_questions,
                "imported_profile": parsed.profile,
            },
        )

    company_name = parsed.profile.get("company", {}).get("name", "Unknown company")
    print(f"Imported dossier for {company_name}")
    print(f"Updated at: {record['updated_at']}")
    print(f"Missing questions captured: {len(parsed.missing_questions)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_run()))
