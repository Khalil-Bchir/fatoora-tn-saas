---
source: "https://github.com/huggingface/skills/tree/main/skills/huggingface-datasets"
name: hugging-face-dataset-viewer
description: Query Hugging Face datasets through the Dataset Viewer API for splits, rows, search, filters, and parquet links.
risk: unknown
---

# Hugging Face Dataset Viewer

## When to Use
Use this skill when you need read-only exploration of a Hugging Face dataset through the Dataset Viewer API.

Use this skill to execute read-only Dataset Viewer API calls for dataset exploration and extraction.

## Core workflow

1. Optionally validate dataset availability with `/is-valid`.
2. Resolve `config` + `split` with `/splits`.
3. Preview with `/first-rows`.
4. Paginate content with `/rows` using `offset` and `length` (max 100).
5. Use `/search` for text matching and `/filter` for row predicates.
6. Retrieve parquet links via `/parquet` and totals/metadata via `/size` and `/statistics`.

## Defaults

- Base URL: `https://datasets-server.huggingface.co`
- Default API method: `GET`
- Query params should be URL-encoded.
- `offset` is 0-based.
- `length` max is usually `100` for row-like endpoints.
- Gated/private datasets require `Authorization: Bearer `.

## Dataset Viewer

- `Validate dataset`: `/is-valid?dataset=`
- `List subsets and splits`: `/splits?dataset=`
- `Preview first rows`: `/first-rows?dataset=&config=&split=`
- `Paginate rows`: `/rows?dataset=&config=&split=&offset=&length=`
- `Search text`: `/search?dataset=&config=&split=&query=&offset=&length=`
- `Filter with predicates`: `/filter?dataset=&config=&split=&where=&orderby=&offset=&length=`
- `List parquet shards`: `/parquet?dataset=`
- `Get size totals`: `/size?dataset=`
- `Get column statistics`: `/statistics?dataset=&confi
