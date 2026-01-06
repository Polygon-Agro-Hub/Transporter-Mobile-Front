
// import React, { useRef, useEffect, useState } from "react";
// import { Animated, Text, View, StyleSheet, Easing, TextStyle, Dimensions } from "react-native";

// interface FixedMarqueeTextProps {
//   text: string;
//   style?: TextStyle;
//   speed?: number;
// }

// const FixedMarqueeText: React.FC<FixedMarqueeTextProps> = ({
//   text,
//   style,
//   speed = 40,
// }) => {
//   const scrollX = useRef(new Animated.Value(0)).current;
//   const [textWidth, setTextWidth] = useState<number>(0);
//   const [containerWidth, setContainerWidth] = useState<number>(0);
//   const animationRef = useRef<Animated.CompositeAnimation | null>(null);
//   const screenWidth = Dimensions.get('window').width;

//   const cleanText = text?.trim() || '';

//   useEffect(() => {
//     return () => {
//       if (animationRef.current) {
//         animationRef.current.stop();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (textWidth === 0 || containerWidth === 0) return;

//     console.log(`✅ Full text length: ${cleanText.length} characters`);
//     console.log(`📏 Measured text width: ${textWidth}px, Container: ${containerWidth}px`);
    
//     // ALWAYS scroll for texts longer than 50 characters
//     const shouldScroll = cleanText.length > 50;
    
//     console.log(`🔍 Should scroll: ${shouldScroll} (${cleanText.length} > 50)`);
    
//     if (shouldScroll) {
//       console.log('🚀 Starting FULL TEXT marquee');
//       startScrolling();
//     } else {
//       if (animationRef.current) {
//         animationRef.current.stop();
//         animationRef.current = null;
//       }
//       scrollX.setValue(0);
//     }

//   }, [textWidth, containerWidth, cleanText]);

//   const startScrolling = () => {
//     if (animationRef.current) {
//       animationRef.current.stop();
//     }

//     // Calculate animation
//     const startPosition = containerWidth;
//     const endPosition = -textWidth;
//     const totalDistance = textWidth + containerWidth;
//     const duration = (totalDistance / speed) * 1000;

//     console.log(`🎬 FULL TEXT scrolling: ${textWidth}px text through ${containerWidth}px container`);
//     console.log(`⏱️ Duration: ${duration}ms`);

//     scrollX.setValue(startPosition);

//     animationRef.current = Animated.loop(
//       Animated.sequence([
//         Animated.delay(1000),
//         Animated.timing(scrollX, {
//           toValue: endPosition,
//           duration: duration,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         }),
//         Animated.timing(scrollX, {
//           toValue: startPosition,
//           duration: 0,
//           useNativeDriver: true,
//         }),
//         Animated.delay(500),
//       ])
//     );

//     animationRef.current.start();
//   };

//   const shouldScroll = cleanText.length > 50 && textWidth > 0 && containerWidth > 0;

//   return (
//     <View 
//       style={styles.container}
//       onLayout={(event) => {
//         const { width } = event.nativeEvent.layout;
//         if (width > 0) {
//           setContainerWidth(width);
//         }
//       }}
//     >
//       {/* CRITICAL FIX: Measurement text needs UNLIMITED width */}
//       <View style={styles.measurementWrapper}>
//         <Text
//           style={[styles.measurementText, style]}
//           onLayout={(event) => {
//             const { width } = event.nativeEvent.layout;
//             if (width > 0) {
//               console.log(`📐 ACTUAL text width measurement: ${width}px`);
//               setTextWidth(width);
//             }
//           }}
//           // CRITICAL: These props ensure full text measurement
//           numberOfLines={1}
//           ellipsizeMode="clip"
//         >
//           {cleanText}
//         </Text>
//       </View>

