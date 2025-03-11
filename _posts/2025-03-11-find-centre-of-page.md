---
layout: post
title: Finding the centre of a web page
date: 2025-03-11 11:45am
categories:
  - blog
tags:
  - tips

author: "Benjie Kibblewhite"
---

I wanted to quickly find the centre of a page so I could visually confirm for myself that an element was placed smack dab in the middle. Maybe there's better ways to do this, but pasting this little snippet in your browser's console does the trick just fine.

```
{% raw %}
(function() {
    const style = `
        .center-line {
            position: fixed;
            background: red;
            z-index: 9999;
            pointer-events: none;
        }
        .vertical {
            width: 2px;
            height: 100vh;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
        }
        .horizontal {
            height: 2px;
            width: 100vw;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
        }
    `;

    const styleEl = document.createElement("style");
    styleEl.innerHTML = style;
    document.head.appendChild(styleEl);

    const verticalLine = document.createElement("div");
    verticalLine.classList.add("center-line", "vertical");

    const horizontalLine = document.createElement("div");
    horizontalLine.classList.add("center-line", "horizontal");

    document.body.appendChild(verticalLine);
    document.body.appendChild(horizontalLine);
})();
{% endraw %}
```
