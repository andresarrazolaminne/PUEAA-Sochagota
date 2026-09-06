import os
import sys
import time
from pathlib import Path

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "192.168.2.150"
USER = "fow"
PASSWORD = os.environ["PUEAA_FOW_PASSWORD"]
REMOTE = "/home/fow/PUEAA-Sochagota"
ROOT = Path(r"E:\Proyectos\PUEAA-Sochagota")

FILES = [
    "src/lib/services/challenges/queries.ts",
    "src/lib/services/challenges/water-bill.ts",
    "src/app/tablero/retos/[challengeId]/water/actions.ts",
    "src/app/tablero/retos/[challengeId]/water/page.tsx",
    "src/app/admin/retos/water-bill-period-actions.ts",
    "src/app/admin/retos/[challengeId]/page.tsx",
    "src/lib/uploads/serve-private.ts",
    "src/app/api/water-bill-evidence/[filename]/route.ts",
    "src/app/api/waste-evidence/[filename]/route.ts",
    "src/app/api/place-documentation/[filename]/route.ts",
    "src/app/login/page.tsx",
    "src/app/login/AdminPinField.tsx",
    "src/app/tablero/page.tsx",
]


def main():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = c.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        # ensure remote dirs
        remote = f"{REMOTE}/{rel.replace(chr(92), '/')}"
        remote_dir = "/".join(remote.split("/")[:-1])
        try:
            sftp.stat(remote_dir)
        except OSError:
            # mkdir -p via ssh
            c.exec_command(f"mkdir -p {remote_dir}", timeout=20)[1].channel.recv_exit_status()
        print("put", rel)
        sftp.put(str(local), remote)
    sftp.close()

    _, stdout, _ = c.exec_command(
        f"cd {REMOTE} && docker compose up --build -d", timeout=1800, get_pty=True
    )
    while True:
        line = stdout.readline()
        if not line:
            break
        print(line.rstrip("\n\r").encode("ascii", "replace").decode("ascii"))
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise SystemExit(f"compose failed {code}")

    for i in range(24):
        time.sleep(5)
        _, out, _ = c.exec_command(
            "curl -sS -m 5 -L http://127.0.0.1:3102/api/health/", timeout=15
        )
        body = out.read().decode("utf-8", "replace")
        print("health", i + 1, body.strip()[:100])
        if "ok" in body.lower():
            print("OK")
            break
    else:
        raise SystemExit("health failed")
    c.close()


if __name__ == "__main__":
    main()
