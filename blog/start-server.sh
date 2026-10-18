#!/bin/bash

function finish {
	kill $!
}

static_port=1688

cd ~/Repositories/web-scripts
npx http-server ../home.6t.lt/homepage/ -p $static_port --cors &
node blog/local-server.mjs $1 $static_port

trap finish EXIT
