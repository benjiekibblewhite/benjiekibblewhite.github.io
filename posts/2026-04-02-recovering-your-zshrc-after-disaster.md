---
layout: post
title: "AI Wiped Out My .zshrc File. Here's How I Got It Back."
date: 2026-04-02 2:45pm
categories:
  - blog
tags:
  - terminal
  - zsh
  - disaster recovery
  - sed
  - today i learned
author: "Benjie Kibblewhite"
---

Like everyone else under the sun, I've been leaning much more heavily into agentic coding these days. Also like everyone else, I have been seeing all of the stories of people's agents wiping important files, or making other horrible mistakes. It finally happened to me! Claude wiped out my .zshrc file while I was trying to get it to troubleshoot an issue I was having with a global environment variable. This wasn't catastrophic, but it was annoying. I had a lot of variables and aliases set up.

Luckily, I had open terminal windows that still had the shell config file loaded. 

## What went wrong? 

Claude ran this command: 

```bash
sed -i '' 's/export AWS_PROFILE="default"/export AWS_PROFILE="sso-bedrock"/' ~/.zshrc
```

I have never used `sed` myself before. It's one of those commands that Claude will not run normally on it's own without my explicit approval. I didn't really know what it was doing, but didn't stop to think about it, and just accepted it. 

What was probably the problem is that, instead of `export AWS_PROFILE="default"`, I had `export AWS_PROFILE=default`, without the quotes around `default`. The `-i` flag creates a temp file during editing, and replaces the original file with that temp, *even if the pattern matching fails*. Which it did. Resulting in an empty file. 

## What I should have done instead

Not let AI edit my system config files, obviously.

But, also, when using sed to do inline edits, it seems like it's smart to test the output first, just by omitting the `-i` flag. This just spits the output to stdout, letting you review it. And maybe, probably, if I do decide to do this, make a backup first. 

## How to fix it

Okay, so, hopefully you still have at least one terminal window open that has loaded your now missing .zshrc file. All of your variables and alises are still there. 

This was a place where I could use AI to fix AI problems. I had Claude create this script: 


```bash
#!/bin/zsh
# save this as recover.sh

echo "# Recovered .zshrc - $(date)" > ~/recovered-zshrc.txt
echo "" >> ~/recovered-zshrc.txt

echo "# ALIASES" >> ~/recovered-zshrc.txt
alias >> ~/recovered-zshrc.txt
echo "" >> ~/recovered-zshrc.txt

echo "# EXPORTED VARIABLES" >> ~/recovered-zshrc.txt
export -p >> ~/recovered-zshrc.txt
echo "" >> ~/recovered-zshrc.txt

echo "# FUNCTIONS" >> ~/recovered-zshrc.txt
typeset -f >> ~/recovered-zshrc.txt
echo "" >> ~/recovered-zshrc.txt

echo "# PATH" >> ~/recovered-zshrc.txt
echo "export PATH=\"$PATH\"" >> ~/recovered-zshrc.txt

echo "Recovery complete! Check ~/recovered-zshrc.txt"
```

Run it:

```bash
chmod +x recover.sh
./recover.sh
```

This dumps all your aliases, environment variables, functions, and PATH to a file. It's not perfect, you'll lose comments and conditional logic. But it captures the *runtime state* of your shell config. 

The trick is this dumps everything - a lot of variables and aliases will be there that aren't things you added yourself to your config. 

In my case, I had Claude analyze the list of variables, and only add the ones that looked like something I would have added. It did a pretty good job here. 

For the aliases, I had it look through my most-used commands. I probably could have done this myself, I have a few custom aliases I use all the time. But, it's fun to get the tool to do things for me. 

```bash
cat ~/.zsh_history | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

In my case, it saw commands like `gpush`, `gmp`, and `cb`. Those were aliases I needed to recover.

## Rebuilding Your .zshrc

If you use oh-my-zsh, start with the template:

```bash
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
```

Then add back:

1. **Your theme** (check with `echo $ZSH_THEME` in a working terminal)
2. **Your aliases** (from the recovered file)
3. **Environment variables** (from the recovered file)
4. **Tool initialization** (nvm, rbenv, etc.)


## Other Recovery Options

If you don't have active terminals, you might still have options:

- **Time Machine backups** (macOS): `tmutil listlocalsnapshots /`
- **Editor auto-save files**: Check `~/.vim/backup/`, VS Code backups, etc.
- **Cloud sync services**: Dropbox, iCloud, Google Drive often keep previous versions


---