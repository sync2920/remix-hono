#!/bin/bash

rm -rf ./.amplify-hosting

mkdir -p ./.amplify-hosting/compute

cp -r ./build/server ./.amplify-hosting/compute/default

cp -r ./build/client ./.amplify-hosting/static

cp deploy-manifest.json ./.amplify-hosting/deploy-manifest.json

npm ci --omit=dev
rm -rf ./node_modules/@cloudflare
cp -r ./node_modules ./.amplify-hosting/compute/default/node_modules
