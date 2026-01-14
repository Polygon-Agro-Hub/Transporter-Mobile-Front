



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
    
//     const shouldScroll = cleanText.length > 50;
    
//     console.log(`🔍 Should scroll: ${shouldScroll} (${cleanText.length} > 50)`);
    
//     if (shouldScroll) {
//       console.log('🚀 Starting LEFT-SIDE marquee');
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
//   if (animationRef.current) {
//     animationRef.current.stop();
//   }

//   const startPosition = 0; // Start visible at left
//   const endPosition = -textWidth; // Scroll completely off screen
//   const duration = (textWidth / speed) * 1000;

//   // Reset to starting position
//   scrollX.setValue(startPosition);

//   animationRef.current = Animated.loop(
//     Animated.sequence([
//       // Initial delay before starting first scroll
//       Animated.delay(1000),
//       // Scroll text off screen
//       Animated.timing(scrollX, {
//         toValue: endPosition,
//         duration: duration,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       }),
//       // Brief pause when text is off screen
//     //  Animated.delay(300),
//       // Instantly jump back to start position (no animation)
//       Animated.timing(scrollX, {
//         toValue: startPosition,
//         duration: 0,
//         useNativeDriver: true,
//       }),
//       // Pause before next loop (text is visible during this)
//     //  Animated.delay(800),
//     ])
//   );

//   animationRef.current.start();
// };


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
//       {/* Measurement text */}
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
//                   // FIXED: Start position is now 0 (left aligned)
//                   left: 0,
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
//    width: 1500,
//     left: -5000,
//     opacity: 0,
//     zIndex: -1,
//   },
//   measurementText: {
//     includeFontPadding: false,
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

import React, { useRef, useEffect, useState } from "react";
import { Animated, Text, View, StyleSheet, Easing, TextStyle } from "react-native";

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
  const [measurementWidth, setMeasurementWidth] = useState<number>(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const cleanText = text?.trim() || '';

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Calculate dynamic width for measurement based on text length
  useEffect(() => {
    // Estimate: roughly 8-10 pixels per character for typical fonts
    const estimatedWidth = Math.max(cleanText.length * 6, 200);
    setMeasurementWidth(estimatedWidth);
    setTextWidth(0); // Reset for remeasurement
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    
    console.log(`📝 Text: "${cleanText.substring(0, 30)}..." (${cleanText.length} chars)`);
    console.log(`📏 Estimated measurement width: ${estimatedWidth}px`);
  }, [cleanText]);

  useEffect(() => {
    if (textWidth === 0 || containerWidth === 0) return;

    console.log(`✅ Measured text width: ${textWidth}px, Container: ${containerWidth}px`);
    
    // Check if text exceeds container width
    const shouldScroll = textWidth > (containerWidth - 5);
    
    console.log(`🔍 Should scroll: ${shouldScroll}`);
    
    if (shouldScroll) {
      console.log('🚀 Starting marquee animation');
      startScrolling();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      scrollX.setValue(0);
    }

  }, [textWidth, containerWidth]);

  const startScrolling = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    const startPosition = 0;
    const endPosition = -textWidth;
    const duration = (textWidth / speed) * 1000;

    scrollX.setValue(startPosition);

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(scrollX, {
          toValue: endPosition,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollX, {
          toValue: startPosition,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animationRef.current.start();
  };

  const shouldScroll = textWidth > (containerWidth - 5) && textWidth > 0 && containerWidth > 0;

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
      {/* Measurement text with DYNAMIC width based on text length */}
      <View style={[styles.measurementWrapper, { width: measurementWidth }]}>
        <Text
          style={[styles.measurementText, style]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              console.log(`📐 Actual measured width: ${width}px`);
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
    // Width is set dynamically via inline style based on text length
    left: -10000,
    top: 0,
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