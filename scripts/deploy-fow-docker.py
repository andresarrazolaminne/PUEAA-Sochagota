"""Deploy PUEAA to FOW Docker host (192.168.2.150) on port 3102."""
from __future__ import annotations

import os
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = os.environ.get("PUEAA_FOW_HOST", "192.168.2.150")
USER = os.environ.get("PUEAA_FOW_USER", "fow")
PASSWORD = os.environ.get("PUEAA_FOW_PASSWORD", "")
REMOTE_DIR = os.environ.get("PUEAA_FOW_REMOTE", "/home/fow/PUEAA-Sochagota")
LOCAL_ROOT = Path(os.environ.get("PUEAA_LOCAL_ROOT", r"E:\Proyectos\PUEAA-Sochagota"))
BACKUP_PROD = Path(
    os.environ.get(
        "PUEAA_BACKUP_PROD",
        r"E:\Proyectos\_backups\PUEAA-Sochagota\2026-09-06_095419-lightsail-Nginx-1\prod",
    )
)
STAGING = LOCAL_ROOT / ".deploy-staging"

EXCLUDE_DIR_NAMES = {
    "node_modules",
    ".next",
    ".git",
    ".deploy-staging",
    "agent-transcripts",
}
EXCLUDE_FILE_SUFFIXES = {".db", ".db-journal"}
EXCLUDE_FILE_NAMES = {".env", ".env.local"}


def should_exclude(path: Path, root: Path) -> bool:
    rel = path.relative_to(root)
    parts = set(rel.parts)
    if parts & EXCLUDE_DIR_NAMES:
        return True
    if path.is_file():
        if path.name in EXCLUDE_FILE_NAMES:
            return True
        if path.suffix in EXCLUDE_FILE_SUFFIXES and "data" in rel.parts:
            return True
        # skip local uploads under data/
        if "data" in rel.parts and "uploads" in rel.parts:
            return True
        # skip temp deploy scripts
        if path.name.startswith("_tmp_fow"):
            return True
    return False


def make_code_tarball(dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()
    with tarfile.open(dest, "w:gz") as tar:
        for dirpath, dirnames, filenames in os.walk(LOCAL_ROOT):
            p = Path(dirpath)
            # prune
            dirnames[:] = [
                d
                for d in dirnames
                if d not in EXCLUDE_DIR_NAMES
                and not should_exclude(p / d, LOCAL_ROOT)
            ]
            for name in filenames:
                fp = p / name
                if should_exclude(fp, LOCAL_ROOT):
                    continue
                arcname = fp.relative_to(LOCAL_ROOT).as_posix()
                tar.add(fp, arcname=arcname)
    return dest


def make_data_tarball(dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()
    with tarfile.open(dest, "w:gz") as tar:
        app_db = BACKUP_PROD / "app.db"
        if not app_db.is_file():
            raise FileNotFoundError(app_db)
        tar.add(app_db, arcname="app.db")
        uploads = BACKUP_PROD / "uploads"
        if uploads.is_dir():
            tar.add(uploads, arcname="uploads")
    return dest


def ssh_connect() -> paramiko.SSHClient:
    if not PASSWORD:
        raise RuntimeError("Set PUEAA_FOW_PASSWORD in the environment before deploying.")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    return c


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 120) -> str:
    print(f"\n$ {cmd}")
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out)
    if err.strip():
        print("STDERR:", err)
    if code != 0:
        raise RuntimeError(f"Remote command failed ({code}): {cmd}")
    return out


def sftp_put(c: paramiko.SSHClient, local: Path, remote: str) -> None:
    print(f"Uploading {local} -> {remote} ({local.stat().st_size} bytes)")
    sftp = c.open_sftp()
    try:
        sftp.put(str(local), remote)
    finally:
        sftp.close()


def main() -> int:
    print("==> Packing code")
    code_tar = make_code_tarball(STAGING / "pueaa-code.tar.gz")
    print(f"Code tarball: {code_tar.stat().st_size} bytes")

    print("==> Packing data backup")
    data_tar = make_data_tarball(STAGING / "pueaa-data.tar.gz")
    print(f"Data tarball: {data_tar.stat().st_size} bytes")

    c = ssh_connect()
    try:
        run(c, f"mkdir -p {REMOTE_DIR} {REMOTE_DIR}/data")
        sftp_put(c, code_tar, f"{REMOTE_DIR}/pueaa-code.tar.gz")
        sftp_put(c, data_tar, f"{REMOTE_DIR}/pueaa-data.tar.gz")

        run(
            c,
            f"""
set -e
cd {REMOTE_DIR}
# extract code over existing tree (keep data/)
tar -xzf pueaa-code.tar.gz
# restore SQLite + uploads
tar -xzf pueaa-data.tar.gz -C data
# production env
cat > .env <<'EOF'
DATABASE_URL=file:/app/data/app.db
UPLOAD_DIR=/app/data/uploads
NEXT_PUBLIC_BASE_PATH=
NODE_ENV=production
EOF
ls -lah
ls -lah data
du -sh data uploads 2>/dev/null || du -sh data
rm -f pueaa-code.tar.gz pueaa-data.tar.gz
""".strip(),
            timeout=180,
        )

        print("==> docker compose build/up (may take several minutes)")
        run(
            c,
            f"cd {REMOTE_DIR} && docker compose up --build -d",
            timeout=1800,
        )

        print("==> Wait for health")
        for i in range(36):
            time.sleep(5)
            _, stdout, _ = c.exec_command(
                "curl -sS -m 5 -L http://127.0.0.1:3102/api/health/ || true",
                timeout=15,
            )
            body = stdout.read().decode(errors="replace").strip()
            print(f"  attempt {i+1}: {body[:200]}")
            if '"ok"' in body or '"ok":true' in body.replace(" ", "").lower() or body == '{"ok":true}' or '"ok": true' in body:
                print("LAN health OK")
                break
        else:
            run(c, f"cd {REMOTE_DIR} && docker compose logs --tail=80 web", timeout=60)
            raise RuntimeError("Health check failed on :3102")

        run(c, f"cd {REMOTE_DIR} && docker compose ps")
    finally:
        c.close()

    print("Deploy compose phase done.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("DEPLOY FAILED:", exc, file=sys.stderr)
        raise SystemExit(1)
