---

layout: post
title: TIL - React Native Dynamic "See More" based on number of lines of text
date: 2021-06-17 5:00pm
categories:
- blog
tags:
- til
- a11y
- accessibility
- react-native

author: "Benjie Kibblewhite"
---

The solution for this problem comes fully from [this great page on Stack Overflow](https://stackoverflow.com/questions/55805233/how-to-show-for-text-more-less-in-react-naitve-javascript), I just came to the problem from a slightly different angle.

We had two competing priorities for a component that appeared at the very top of our home screen. On the one hand, we want to allow users to increase the font size in our app if they need to. On the other hand, we didn't want this component to potentially take up the entire screen.

I wondered if there was a way to dynamically have a "Read More" button of some kind along a block of text. If that text overflows beyond some constraint, we'll add some ellipses and this button. The solution in that Stack Overflow thread involves using the `onTextLayout` event from the `Text` component to limit the block to a set number of lines.

If a user has a large font size, the component will still probably have a larger height than we designed, but we can intelligently set some kind of limit to that, hopefully keeping said component from taking over the whole screen and hiding other, potentially more important content.

We haven't implemented this, but I thought it was an interesting enough concept to jot down for later. 

What I have down below might be able to have further accessibility improvements. For one thing, I know iOS' VoiceOver feature will at least sometimes read all the text in an element, even if it's been ellipsized. That may make the "Show More" element redundant, and we could remove it if we can detect the user is using VoiceOver.

![Alt](/images/dynamicSeeMoreExample.gif "Animated Gif showing the solution in action. The view starts with the text on three lines, normal size. The user closes the app, goes into their accessibility settings, and increases the font size. The user returns to the app, and we can see that the text has been truncated to 3 lines, cut off with an ellipsis. The user taps the 'See more' link that has now appeared, and the rest of the text appears. The link text changes to 'See less'.")

```
const MAX_LINES = 3;

export const DynamicOverflowBox = () => {
  const [showText, setShowText] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(undefined);
  const [showMoreButton, setShowMoreButton] = useState(false);

  const onTextLayout = useCallback(
    (e) => {
      if (e.nativeEvent.lines.length > MAX_LINES && !showText) {
        setShowMoreButton(true);
        setNumberOfLines(MAX_LINES);
      }
    },
    [showText]
  );

  useEffect(() => {
    if (showMoreButton) {
      setNumberOfLines(showText ? undefined : MAX_LINES);
    }
  }, [showText, showMoreButton]);

  return (
    <View
      style={{
        margin: 10,
        padding: 20,
        backgroundColor: "white",
      }}
    >
      <Text
        onTextLayout={onTextLayout}
        numberOfLines={numberOfLines}
        style={{ fontSize: 19 }}
      >
        I want this text to always be on three lines. Given the design, I should
        always have 3 lines, even with a bigger font size.
      </Text>
      {showMoreButton && (
        <TouchableOpacity onPress={() => setShowText((showText) => !showText)} accessibilityRole="button">
          <Text>{showText ? "Read Less" : "Read More"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```
