/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const tintColorLight = '#11181C';
export const tintColorDark = '#fff';
const primaryColor='#0084ff'
export const iconLight = '#687076';
export const iconDark = '#9BA1A6';
export const Colors = {
  // light: {
  //   text: '#11181C',
  //   background: '#fcfdfe',
  //   tint: tintColorLight,
  //   icon: '#687076',
  //   tabIconDefault: '#687076',
  //   tabIconSelected: tintColorLight,
  //   primary: primaryColor,
  // },
  // dark: {
  //   text: '#ECEDEE',
  //   background: '#020407',
  //   tint: tintColorDark,
  //   icon: '#9BA1A6',
  //   tabIconDefault: '#9BA1A6',
  //   tabIconSelected: tintColorDark,
  //   primary: primaryColor,
  // },
  light: {
    background: '#fcfdfe', // background
    border: '#020407', // border
    card: '#fcfdfe', // card
    notification: 'hsl(0 84.2% 60.2%)', // destructive
    primary: primaryColor, // primary
    text: '#11181C', // foreground
  },
  dark: {
    background: '#020407', // background
    border: '#fcfdfe', // border
    card: '#020407', // card
    notification: 'hsl(0 72% 51%)', // destructive
    primary: primaryColor, // primary
    text: '#ECEDEE', // foreground
  },
};
