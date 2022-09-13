#!/bin/bash

set -e

echo "starting script - PID: $BASHPID"

sid=$1
did=$2
sky=$3

echo "sid = $sid"
echo "did = $did"
echo "sky = $sky"

if [ -z "$sid" ] || [ -z "$did" ] || [ -z "$sky" ]; then
    echo "ERROR - required parameters are missing"
    exit 1
fi

install_edge() {
    pid=$(exec sh -c 'echo "$PPID"')
    # renice -1 $pid

    echo "starting background work - PID: $BASHPID"

    echo "setting up package registry"
    wget https://packages.microsoft.com/config/ubuntu/18.04/multiarch/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    rm packages-microsoft-prod.deb

    echo "installing moby-engine"
    sudo apt-get update
    sudo apt-get install -y moby-engine

    echo "writing docker daemon.json"
    sudo bash -c 'printf "{\n    \"log-driver\": \"json-file\",\n    \"log-opts\": {\n        \"max-size\": \"10m\",\n        \"max-file\": \"3\"\n    }\n}" > /etc/docker/daemon.json'

    echo "waiting for docker daemon to start"
    while [ $(ps -ef | grep -v grep | grep docker | wc -l) -le 0 ]; do
        echo "waiting for docker daemon to start"
        sleep 3
    done

    echo "installing aziot-edge"
    sudo apt-get update
    sudo apt-get install -y aziot-edge defender-iot-micro-agent-edge

    echo "configuring edge"
    sudo mkdir -p /etc/aziot
    sudo wget https://raw.githubusercontent.com/iot-for-all/iotc-solution-builder/main/iotedgeDeploy/config.toml -O /etc/aziot/config.toml
    sudo sed -i "s#\(id_scope = \).*#\1\"$sid\"#g;s#\(registration_id = \).*#\1\"$did\"#g;s#\(value = \).*#\1\"$sky\" }#g" /etc/aziot/config.toml

    echo "applying configuration"
    sudo iotedge config apply -c /etc/aziot/config.toml
}

echo "spawning subshell install"
install_edge &

echo "waiting for background execution"
wait

echo "execution finished"
