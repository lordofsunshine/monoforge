import os
import sys

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "")
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_DIR = "/root/monoforge"
COMPOSE = "docker-compose -f docker-compose.prod.yml"


def run(ssh: paramiko.SSHClient, command: str, timeout: int = 7200) -> tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    return code, stdout.read().decode("utf-8", errors="replace"), stderr.read().decode("utf-8", errors="replace")


def main() -> int:
    if not PASSWORD:
        print("DEPLOY_PASSWORD required", file=sys.stderr)
        return 1

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=60)

    commands = [
        "node --version || true",
        f"cd {REMOTE_DIR} && npm ci",
        f"cd {REMOTE_DIR} && npx prisma generate",
        f"cd {REMOTE_DIR} && NODE_OPTIONS='--max-old-space-size=1024' npm run build",
        f"docker cp {REMOTE_DIR}/.next monoforge-app:/app/.next",
        f"docker cp {REMOTE_DIR}/server monoforge-app:/app/server",
        f"docker cp {REMOTE_DIR}/lib monoforge-app:/app/lib",
        f"docker cp {REMOTE_DIR}/components monoforge-app:/app/components",
        f"docker cp {REMOTE_DIR}/app monoforge-app:/app/app",
        f"docker cp {REMOTE_DIR}/generated monoforge-app:/app/generated",
        "docker restart monoforge-app",
        f"cd {REMOTE_DIR} && {COMPOSE} up -d mirror-worker",
        f"cd {REMOTE_DIR} && {COMPOSE} ps",
        "sleep 15",
        "curl -fsS http://127.0.0.1:3102/api/health",
        "curl -fsSI https://monoforge.org | head -n 12",
        "curl -fsS https://monoforge.org/admin -o /dev/null -w '%{http_code}\\n' || true",
        f"cd {REMOTE_DIR} && {COMPOSE} logs --tail=20 mirror-worker",
    ]

    for command in commands:
        print(f"\n>>> {command}")
        code, out, err = run(ssh, command)
        if out.strip():
            print(out[-15000:])
        if err.strip():
            print(err[-8000:])
        if code != 0:
            print(f"failed: {code}")
            ssh.close()
            return code

    ssh.close()
    print("\nHost build deploy completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
