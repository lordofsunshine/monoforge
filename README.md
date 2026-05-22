# MonoForge

A platform for public and private publication of open-source projects.

> [!NOTE]
> ***Not all files have been uploaded to GitHub*** due to some internal errors, so a ZIP archive with the full code has been uploaded to the repository. ( [download zip](https://github.com/lordofsunshine/monoforge/blob/main/monoforge-github-source.zip) )

A page is available on our website: https://monoforge.org/lordofsunshine/monoforge

## Security Updates

1. **Safer Markdown image handling**
   Removed unsafe regex parsing for `<img>` tags in Markdown. Image handling now uses AST transformation with safer attribute parsing.

2. **Temporary file cleanup**
   Fixed possible temporary file leaks in repository file updates and stream uploads. Temporary files are now cleaned up properly even when an error happens.

3. **Archive protection**
   Added limits for ZIP archive generation, including file size rules, file count rules, and a concurrency slot to prevent heavy archive requests from overloading the service.

4. **Zstd decompression protection**
   Added a byte limit during Zstd stream decompression based on the expected original size. This helps protect the service from oversized or malicious compressed files.

5. **Stronger file upload policy**
   Expanded blocked secret paths and filenames, including examples like `.aws/credentials`, `.bash_history`, `.env.backup`, `*.key.txt`, and paths containing `tokens`, `secrets`, or `private`.

6. **Removed unsafe HTML rendering**
   Removed `dangerouslySetInnerHTML` from the layout, repository page, preference script, and code viewer. Shiki code highlighting now renders through HAST to React instead of injecting raw HTML.