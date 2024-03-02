#!/bin/bash

rm -rf ./.amplify-hosting

mkdir -p ./.amplify-hosting/compute

cp -r ./build/server ./.amplify-hosting/compute/default

cp -r ./build/client ./.amplify-hosting/static

cp deploy-manifest.json ./.amplify-hosting/deploy-manifest.json

npm ci --omit=dev
cp -r ./node_modules ./.amplify-hosting/compute/default/node_modules

cp .env ./.amplify-hosting/compute/default/.env