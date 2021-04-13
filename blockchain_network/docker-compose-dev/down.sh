#!/bin/bash

docker rm $(docker ps -a -q)

cd './sawtooth'
    docker-compose -f ./docker-compose.yaml -v down
    docker volume prune -f
cd -