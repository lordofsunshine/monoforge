import os
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ["DEPLOY_HOST"], port=22, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
sftp = ssh.open_sftp()
sftp.put("docker-compose.prod.yml", "/root/monoforge/docker-compose.prod.yml")
sftp.close()
stdin, stdout, stderr = ssh.exec_command(
    "cd /root/monoforge && docker-compose -f docker-compose.prod.yml up -d --force-recreate mirror-worker",
    timeout=120,
)
print(stdout.read().decode())
print(stderr.read().decode())
print("exit", stdout.channel.recv_exit_status())
ssh.close()