//       {/* Display area */}
//       <View style={styles.displayContainer}>
//         {shouldScroll ? (
//           <View style={styles.scrollView}>
//             <Animated.View
//               style={[
//                 styles.scrollingText,
//                 {
//                   transform: [{ translateX: scrollX }],
//                   width: textWidth,
//                 },
//               ]}
//             >
//               <Text
//                 style={[styles.displayText, style]}
//                 numberOfLines={1}
//                 ellipsizeMode="clip"
//               >
//                 {cleanText}
//               </Text>
//             </Animated.View>
//           </View>
//         ) : (
//           <Text
//             style={[styles.displayText, style]}
//             numberOfLines={1}
//             ellipsizeMode="tail"
//           >
//             {cleanText}
//           </Text>
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: '100%',
//     height: 24,
//     overflow: 'hidden',
//   },
//   measurementWrapper: {
//     position: 'absolute',
//     // Give it HUGE width to measure full text
//     width: 9999,
//     left: -5000,
//     opacity: 0,
//     zIndex: -1,
//   },
//   measurementText: {
//     includeFontPadding: false,
//     // Ensure text doesn't wrap or truncate during measurement
//     flexShrink: 0,
//     flexWrap: 'nowrap',
//   },
//   displayContainer: {
//     flex: 1,
//     overflow: 'hidden',
//     justifyContent: 'center',
//   },
//   scrollView: {
//     flex: 1,
//     overflow: 'hidden',
//   },
//   scrollingText: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     justifyContent: 'center',
//   },
//   displayText: {
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
// });

// export default FixedMarqueeText;

// import React, { useRef, useEffect } from "react";
// import { Animated, Text, View, StyleSheet, TextStyle } from "react-native";

// interface AlwaysScrollMarqueeProps {
//   text: string;
//   style?: TextStyle;
// }

// const AlwaysScrollMarquee: React.FC<AlwaysScrollMarqueeProps> = ({
//   text,
//   style,
// }) => {
//   const translateX = useRef(new Animated.Value(0)).current;
//   const animationRef = useRef<Animated.CompositeAnimation | null>(null);

//   const cleanText = text?.trim() || '';
  
//   // Estimate widths based on text length
//   const estimatedTextWidth = cleanText.length * 8; // Rough estimate: 8px per character
//   const estimatedContainerWidth = 200; // Typical container width

//   useEffect(() => {
//     // ALWAYS animate if text is longer than 20 characters
//     if (cleanText.length > 20) {
//       startAnimation();
//     }

//     return () => {
//       if (animationRef.current) {
//         animationRef.current.stop();
//       }
//     };
//   }, [cleanText]);

//   const startAnimation = () => {
//     if (animationRef.current) {
//       animationRef.current.stop();
//     }

//     const scrollAmount = estimatedTextWidth - estimatedContainerWidth;
//     const duration = (estimatedTextWidth / 30) * 1000; // 30px per second

//     console.log(`🎬 FORCED Animation: "${cleanText.substring(0, 30)}..."`);
//     console.log(`📐 Estimated scroll: ${scrollAmount}px in ${duration}ms`);

//     // Start from beginning
//     translateX.setValue(0);

//     animationRef.current = Animated.loop(
//       Animated.sequence([
//         // Pause at beginning
//         Animated.delay(2000),
//         // Scroll to show rest
//         Animated.timing(translateX, {
//           toValue: -scrollAmount,
//           duration: duration,
//           useNativeDriver: true,
//         }),
//         // Pause at end
//         Animated.delay(2000),
//         // Reset
//         Animated.timing(translateX, {
//           toValue: 0,
//           duration: 0,
//           useNativeDriver: true,
//         }),
//       ])
//     );

//     animationRef.current.start();
//   };

//   return (
//     <View style={styles.container}>
//       <Animated.View
//         style={[
//           styles.textContainer,
//           {
//             transform: [{ translateX }],
//             width: estimatedTextWidth,
//           },
//         ]}
//       >
//         <Text style={[styles.text, style]} numberOfLines={1}>
//           {cleanText}
//         </Text>
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     height: 24,
//     overflow: 'hidden',
//     justifyContent: 'center',
//   },
//   textContainer: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     justifyContent: 'center',
//   },
//   text: {
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
// });

