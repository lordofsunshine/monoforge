import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "")
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_DIR = "/root/monoforge"
COMPOSE = "docker-compose -f docker-compose.prod.yml"
LOCAL_ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIRS = [".next", "server", "lib", "components", "app", "generated"]
ARTIFACT_FILES = ["docker-compose.prod.yml"]


def build_archive() -> Path:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz")
    tmp.close()
    archive_path = Path(tmp.name)
    with tarfile.open(archive_path, "w:gz") as tar:
        for name in ARTIFACT_DIRS:
            path = LOCAL_ROOT / name
            if path.exists():
                tar.add(path, arcname=name)
        for name in ARTIFACT_FILES:
            path = LOCAL_ROOT / name
            if path.exists():
                tar.add(path, arcname=name)
    return archive_path


def run(ssh: paramiko.SSHClient, command: str, timeout: int = 1800) -> tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    return code, stdout.read().decode("utf-8", errors="replace"), stderr.read().decode("utf-8", errors="replace")


def main() -> int:
    if not PASSWORD:
        print("DEPLOY_PASSWORD required", file=sys.stderr)
        return 1

    archive_path = build_archive()
    remote_archive = "/tmp/monoforge-build.tar.gz"
    print(f"artifact {archive_path.stat().st_size // 1024} KB")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=60)
    sftp = ssh.open_sftp()
    print("uploading build artifact")
    sftp.put(str(archive_path), remote_archive)
    sftp.close()
    archive_path.unlink(missing_ok=True)

    commands = [
        f"mkdir -p {REMOTE_DIR} && tar -xzf {remote_archive} -C {REMOTE_DIR}",
        f"rm -f {remote_archive}",
        f"cd {REMOTE_DIR} && {COMPOSE} up -d app mirror-worker",
        f"cd {REMOTE_DIR} && {COMPOSE} restart app mirror-worker",
        "sleep 25",
        f"cd {REMOTE_DIR} && {COMPOSE} ps",
        "curl -fsS http://127.0.0.1:3102/api/health",
        "curl -fsSI https://monoforge.org | head -n 12",
        f"cd {REMOTE_DIR} && {COMPOSE} logs --tail=15 mirror-worker",
    ]

    for command in commands:
        print(f"\n>>> {command}")
        code, out, err = run(ssh, command)
        if out.strip():
            print(out[-12000:])
        if err.strip():
            print(err[-6000:])
        if code != 0:
            print(f"failed: {code}")
            ssh.close()
            return code

    ssh.close()
    print("\nartifact deploy completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
