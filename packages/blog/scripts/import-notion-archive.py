"""Import a Notion Markdown & CSV ZIP without guessing missing publication dates."""

import argparse
import csv
import hashlib
import io
import json
import posixpath
import re
import zipfile
from datetime import datetime
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export", type=Path)
    args = parser.parse_args()
    blog = Path(__file__).resolve().parents[1]
    content = blog / "src/pages/blog"
    public = blog / "public"
    with zipfile.ZipFile(args.export) as archive:
        files = {info.filename: archive.read(info) for info in archive.infolist() if not info.is_dir()}

    pages = {}
    for name, raw in files.items():
        if not name.endswith(".md"):
            continue
        text = raw.decode("utf-8-sig")
        title, body = text.split("\n", 1)
        title = title.removeprefix("# ").strip()
        source_id = re.search(r"([0-9a-f]{32})\.md$", name).group(1)
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "note"
        slug = "archive-index" if "/" not in name else f"archive-{slug[:80]}-{source_id[:8]}"
        date_match = re.search(r"([A-Z][a-z]+ \d{1,2}, \d{4})", title)
        date = datetime.strptime(date_match[1], "%B %d, %Y").date().isoformat() if date_match else None
        if "/" not in name:
            date = "2025-08-28"  # Explicit date on the archive index, not its child notes.
        depth = len(PurePosixPath(name).parts)
        topics = ["Archive"]
        technical = {
            "How glibc manage stack", "Memory Synchronization", "Event Poll", "task_struct",
            "mutex", "memory barriers", "fork", ".c to .S to .h", "kmalloc", "epoll",
            "Docker netword", "Start process from init", "fork and vfork", "memory order",
            "NUMA", "Seqcount lock", "RSA", "0x5f3759df", "Regex lookaround", "ranking algorithm",
            "1787. Make the XOR of All Segments Equal to Zero", "Hash code in TCG", "我喜欢 c++",
        }
        topics += ["Programming"] if title in technical or "Regex lookaround/" in name else ["Thoughts"]
        if title.startswith("note1 @May") or "@September 8, 2021" in name:
            topics = ["Archive", "AI"]
        pages[name] = dict(title=title, body=body.lstrip("\n"), slug=slug, source_id=source_id,
                           date=date, topics=topics, unlisted=depth > 2)

    assets = {}
    for name, raw in files.items():
        if name in pages:
            continue
        suffix = PurePosixPath(name).suffix.lower()
        digest = hashlib.sha256(raw).hexdigest()[:16]
        assets[name] = f"/archive-assets/{digest}{suffix}"

    missing = []
    local_count = 0

    def convert_links(text, name):
        nonlocal local_count
        def replace(match):
            nonlocal local_count
            image, label, url = match.groups()
            if urlsplit(url).scheme or url.startswith(("#", "/b/")):
                # Some Notion bookmarks export with an empty label and would otherwise disappear.
                return f"[{url}]({url})" if not image and not label else match[0]
            target = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote(url.split("#", 1)[0])))
            fragment = "#" + url.split("#", 1)[1] if "#" in url else ""
            if target in pages:
                local_count += 1
                return f"[{label}](/b/{pages[target]['slug']}{fragment})"
            if target in assets:
                local_count += 1
                return f"{image}[{label}]({assets[target]}{fragment})"
            missing.append(dict(page=name, target=url))
            return match[0]
        return re.sub(r"(!?)\[([^\]\n]*)\]\(([^\n]*?)\)", replace, text)

    outputs = {}
    for name, page in pages.items():
        body = page["body"]
        # A Notion database exports to CSV. Render its data as a table as well as retaining the CSV.
        for csv_name, raw in files.items():
            if not csv_name.endswith(".csv") or csv_name.endswith("_all.csv"):
                continue
            relative = posixpath.relpath(csv_name, posixpath.dirname(name) or ".")
            link_pattern = re.compile(r"\[([^\]]*)\]\(([^\n]*?)\)")
            def inline_table(match):
                if unquote(match[2]) != relative:
                    return match[0]
                rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
                def cell(value):
                    return value.replace("|", "\\|").replace("<", "&lt;").replace(">", "&gt;")
                lines = [match[0], "", "| Symbol | Name | Description |", "| --- | --- | --- |"]
                for row in rows:
                    lines.append("| " + " | ".join(cell(row[key]) for key in ("symbol", "name", "desc")) + " |")
                children = [(path, data) for path, data in pages.items() if posixpath.dirname(path) == posixpath.join(posixpath.dirname(csv_name), "Look around")]
                if children:
                    lines += ["", "Reference entries:", ""]
                    lines += [f"- [{data['title']}](/b/{data['slug']})" for _, data in children]
                return "\n".join(lines)
            body = link_pattern.sub(inline_table, body)
        body = convert_links(body, name)
        # Keep the page title in frontmatter and preserve its section hierarchy below it.
        fenced = False
        has_h1 = False
        for line in body.splitlines():
            if line.lstrip().startswith("```"):
                fenced = not fenced
            if not fenced and line.startswith("# "):
                has_h1 = True
        if has_h1:
            lines = []
            fenced = False
            for line in body.splitlines(keepends=True):
                if line.lstrip().startswith("```"):
                    fenced = not fenced
                if not fenced and re.match(r"#{1,5} ", line):
                    line = "#" + line
                lines.append(line)
            body = "".join(lines)
        meta = {"title": page["title"]}
        if page["date"]:
            meta["pubDate"] = page["date"]
        meta.update(topics=page["topics"], archived=True, sourceUrl=f"https://www.notion.so/{page['source_id']}")
        if page["unlisted"]:
            meta["unlisted"] = True
        front = "\n".join(f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in meta.items())
        outputs[content / f"{page['slug']}.md"] = f"---\n{front}\n---\n\n{body.rstrip()}\n".encode()
    if missing:
        raise ValueError(f"Unresolved links: {missing}")
    for name, url in assets.items():
        outputs[public / url.lstrip("/")] = files[name]
    # Refuse to overwrite hand-edited imports when rerunning the command.
    for path, raw in outputs.items():
        if path.exists() and path.read_bytes() != raw:
            raise FileExistsError(f"Refusing to overwrite different content: {path}")
    for path, raw in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
    report = {
        "sourceArchive": args.export.name,
        "sourceSha256": hashlib.sha256(args.export.read_bytes()).hexdigest(),
        "pages": [{"title": p["title"], "path": f"src/pages/blog/{p['slug']}.md", "sourceId": p["source_id"], "pubDate": p["date"], "unlisted": p["unlisted"]} for p in pages.values()],
        "assets": assets,
        "rewrittenLocalLinks": local_count,
        "datePolicy": "Only explicit dates in page titles are used; the archive index retains its own August 28, 2025 date. Other dates remain unknown.",
    }
    (blog / "notion-import.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Imported {len(pages)} pages ({sum(not p['unlisted'] for p in pages.values())} listed), {len(assets)} assets; repaired {local_count} local links.")


if __name__ == "__main__":
    main()
