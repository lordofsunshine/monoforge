import os
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ["DEPLOY_HOST"], port=22, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
cmds = [
    "docker top monoforge-mirror-worker",
    "cd /root/monoforge && docker-compose -f docker-compose.prod.yml logs --tail=50 mirror-worker 2>&1 | tail -20",
    "docker inspect monoforge-mirror-worker --format '{{.State.Status}} {{.State.Running}}'",
]
for cmd in cmds:
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    print('===', cmd)
    print(stdout.read().decode())
ssh.close()
