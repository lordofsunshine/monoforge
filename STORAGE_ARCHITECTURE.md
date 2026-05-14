# MonoForge Storage Architecture

MonoForge stores file bytes on disk and only metadata in PostgreSQL.

## Layout

```txt
storage/
  blobs/
    aa/
      bb/
        <sha256>.zst
        <sha256>.raw
        <sha256>.preview.webp
        <sha256>.thumb.webp
  tmp/
```

## Flow

1. Upload stream is parsed by Busboy.
2. File stream is written to `storage/tmp`.
3. SHA-256 is calculated from the temporary file.
4. If `FileBlob.checksum` already exists, the temporary file is deleted and the existing blob is reused.
5. Text-like files are compressed to zstd when the `zstd` CLI is available.
6. Already compressed/media formats are stored as raw bytes.
7. JPEG, PNG and WebP files get WebP preview and thumbnail variants through sharp.
8. Repository file metadata points to the deduplicated `FileBlob`.
9. Downloads stream raw bytes or zstd decompression output.
10. Cleanup removes blobs that have no file references and `refCount <= 0`.

## Compression Policy

Compressed with zstd:

- markdown
- json
- js, jsx
- ts, tsx
- css, scss
- html
- txt
- yaml, yml
- xml
- csv
- toml
- sql
- prisma
- other `text/*` MIME files

Stored as-is:

- zip
- gz
- 7z
- rar
- jpg, jpeg
- png
- webp
- avif
- gif
- mp4, mov
- mp3, wav
- pdf

## Limits

Configured through env:

```txt
MAX_UPLOAD_SIZE_MB=10
MAX_REPO_SIZE_MB=200
MAX_USER_STORAGE_MB=100
MAX_CONCURRENT_UPLOADS=2
ZSTD_LEVEL=3
IMAGE_MAX_WIDTH=1600
IMAGE_QUALITY=82
```

## Cleanup

```bash
npm run storage:cleanup
```
