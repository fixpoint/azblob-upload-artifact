#!/bin/bash
AZ_NAME=$1; shift
AZ_PATH=$1; shift

# Create a specified container
az storage container create -n "$AZ_NAME"

# Upload a specified file
az storage blob upload -c "$AZ_NAME" -n "$AZ_PATH" -f "$AZ_PATH"