// export default AlwaysScrollMarquee;  

import React, { useRef, useEffect, useState } from "react";
import { Animated, Text, View, StyleSheet, Easing, TextStyle, Dimensions } from "react-native";

interface FixedMarqueeTextProps {
  text: string;
  style?: TextStyle;
  speed?: number;
}

const FixedMarqueeText: React.FC<FixedMarqueeTextProps> = ({
  text,
  style,
  speed = 40,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const screenWidth = Dimensions.get('window').width;

  const cleanText = text?.trim() || '';

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (textWidth === 0 || containerWidth === 0) return;

    console.log(`✅ Full text length: ${cleanText.length} characters`);
    console.log(`📏 Measured text width: ${textWidth}px, Container: ${containerWidth}px`);
    
    const shouldScroll = cleanText.length > 50;
    
    console.log(`🔍 Should scroll: ${shouldScroll} (${cleanText.length} > 50)`);
    
    if (shouldScroll) {
      console.log('🚀 Starting LEFT-SIDE marquee');
      startScrolling();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      scrollX.setValue(0);
    }

  }, [textWidth, containerWidth, cleanText]);

  const startScrolling = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // FIXED: Start from left side (0) and move left
    const startPosition = 0; // Start visible at left edge
    const endPosition = -textWidth; // End when text completely leaves left side
    const totalDistance = textWidth; // Distance to travel
    const duration = (totalDistance / speed) * 1000;

    console.log(`🎬 LEFT-SIDE scrolling: ${textWidth}px text`);
    console.log(`📍 Start: ${startPosition}px, End: ${endPosition}px`);
    console.log(`⏱️ Duration: ${duration}ms, Speed: ${speed}px/sec`);

    // Reset to starting position
    scrollX.setValue(startPosition);

    animationRef.current = Animated.loop(
      Animated.sequence([
        // Initial delay before starting
        Animated.delay(1000),
        // Scroll from left to right (0 to -width)
        Animated.timing(scrollX, {
          toValue: endPosition,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Jump back to starting position
        Animated.timing(scrollX, {
          toValue: startPosition,
          duration: 0,
          useNativeDriver: true,
        }),
        // Pause before next loop
        Animated.delay(500),
      ])
    );

    animationRef.current.start();
  };

  const shouldScroll = cleanText.length > 50 && textWidth > 0 && containerWidth > 0;

  return (
    <View 
      style={styles.container}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0) {
          setContainerWidth(width);
        }
      }}
    >
      {/* Measurement text */}
      <View style={styles.measurementWrapper}>
        <Text
          style={[styles.measurementText, style]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              console.log(`📐 ACTUAL text width measurement: ${width}px`);
              setTextWidth(width);
            }
          }}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {cleanText}
        </Text>
      </View>

      {/* Display area */}
      <View style={styles.displayContainer}>
        {shouldScroll ? (
          <View style={styles.scrollView}>
            <Animated.View
              style={[
                styles.scrollingText,
                {
                  transform: [{ translateX: scrollX }],
                  // FIXED: Start position is now 0 (left aligned)
                  left: 0,
                  width: textWidth,
                },
              ]}
            >
              <Text
                style={[styles.displayText, style]}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {cleanText}
              </Text>
            </Animated.View>
          </View>
        ) : (
          <Text
            style={[styles.displayText, style]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cleanText}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 24,
    overflow: 'hidden',
  },
  measurementWrapper: {
    position: 'absolute',
    width: 9999,
    left: -5000,
    opacity: 0,
    zIndex: -1,
  },
  measurementText: {
    includeFontPadding: false,
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  displayContainer: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollingText: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  displayText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default FixedMarqueeText;