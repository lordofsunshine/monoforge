import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "")
PORT = 22
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_DIR = "/root/monoforge"
LOCAL_ROOT = Path(__file__).resolve().parents[1]
COMPOSE = "docker-compose -f docker-compose.prod.yml"

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "monoforge-github-source", "storage", ".cursor"}
EXCLUDE_FILES = {".env", "tsconfig.tsbuildinfo"}


def build_archive() -> Path:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz")
    tmp.close()
    archive_path = Path(tmp.name)
    with tarfile.open(archive_path, "w:gz") as tar:
        for dirpath, dirnames, filenames in os.walk(LOCAL_ROOT):
            dirnames[:] = [name for name in dirnames if name not in EXCLUDE_DIRS]
            current = Path(dirpath)
            for filename in filenames:
                if filename in EXCLUDE_FILES or filename.endswith(".zip"):
                    continue
                path = current / filename
                rel = path.relative_to(LOCAL_ROOT).as_posix()
                tar.add(path, arcname=rel)
    return archive_path


def run(ssh: paramiko.SSHClient, command: str, timeout: int = 7200) -> tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, stdout.read().decode("utf-8", errors="replace"), stderr.read().decode("utf-8", errors="replace")


def main() -> int:
    if not PASSWORD:
        print("DEPLOY_PASSWORD is required", file=sys.stderr)
        return 1

    archive_path = build_archive()
    remote_archive = "/tmp/monoforge-deploy.tar.gz"
    print(f"Built archive {archive_path} ({archive_path.stat().st_size // 1024} KB)")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    sftp = ssh.open_sftp()
    print("Uploading archive...")
    sftp.put(str(archive_path), remote_archive)
    sftp.close()
    archive_path.unlink(missing_ok=True)

    commands = [
        f"mkdir -p {REMOTE_DIR} && tar -xzf {remote_archive} -C {REMOTE_DIR}",
        f"rm -f {remote_archive}",
        f"cd {REMOTE_DIR} && grep -q '^GITHUB_API_USER_AGENT=' .env || echo 'GITHUB_API_USER_AGENT=\"MonoForge-Mirror\"' >> .env",
        f"cd {REMOTE_DIR} && grep -q '^MIRROR_INTERVAL_MS=' .env || echo 'MIRROR_INTERVAL_MS=\"60000\"' >> .env",
        f"cd {REMOTE_DIR} && grep -q '^MIRROR_BATCH_SIZE=' .env || echo 'MIRROR_BATCH_SIZE=\"20\"' >> .env",
        f"cd {REMOTE_DIR} && grep -q '^MIRROR_MAX_REPO_MB=' .env || echo 'MIRROR_MAX_REPO_MB=\"200\"' >> .env",
        f"cd {REMOTE_DIR} && grep -q '^MIRROR_MAX_FILE_MB=' .env || echo 'MIRROR_MAX_FILE_MB=\"10\"' >> .env",
        f"cd {REMOTE_DIR} && grep -q '^MIRROR_MIN_RATE_BUDGET=' .env || echo 'MIRROR_MIN_RATE_BUDGET=\"2\"' >> .env",
        f"cd {REMOTE_DIR} && {COMPOSE} --profile tools run --rm migrate",
        "sync; echo 3 > /proc/sys/vm/drop_caches || true",
        f"cd {REMOTE_DIR} && DOCKER_BUILDKIT=1 COMPOSE_HTTP_TIMEOUT=3600 {COMPOSE} build --progress=plain app",
        f"cd {REMOTE_DIR} && {COMPOSE} up -d app mirror-worker",
        f"cd {REMOTE_DIR} && {COMPOSE} ps",
        "curl -fsS http://127.0.0.1:3102/api/health",
        "curl -fsSI https://monoforge.org | head -n 12",
    ]

    for command in commands:
        print(f"\n>>> {command}")
        code, out, err = run(ssh, command)
        if out.strip():
            print(out[-12000:])
        if err.strip():
            print(err[-6000:])
        if code != 0:
            print(f"Command failed with exit code {code}")
            ssh.close()
            return code

    ssh.close()
    print("\nDeploy completed successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
