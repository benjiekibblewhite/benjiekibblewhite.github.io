---
layout: post
title:  "TIL: VSCode Go To Symbol Shortcut"
date:   2021-05-19 2:11pm
categories:
- blog
tags:
- today i learned
- tips
- vscode
- visual studio code

author: "Benjie Kibblewhite"
---

Inspired by a coworker's appreciation of Today I Learned style blogs (hey kmac), I'm going to attempt to start blogging about little tips and tricks and interesting things I learn as I go about my day to day work. 

This one might be an obvious one if you're a Visual Studio Code power user, but it was new to me! 

[Go To Symbol](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_go-to-symbol-in-workspace)

Just hit `⌘T`, or preface your search in the Command Palette with `#`. This lets you search all the symbols (function declarations, variables, types, basically anything named) in your workspace, and jump right to where it's defined. 

Usually, I would use the search bar for this, but I can see it being useful for something that's used in many places, and I really want to get to where the symbol is defined as quickly as possible. 

Now, if I'm looking at a place where that symbol is used, it's probably faster to `⌘ + click` on the name, or right click on it and select `Go To Definition`, which should do the same thing. Still, it's a neat feature that I didn't know VSCode had! 
