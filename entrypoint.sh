#!/bin/bash
AZ_CONTAINER=$1; shift
AZ_NAME=$1; shift
AZ_PATH=$1; shift

# Create a specified container
az storage container create -n "$AZ_CONTAINER"

if [[ -d "$AZ_PATH" ]]; then
  # Directory upload
  az storage blob upload-batch -d "$AZ_CONTAINER" -s "$AZ_PATH" --destination-path "$AZ_NAME"
else
  # File upload
  az storage blob upload -c "$AZ_CONTAINER" -n "$AZ_NAME/$(basename $AZ_PATH)" -f "$AZ_PATH"
fi
