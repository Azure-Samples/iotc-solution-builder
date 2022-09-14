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

apply_edge_config() {
    pid=$(exec sh -c 'echo "$PPID"')
    # renice -1 $pid

    echo "starting background work - PID: $BASHPID"

    echo "configuring edge"
    sudo mkdir -p /etc/aziot
    sudo wget https://raw.githubusercontent.com/Azure-Samples/iotc-solution-builder/main/iotedgeDeploy/config.toml -O /etc/aziot/iotcsb_config.toml
    sudo sed -i "s#\(id_scope = \).*#\1\"$sid\"#g;s#\(registration_id = \).*#\1\"$did\"#g;s#\(value = \).*#\1\"$sky\" }#g" /etc/aziot/iotcsb_config.toml

    echo "applying configuration"
    sudo iotedge config apply -c /etc/aziot/iotcsb_config.toml
}

echo "spawning subshell install"
apply_edge_config &

echo "waiting for background execution"
wait

echo "execution finished"
