# azblob-upload-artifact

![Test](https://github.com/fixpoint/azblob-upload-artifact/workflows/Test/badge.svg)

This upload artifacts from your workflow to [Azure Blob Storage](https://azure.microsoft.com/ja-jp/services/storage/blobs/).
It follows usage of [actions/upload-artifact](https://github.com/actions/upload-artifact) for easy migration.

See also [azblob-download-artifact](https://github.com/fixpoint/azblob-download-artifact).

## Usage

Get [Azure Storage connection strings](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string) and specify it to `connection-string` through Github secrets like:

```yaml
steps:
  - uses: actions/checkout@v1

  - run: mkdir -p path/to/artifact

  - run: echo hello > path/to/artifact/world.txt

  - uses: fixpoint/azblob-upload-artifact@v3
    with:
      connection-string: ${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}
      name: my-artifact
      path: path/to/artifact
```

To upload artifacts only when the previous step of a job failed, use `if: failure()`:

```yaml
- uses: fixpoint/azblob-upload-artifact@v3
  if: failure()
  with:
    connection-string: ${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}
    name: my-artifact
    path: path/to/artifact
```

See [action.yml](./action.yml) for more detail.

## License

This scripts and documentation in this project are released under the [MIT License](./LICENSE).
