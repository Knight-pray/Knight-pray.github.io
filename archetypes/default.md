---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
title_en: ""          # optional English title -> shown as subtitle in 한·영 mode
date: {{ .Date }}
draft: true
description: ""       # list snippet + meta description (falls back to the post summary)
categories: []        # most specific category from data/taxonomy.yaml, e.g. ["Battery"]
tags: []              # cross-cutting labels, shown as #tag
# thumbnail: ""       # or put featured.jpg / cover.png next to index.md
# toc: false          # hide the table of contents
# comments: false     # hide giscus comments on this post
---
