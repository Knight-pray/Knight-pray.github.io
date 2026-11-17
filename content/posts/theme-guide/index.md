---
title: "글쓰기 가이드"
title_en: "Writing guide"
date: 2026-11-17
draft: true            # reference only: never published (preview with `hugo server -D`)
description: "이중언어 블록, 코드, 수식, 표를 쓰는 방법"
categories: ["Simulation"]
tags: ["guide"]
---

이 글은 `draft: true`라서 배포되지 않습니다. `hugo server -D`로 미리 보면서 문법을 확인하는 용도입니다.
언어 표시가 없는 이 문단은 모든 모드에서 보입니다.

## 이중언어 블록 {.ko}

## Bilingual blocks {.en}

{{< ko >}}
블록 단위로 쓸 때는 `ko` / `en` 단축코드를 씁니다. 안에서는 **마크다운**이 그대로 동작합니다.

- 목록도 됩니다
- 헤더의 언어 버튼은 사이트 전체, 글 상단 버튼은 이 글에만 적용됩니다
{{< /ko >}}

{{< en >}}
Use the `ko` / `en` shortcodes for whole blocks. **Markdown** works inside.

- Lists work too
- The header button switches the whole site; the buttons above the post switch this post only
{{< /en >}}

한 문단씩 번갈아 쓸 때는 다음 줄에 속성을 붙입니다.
{.ko}

To alternate paragraph by paragraph, put the attribute on the next line.
{.en}

문장 안에서는 {{< ko inline >}}인라인 한국어{{< /ko >}}{{< en inline >}}inline English{{< /en >}}처럼 섞을 수 있습니다.

## 코드 {.ko}

## Code {.en}

```python
import numpy as np

# Nernst equation, 25 °C
def nernst(E0, n, Q, T=298.15):
    R, F = 8.314, 96485
    return E0 - (R * T) / (n * F) * np.log(Q)
```

## 수식 {.ko}

## Math {.en}

Inline: $E = E^0 - \frac{RT}{nF}\ln Q$, and display:

$$
\sigma = \frac{L}{R_b A}, \qquad D_{\mathrm{Li^+}} = \frac{R^2 T^2}{2 A^2 n^4 F^4 C^2 \sigma_w^2}
$$

## 표 {.ko}

## Table {.en}

| Electrolyte | σ (mS cm⁻¹) | E<sub>a</sub> (eV) |
|---|---|---|
| LLZO | 0.5 | 0.32 |
| LPSCl | 2.0 | 0.25 |

### 각주 {.ko}

### Footnotes {.en}

각주도 지원됩니다.[^1]

[^1]: Goldmark 기본 각주 문법입니다.
