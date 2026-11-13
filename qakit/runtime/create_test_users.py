"""Create password accounts for the QA test users (run by seed_demo.py with the venv Python).

Why this step exists: Axentra's public HTTP API has no way to create a second account with a
password. Accounts come only from the first-run setup (one platform admin), an OIDC login, or
``POST /v1/users/external`` (an SSO-only user without a password, who cannot log in without an
identity provider). The kit has no identity provider, so this script uses Axentra's own Python API
(``ax.identity.create_user``, the same code path the setup flow uses: password policy check and
Argon2 hash) to create the accounts. It connects as the restricted runtime role from the config.
Everything else (roles, memberships, invitations, data) is done by seed_demo.py over HTTP.

Input (stdin, JSON): ``[{"email", "name", "password", "locale"}]``.
Output (stdout, JSON): ``{"<email>": "<user id>"}``. Existing accounts are found, not changed.

Usage: python create_test_users.py --config <axentra.toml>  < users.json
"""

from __future__ import annotations

import argparse
import json
import sys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    users = json.load(sys.stdin)

    from axentra.audit.logging import configure_logging
    from axentra.config.settings import load_settings
    from axentra.core.context import Principal
    from axentra.data.database import DbScope
    from axentra.platform import Axentra

    ax = Axentra.from_settings(load_settings(args.config))
    configure_logging("WARNING", "text")
    ax.start()
    out: dict[str, str] = {}
    try:
        for u in users:
            with ax.db.transaction(DbScope.platform()) as tx:
                row = ax.identity.find_user_by_email(tx, u["email"])
                if row:
                    out[u["email"]] = row["id"]
                    continue
                user_id = ax.identity.create_user(
                    tx, email=u["email"], name=u["name"], password=u["password"], locale=u.get("locale", "de")
                )
                # Leave a trace in the audit log like the other account events do.
                ax.audit.record(
                    tx,
                    Principal.system("qa-kit-seed"),
                    "identity.user.create",
                    target_type="user",
                    target_id=user_id,
                    details={"source": "qa-kit seed (test data)"},
                )
                out[u["email"]] = user_id
    finally:
        ax.close()
    json.dump(out, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
