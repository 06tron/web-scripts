#!/bin/bash

function finish {
	kill $!
}

static_port=1688

cd ~/Repositories/06tron/ts/web-scripts
npx http-server ../../export/ -p $static_port --cors &
node blog/local-server.mjs $1 $static_port

trap finish EXIT
