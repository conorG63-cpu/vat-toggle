#!/bin/sh
set -eu

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 git rsync
systemctl enable --now docker
usermod -aG docker ubuntu

install -d -o ubuntu -g ubuntu -m 0755 /opt/priceswitch
