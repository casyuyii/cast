# Blog

Run `bun run blog:dev` from the repository root for the local preview, or
`bun run blog:build` for the static build.

Notes live in `src/pages/blog/`. Frontmatter accepts `title`, `pubDate`, and
`topics`. Leave `pubDate` out when the original publication date is unknown;
these notes appear under **Undated archive** rather than an invented date.

The early Notion archive was imported from its Markdown & CSV export. The
original page text, code, links, and exported attachments are retained. The
archive index is available at `/b/archive-index`. Its August 28, 2025 date is
the date written on the index itself, not the publication date of its children.
Only dates explicitly present in child page titles are used for those pages.

- `archived: true` shows the archive notice and optional `sourceUrl` link.
- `unlisted: true` keeps small supporting pages accessible through parent links
  without counting them as separate posts in the archive and topic filters.
- `notion-import.json` maps exported pages and attachments to their local paths.
- Exported images and CSVs live in `public/archive-assets/`. Existing external
  image and bookmark URLs remain external; the export did not include those files.

To repeat the import with the same ZIP:

```sh
python3 packages/blog/scripts/import-notion-archive.py /path/to/export.zip
```

The importer refuses to overwrite files whose contents have since changed.
The Notion originals are not modified, and importing does not publish the site.
