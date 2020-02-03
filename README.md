# azblob-upload-artifact

This upload artifacts from your workflow to [Azure Blob Storage](https://azure.microsoft.com/ja-jp/services/storage/blobs/).

See also [azblob-download-artifact](https://github.com/fixpoint/azblob-download-artifact).

**UNDER DEVELOPMENT**

## Usage

Get [Azure Storage connection strings](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string) and save it into secrets.

See [action.yml](./action.yml)

Basic:

```
steps:
- uses: actions/checkout@v1

- run: mkdir -p path/to/artifact

- run: echo hello > path/to/artifact/world.txt

- uses: fixpoint/azblob-upload-artifact@master
  with:
    connection-string: ${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}
    name: my-artifact
    path: path/to/artifact
```

## License

This scripts and documentation in this project are released under the [MIT License](./LICENSE).
