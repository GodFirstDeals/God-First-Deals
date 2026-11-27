#!/usr/bin/env python3

import getpass
import re
import subprocess
import sys
from urllib.parse import quote


HOST = "aws-0-eu-west-1.pooler.supabase.com"
PORT = 5432
DATABASE = "postgres"
USER = "postgres.ybflsliinifropaqpzqw"


def redact_output(text: str, connection_url: str, password: str) -> str:
    text = text.replace(connection_url, "[REDACTED CONNECTION URL]")
    text = text.replace(quote(password, safe=""), "[REDACTED PASSWORD]")
    text = text.replace(password, "[REDACTED PASSWORD]")
    return re.sub(r"postgres(?:ql)?://\S+", "[REDACTED CONNECTION URL]", text)


def main() -> int:
    password = getpass.getpass("Database password: ")
    encoded_password = quote(password, safe="")
    connection_url = (
        f"postgresql://{USER}:{encoded_password}@{HOST}:{PORT}/{DATABASE}"
    )

    try:
        result = subprocess.run(
            [
                "npx",
                "--no-install",
                "supabase",
                "migration",
                "list",
                f"--remote={connection_url}",
            ],
            capture_output=True,
            text=True,
            errors="replace",
            check=False,
        )
    except OSError:
        print("Could not start npx.", file=sys.stderr)
        return 1

    for output, stream in (
        (result.stdout, sys.stdout),
        (result.stderr, sys.stderr),
    ):
        if output:
            print(redact_output(output, connection_url, password), end="", file=stream)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
