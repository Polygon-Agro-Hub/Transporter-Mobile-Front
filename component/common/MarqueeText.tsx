// import React, { useRef, useEffect, useState } from "react";
// import { Animated, Text, View, StyleSheet, Easing } from "react-native";

// interface MarqueeTextProps {
//   text: string;
//   className?: string;
//   style?: any;
//   speed?: number;
// }

// const MarqueeText: React.FC<MarqueeTextProps> = ({
//   text,
//   className,
//   style,
//   speed = 30,
// }) => {
//   const scrollX = useRef(new Animated.Value(0)).current;
//   const [textWidth, setTextWidth] = useState(0);
//   const [containerWidth, setContainerWidth] = useState(0);
//   const animationRef = useRef<any>(null);

//   useEffect(() => {
//     return () => {
//       if (animationRef.current) {
//         animationRef.current.stop();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     const shouldScroll = textWidth > containerWidth && textWidth > 0 && containerWidth > 0;
    
//     if (shouldScroll) {
//       startScrolling();
//     } else {
//       if (animationRef.current) {
//         animationRef.current.stop();
//       }
//     }
//   }, [textWidth, containerWidth, text]);

//   const startScrolling = () => {
//     if (animationRef.current) {
//       animationRef.current.stop();
//     }

//     // Calculate how much extra space we have to scroll
//     const extraSpace = textWidth - containerWidth;
//     // We need to scroll by the extra space plus a little more for smoothness
//     const scrollAmount = extraSpace + 50; // Add 50px buffer
    
//     // Calculate duration based on speed
//     const duration = (scrollAmount / speed) * 1000;

//     // Create the animation
//     animationRef.current = Animated.loop(
//       Animated.sequence([
//         // Start with text in normal position
//         Animated.timing(scrollX, {
//           toValue: 0,
//           duration: 0,
//           useNativeDriver: true,
//         }),
//         // Wait a moment
//         Animated.delay(1000),
//         // Scroll to the left
//         Animated.timing(scrollX, {
//           toValue: -scrollAmount,
//           duration: duration,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         }),
//         // Wait at the end
//         Animated.delay(1000),
//         // Reset
//         Animated.timing(scrollX, {
//           toValue: 0,
//           duration: 0,
//           useNativeDriver: true,
//         }),
//         // Wait before restarting
//         Animated.delay(1000),
//       ])
//     );

//     animationRef.current.start();
//   };

//   const shouldScroll = textWidth > containerWidth && textWidth > 0 && containerWidth > 0;

//   return (
//     <View 
//       style={styles.container}
//       onLayout={(event) => {
//         const { width } = event.nativeEvent.layout;
//         setContainerWidth(width);
//       }}
//     >
//       <Text
//         style={[styles.measurementText, style]}
//         className={className}
//         onLayout={(event) => {
//           const { width } = event.nativeEvent.layout;
//           setTextWidth(width);
//         }}
//       >
//         {text}
//       </Text>

//       <View style={styles.scrollView}>
//         <Animated.View
//           style={[
//             styles.textContainer,
//             { 
//               width: textWidth,
//               transform: [{ translateX: scrollX }] 
//             },
//           ]}
//         >
//           <Text
//             className={className}
//             style={[styles.text, style]}
//             numberOfLines={1}
//           >
//             {text}
//           </Text>
//         </Animated.View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     height: 24,
//     justifyContent: "center",
//   },
//   measurementText: {
//     position: "absolute",
//     opacity: 0,
//     left: -9999,
//   },
//   scrollView: {
//     flex: 1,
//     overflow: "hidden",
//   },
//   textContainer: {
//     position: "absolute",
//     top: 0,
//     bottom: 0,
//     justifyContent: "center",
//   },
//   text: {
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//     lineHeight: 18,
//   },
// });

// export default MarqueeText;
import React, { useRef, useEffect, useState } from "react";
import { Animated, Text, View, StyleSheet, Easing } from "react-native";

interface MarqueeTextProps {
  text: string;
  className?: string;
  style?: any;
  speed?: number;
}

const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className,
  style,
  speed = 30,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    console.log(`📊 Debug: Text: ${textWidth.toFixed(1)}px, Container: ${containerWidth.toFixed(1)}px`);
    
    // Add a small buffer to handle measurement precision
    const shouldScroll = textWidth >= (containerWidth - 2) && textWidth > 0 && containerWidth > 0;
    
    console.log(`🔍 Should Scroll: ${shouldScroll} (${textWidth} >= ${containerWidth - 2})`);
    
    if (shouldScroll) {
      console.log('✅ Starting marquee animation');
      startScrolling();
    } else {
      console.log('❌ Not scrolling');
      if (animationRef.current) {
        animationRef.current.stop();
      }
    }
  }, [textWidth, containerWidth, text]);

  const startScrolling = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // The text should start from the right edge (outside container)
    // and scroll until it's completely off to the left
    // Distance = textWidth + containerWidth (to ensure it scrolls completely through)
    const totalDistance = textWidth + containerWidth;
    const duration = (totalDistance / speed) * 1000;

    // Start from the right edge (outside container)
    scrollX.setValue(containerWidth);

    animationRef.current = Animated.loop(
      Animated.sequence([
        // Optional: Add a delay before starting
        Animated.delay(500),
        // Scroll from right edge to left until text is completely off screen
        Animated.timing(scrollX, {
          toValue: -textWidth,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Optional: Add a delay at the end
        Animated.delay(500),
        // Reset position
        Animated.timing(scrollX, {
          toValue: containerWidth,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animationRef.current.start();
  };

  const shouldScroll = textWidth >= (containerWidth - 2) && textWidth > 0 && containerWidth > 0;

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
      {/* Hidden measurement text */}
      <Text
        style={[styles.measurementText, style]}
        className={className}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width > 0) {
            setTextWidth(width);
          }
        }}
      >
        {text}
      </Text>

      {shouldScroll ? (
        <View style={styles.scrollWrapper}>
          <Animated.View
            style={[
              styles.scrollContainer,
              { 
                width: textWidth,
                transform: [{ translateX: scrollX }] 
              },
            ]}
          >
            <Text
              className={className}
              style={[styles.displayText, style]}
              numberOfLines={1}
            >
              {text}
            </Text>
          </Animated.View>
        </View>
      ) : (
        <Text
          className={className}
          style={[styles.displayText, style]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    height: 24,
    justifyContent: "center",
  },
  measurementText: {
    position: "absolute",
    opacity: 0,
    left: -9999,
    top: 0,
    includeFontPadding: false,
  },
  scrollWrapper: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  scrollContainer: {
    position: "absolute",
    left: 0,
    justifyContent: "center",
  },
  displayText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
});

export default MarqueeText;