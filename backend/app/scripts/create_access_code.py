from __future__ import annotations

import argparse
import secrets
import sys
from datetime import datetime

from app.services.entitlements import hash_redemption_code
from app.services.supabase import get_client

CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
CODE_GROUP_COUNT = 6
CODE_GROUP_LENGTH = 4
SUPPORTED_COURSES = ("course-2",)


def generate_code() -> str:
    groups = [
        "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_GROUP_LENGTH))
        for _ in range(CODE_GROUP_COUNT)
    ]
    return "TTA-" + "-".join(groups)


def parse_expiry(value: str) -> str:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Use an ISO-8601 timestamp") from exc
    if parsed.tzinfo is None:
        raise argparse.ArgumentTypeError("Expiry must include a timezone")
    return parsed.isoformat()


def create_code(
    *,
    course_id: str,
    order_id: str | None,
    expires_at: str | None,
) -> str:
    code = generate_code()
    payload = {
        "code_hash": hash_redemption_code(code),
        "course_id": course_id,
        "order_id": order_id,
        "expires_at": expires_at,
    }
    get_client().table("access_codes").insert(payload).execute()
    return code


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a transferable, single-use course access code."
    )
    parser.add_argument("--course-id", choices=SUPPORTED_COURSES, default="course-2")
    parser.add_argument("--order-id", help="Optional unique TTA Shop order identifier")
    parser.add_argument("--expires-at", type=parse_expiry, help="Optional ISO-8601 expiry")
    args = parser.parse_args()

    try:
        code = create_code(
            course_id=args.course_id,
            order_id=args.order_id,
            expires_at=args.expires_at,
        )
    except Exception as exc:
        print(f"Failed to create access code: {exc}", file=sys.stderr)
        return 1

    print("Access code created. This plaintext value will not be shown again:")
    print(code)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
