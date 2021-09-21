---
layout: post
title:  Accessible Inline Links in React Native
date:   2021-09-21 11:30am
categories:
- blog
tags:
- react native
- accessibility
- a11y

author: "Benjie Kibblewhite"
---

This isn't an entirely unique solution, but it was an interesting accessibility problem that speaks to how React Native actually handles text, and so I thought it was worth writing up anyway.

Consider a case where you have a block of text with an inline link. [Like so](https://catoftheday.com/). On the web, this is pretty trivial: 

```
<p>Consider a case where you have a block of text with an inline link. <a href="https://catoftheday.com/">Like so</a>.</p>
```

React Native doesn't have links - it has `Touchable` components, which are kind of like buttons. We can't nest these in a `Text` component, however, but we can apply an `onPress` prop to a `Text`. The html anchor tag does a lot for us - it applies default styling so the user knows this is an interactable element, handles the click event, and lets screen readers know what's up as well. We have to do a lot of that ourselves in React Native. If you do a search for "React Native nested link", you might see suggestions to do something like this:

```
<Text>Consider a case where you have a block of text with an inline link.
  <Text 
    onPress={() => Linking.openUrl('https://catoftheday.com/')}
    style={{
     textDecoration: 'underline'
    }}
    accessibilityRole='link'
  >Like so.</Text>
</Text>
```

We even have an `accessibilityRole` on that nested `Text` component, so this must be fully accessibile to users on screen readers now, and our work here is done, right? Maybe we could even add an `accessibilityLabel` as well, maybe: `Like so. Tap to go to the Cat of the Day website`. 

I thought so too, until a coworker actually tried testing it with a screen reader. 

Turns out, when you have nested `Text` components like this, React Native takes this and [converts this to a flat `NSAttributedString` or `SpannableString`](https://reactnative.dev/docs/text#nested-text). Meaning that these two components - the parent `Text` and the nested `Child`, our link, become a single native level element, so a screen reader can't actually focus on that link. 

The solution, then, is to make the parent `Text` interactable, but only if a user is on a screen reader. React Native provides an API for checking that, so let's take a look at how we could  do that: 

```
import { AccessibilityInfo, Text, Linking } from 'react-native';

const TextWithLink = () => {

  return (
    <Text 
      accessibilityLabel="Consider a case where you have a block of text with an inline link. Like so. Tap to go to the Cat of the Day website."
      accessibilityRole="Link"
      onPress={() => {
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        if (screenReaderEnabled) {
          Linking.openUrl("https://catoftheday.com/")
        }
      }>
      Consider a case where you have a block of text with an inline link.
      <Text 
        onPress={() => Linking.openUrl('https://catoftheday.com/')}
        style={{
          textDecoration: 'underline'
        }}
        accessibilityRole='link'
      >Like so.</Text>
    </Text>
  )
}
```

There are a two things I want to point out here:

1. I think it's important that a user should know what happens when they interact with an element. In the copy we have (let's pretend it was provided by design, rather than a bad example I whipped up in a rush) it's not clear, which is why I added "Tap to go to the Cat of the Day website" to the end of the accessibility label. In my experience testing screen readers, if there's an accessibility label on a block of text, it overrides the actual text content. So if the label was just "Tap to go to the Cat of the Day website", that's all a screen reader user would hear. 
2. With this solution, it's only possible to have a single link in a block of text, and I don't think it would be possible to have more than one in an accessible way. So if you're handed a design with more than one link per paragraph, you might need to push back on that. A mobile app isn't the web anyway, and I kind of think liberally using links is an anti-pattern, but there are cases where it's appropriate. 


The above solution could mean a lot of annoying repeating boilerplate, so you might want to abstract it out into something reusable. The tricky part would be getting the interpolation for the link right. My team uses [react-i18next](https://react.i18next.com/latest/trans-component), which has a handy `Trans` component for working with exactly this kind of thing. I've included the reusable component we came up with down below.

I'm still pretty new to making accessibility a priority in our app, and I'm sure I have lots to learn, so this might not be the 100% best solution. But it's certainly a lot better than what we had before! 

```
import React from 'react';
import { Trans } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';
import { ITextWithInlineLinkProps } from '.';
import { Text } from '../../atoms';
import { Link } from '../Link';

/*

This component provides an accessible way to have a block of text with an inline link
The parent Text component becomes tappable if a user is on a screen reader

The accessibilityLabel **MUST** include the full text of the content, and must end
with information telling the user what will happen if they tap on the element

Wrap the text that needs to become a link with <InlineLink> tags in the translations file

EG:

{
  example: "The <InlineLink>Mydoh</InlineLink> app and Smart Cash Card make it
  easy for kids to gain real money skills.",
  exampleAccessibilityLabel: ""The <InlineLink>Mydoh</InlineLink> app and Smart
  Cash Card make it easy for kids to gain real money skills. Tap to visit the
  Mydoh website."
}

*/

export const TextWithInlineLink: React.FC<ITextWithInlineLinkProps> = ({
  onPress,
  t,
  i18nKey,
  accessibilityLabel,
  linkStyle,
  ...textProps
}) => {
  async function onPressIfScreenReader() {
    const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    if (screenReaderEnabled) {
      onPress();
    }
  }

  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      onPress={onPressIfScreenReader}
      {...textProps}
    >
      <Trans
        t={t}
        i18nKey={i18nKey}
        components={{
          InlineLink: (
            <Link
              style={linkStyle}
              onPress={onPress}
              accessibilityLabel={accessibilityLabel}
              {...textProps}
            />
          ),
        }}
      />
    </Text>
  );
};

export default TextWithInlineLink;
```
