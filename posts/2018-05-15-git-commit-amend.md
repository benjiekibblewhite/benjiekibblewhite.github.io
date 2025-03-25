---
layout: post
title:  "Help! I've Pushed To My Remote Repo, But I Need To Change My Git Commit Message!"
date:   2018-02-23 3:30pm
categories:
- blog
tags:
- git magic
- github
- useful tricks

author: "Benjie Kibblewhite"
---

So! Like the fool you are, you've entered `git push origin`, only to realize, to your *abject horror*, that your commit message is incorrect. The shame! How embarrasing! How will you show your face around the foozeball table? Is this the end of your career? 

Fear not, dear friend, for I have learned (one of) the secrets of `git commit --amend`! (such poetry. the crowd sighs with delight.) 

1. From your terminal, enter `git commit --amend`. 
2. Edit your commit message. 
3. Push your newly perfected commit to your remote branch. 

Legends say you can event use `git commit --amend` to change the very files that make up your commit. Astounding! Truly miraculous! 

For more secrets, check out this great guide by [Atlassian](https://www.atlassian.com/git/tutorials/rewriting-history).
