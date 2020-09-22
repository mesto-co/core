#!/bin/bash

# create a temporary folder, works on Linux and Mac OS
TMP=$(mktemp -d 2>/dev/null || mktemp -d -t 'tmp-core')
CORE=$(pwd)

if [ ! -f ${CORE}/lambda.js ]; then
    echo "Run this script from the core project root!"
    exit -1
fi

# first check that we prebuilt everything
npm run clean && npm run build

cd ${TMP}
# initialize a new empty npm project
npm init -y
# pack core and install locally
TGZ=$(npm pack ${CORE} | tail -1)
npm install ${TGZ}
# lamda does not require package.json and package-lock.json
rm ${TGZ}
rm package.json
rm package-lock.json
# move lambda.js from core to the root
mv ./node_modules/@mesto/core/lambda.js .
# bake an archive
zip -r ${CORE}/lambda.zip *
rm -rf $TMP

echo "lambda.zip is ready!"
