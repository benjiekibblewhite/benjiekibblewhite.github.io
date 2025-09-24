---
layout: post
title: "Programming for the People: AI and Unlocking the Power of the Machines: Or, A Tip Calculator for the Fallbright Tavern"
date: 2025-09-24 10:15am
categories:
  - blog
tags:
  - ai
  - llms
  - access
link: "https://benjie.ca/fallbright-tips.html"
author: "Benjie Kibblewhite"
---

I'm [skeptical](/blog/2025/05/06/ai-its-worth-doing-badly.html) about AI for a lot of applications. I really do think that using these tools for most creative practices is tricky at best, dangerous at worst.

But the thing about them that gets me _really_ excited is that they can up the flexibility of programming for everyone.

Computers are powerful, and if we can wield that power for ourselves, a lot of possibilities open up. Learning how to code is intimidating. I think anyone can learn it, but not everyone has the kind of brain that makes learning it easy, or fun. Besides, for most problems, there's probably already a tool out there that does more-or-less what we need. Unfortunately, that tool might not be exactly what we need. It might be expensive, or owned by a company with politics we find abhorrent, or it could be close to what we want, but not exactly right.

My husband owns a restaurant. They manage tips differently. If someone worked that day, no matter how long, they get an equal share of the tips for that day, because their work was just as valuable in creating that experience for the guest. Most tip-splitting tools, like the one built into their POS system, split tips by hours worked. He'd built a spreadsheet, but he's not a technical person, and it had errors in it. Also, he had to manually copy & past values from the reports his POS spit out, and that was also error-prone. This would take him at best 30 minutes a week, sometimes an hour or more while he tried to figure out where the error was.

So, we sat down, and tried to create a custom script that could do this for him. We gave Cursor two reports from his POS, and a complete, accurate example of the tip sharing report he was creating, and told it to figure it out.

It did. It took about 5 minutes, another 5 to put it on my site, and bang. We had a web page where he could upload those reports, and get a spreadsheet that accurately, every time, figures out the tip sharing for him.

I was helping him, but he could have done this himself. A perfect, automated tool, that works exactly for his specific use case.

My husband doesn't need to learn how to program. He doesn't need yet another company trying to solve not only his problems (and extract his hard-earned money), but the problems of 10,000 other restaurant owners, resulting in a generic solution that doesn't really make anyone 100% happy. He needs to get things done, and move on, so he can run his restaurant and put food on people's plates and wine in their glasses. These AI tools have the potential for harm... but there's also a great hope they can make the incredible, flexible, infinitely malleable power of computers into everyone's hands, for good.

If you want, you can [check out the code](https://github.com/benjiekibblewhite/benjiekibblewhite.github.io/blob/main/unbuilt-pages/fallbright-tips.html) for this tool.
