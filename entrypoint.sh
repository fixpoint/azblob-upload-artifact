#!/bin/bash
AZ_CONTAINER=$1; shift
AZ_NAME=$1; shift
AZ_PATH=$1; shift

# Create a specified container
az storage container create -n "$AZ_CONTAINER"

# Upload a specified file
az storage blob upload -c "$AZ_CONTAINER" -n "$AZ_NAME/$AZ_PATH" -f "$AZ_PATH"
