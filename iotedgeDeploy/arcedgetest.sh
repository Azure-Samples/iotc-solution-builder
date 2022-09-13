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
    renice -1 $pid

    echo "starting background work - PID: $BASHPID"

    echo "configuring edge"
}

echo "spawning subshell install"
apply_edge_config &

echo "waiting for background execution"
wait

echo "execution finished"
