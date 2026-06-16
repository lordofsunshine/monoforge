import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "")
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
LOCAL_ROOT = Path(__file__).resolve().parents[1]
DEPLOY_DIR = LOCAL_ROOT / "deploy" / "nginx"
REMOTE_RATE_LIMIT = "/etc/nginx/conf.d/monoforge-rate-limit.conf"
REMOTE_SITE = "/etc/nginx/sites-available/monoforge.org"
REMOTE_STREAM = "/etc/nginx/stream.d/reality-443.conf"
REMOTE_BALLADA = "/etc/nginx/sites-available/ballada.life"
REMOTE_XRAY = "/usr/local/etc/xray/config.json"


def run(ssh: paramiko.SSHClient, command: str, timeout: int = 120) -> tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    return code, stdout.read().decode("utf-8", errors="replace"), stderr.read().decode("utf-8", errors="replace")


def write_remote(sftp: paramiko.SFTPClient, path: str, content: str) -> None:
    with sftp.file(path, "w") as handle:
        handle.write(content)


def patch_ballada(content: str) -> str:
    content = content.replace(
        "listen 127.0.0.1:9443 ssl http2;",
        "listen 127.0.0.1:9443 ssl http2 proxy_protocol;",
    )
    marker = "server_name ballada.life www.ballada.life;\n    client_max_body_size 520m;\n\n    ssl_certificate"
    replacement = (
        "server_name ballada.life www.ballada.life;\n"
        "    client_max_body_size 520m;\n\n"
        "    set_real_ip_from 127.0.0.1;\n"
        "    set_real_ip_from ::1;\n"
        "    real_ip_header proxy_protocol;\n\n"
        "    ssl_certificate"
    )
    if "real_ip_header proxy_protocol" not in content:
        content = content.replace(marker, replacement)
    return content


def patch_xray(content: str) -> str:
    config = json.loads(content)
    for inbound in config.get("inbounds", []):
        if inbound.get("port") == 8443:
            reality = inbound.setdefault("streamSettings", {}).setdefault("realitySettings", {})
            reality["xver"] = 1
    return json.dumps(config, indent=2) + "\n"


def main() -> int:
    if not PASSWORD:
        print("DEPLOY_PASSWORD required", file=sys.stderr)
        return 1

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=60)
    sftp = ssh.open_sftp()

    _, ballada_current, _ = run(ssh, f"cat {REMOTE_BALLADA}")
    _, xray_current, _ = run(ssh, f"cat {REMOTE_XRAY}")
    ballada_next = patch_ballada(ballada_current)
    xray_next = patch_xray(xray_current)

    backups = [
        f"cp {REMOTE_SITE} {REMOTE_SITE}.bak-nginx-{stamp}",
        f"cp {REMOTE_STREAM} {REMOTE_STREAM}.bak-nginx-{stamp}",
        f"cp {REMOTE_BALLADA} {REMOTE_BALLADA}.bak-nginx-{stamp}",
        f"cp {REMOTE_XRAY} {REMOTE_XRAY}.bak-nginx-{stamp}",
    ]
    for command in backups:
        code, out, err = run(ssh, command)
        if code != 0:
            print(err or out, file=sys.stderr)
            ssh.close()
            return code

    write_remote(sftp, REMOTE_RATE_LIMIT, (DEPLOY_DIR / "monoforge-rate-limit.conf").read_text(encoding="utf-8"))
    write_remote(sftp, REMOTE_SITE, (DEPLOY_DIR / "monoforge.org.conf").read_text(encoding="utf-8"))
    write_remote(sftp, REMOTE_STREAM, (DEPLOY_DIR / "reality-443.conf").read_text(encoding="utf-8"))
    write_remote(sftp, REMOTE_BALLADA, ballada_next)
    write_remote(sftp, REMOTE_XRAY, xray_next)
    sftp.close()

    commands = [
        "nginx -t",
        "systemctl restart xray",
        "sleep 2",
        "systemctl is-active xray",
        "systemctl reload nginx",
        "sleep 2",
        "curl -fsS https://monoforge.org/api/health",
        "curl -fsSI https://monoforge.org/ | head -n 5",
        "curl -fsSI https://ballada.life/ | head -n 3 || true",
    ]
    for command in commands:
        print(f"\n>>> {command}")
        code, out, err = run(ssh, command)
        if out.strip():
            print(out.strip()[-4000:])
        if err.strip():
            print(err.strip()[-2000:])
        if code != 0:
            print(f"failed: {code}", file=sys.stderr)
            ssh.close()
            return code

    ssh.close()
    print("\nnginx rate limits deployed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
