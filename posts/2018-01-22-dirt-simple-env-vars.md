---
layout: post
title:  "Dirt-simple Environment Variables with create-react-app and GitHub Pages"
date:   2018-01-22 00:00:00 +0200
categories:
- blog
tags: 
- react
- node
- express
- gh-pages
author: "Benjie Kibblewhite"
---

This is a quickie, but a goodie. This kind of thing might cause a more experienced developer to roll their eyes, but feels like magic to this self-taught newbie.

I’m working on a simple client-side react app, using the API published by the Liquor Control Board of Ontario. I’m hosting the app on github pages, and deploying using the npm package “gh-pages”. The API key is domain-specific. I need one for my production environment, and one my development environment.

I had been switching the key out manually before I deployed to GitHub pages. That was getting annoying, and I knew there must be a Better Way. As I discover again and again in this coding journey, there is almost always a Better way. For once it’s deliciously simple:

*In the root directory of your create-react-app application, create two new files: ".env”, and “.env.local.”
*In your .env file, type `REACT_APP_API_KEY:` and assign it the API key for your production environment, like so:

`REACT_APP_API_KEY: FaKESAmplEKeyCBWHVAokOGjdfMvIPHoENeUvRSa`

*In your .env.local file, do the same thing, but include the key for your development environment.
*When you need to use the key, you can access it by calling “process.env.REACT_APP_API_KEY.” As an example, here’s how I’m using it with Axios:

``Axios.get(`https://lcboapi.com/stores?access_key=${process.env.REACT_APP_API_KEY}`)``

.env.local is in your .gitignore file by default with create-react-app. This means it is not added to your commits using Git, and it also means it won’t be deployed to GitHub Pages when you run npm deploy. The .env file, however, does get committed and deployed. The values in .env.local take precedence over the values in .env. So, since .env.local is not present in your production environment (GitHub pages), the app will use the values in .env.

You can store any kind of data you want in your .env file. Note, however, that your environment variables must all start with REACT_APP. Otherwise, they won’t be included in the process.env object. Also, you should be careful of the kinds of data you store. In this case, my API key can only be used when the request comes from the domain assigned to the key. I’m not worried about it being included in my GitHub repo — but I recognize this is still not best practice.

If anyone out there has a better way to use API keys with apps hosted on GitHub pages, leave a comment!

EDIT:

I forgot to credit Drew Goodwin — his post [Create-react-app environments](https://medium.com/@tacomanator "Create-React-App Environments on Medium.com") goes into much more depth than I do in this quick-take.