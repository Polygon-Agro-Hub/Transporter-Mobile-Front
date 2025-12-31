export const formatScheduleTime = (timeStr: string): string => {
  if (!timeStr) return "Not Scheduled";

  try {
    // Remove "Within " prefix if present
    let cleanTime = timeStr.replace(/^Within\s+/i, "").trim();

    // Check if it's already in "X.XX AM/PM - X.XX AM/PM" format
    const timeFormatRegex =
      /(\d+\.?\d*)\s*(AM|PM)\s*-\s*(\d+\.?\d*)\s*(AM|PM)/i;
    if (timeFormatRegex.test(cleanTime)) {
      // If already has decimal, ensure it's .00 format
      const match = cleanTime.match(timeFormatRegex);
      if (match) {
        const [_, startNum, startPeriod, endNum, endPeriod] = match;
        const formattedStart = `${parseFloat(startNum).toFixed(
          2
        )} ${startPeriod}`;
        const formattedEnd = `${parseFloat(endNum).toFixed(2)} ${endPeriod}`;
        return `${formattedStart} - ${formattedEnd}`;
      }
      return cleanTime;
    }

    // Handle formats like "8AM - 2PM" or "8-12 PM"
    const parts = cleanTime.split(/[\s-]+/);

    if (parts.length >= 2) {
      let startTime = parts[0];
      let endTime = parts[parts.length - 1];

      // Helper function to parse and format time with .00
      const parseAndFormatTime = (time: string): string => {
        // Extract numeric part
        const numericMatch = time.match(/(\d+\.?\d*)/);
        if (!numericMatch) return time;

        let hour = parseFloat(numericMatch[1]);
        let period = "";

        // Check for AM/PM in the time string
        if (time.toUpperCase().includes("AM")) {
          period = "AM";
        } else if (time.toUpperCase().includes("PM")) {
          period = "PM";
        }

        // If no period found, check if it's in the original string
        if (!period) {
          for (const part of parts) {
            const upperPart = part.toUpperCase();
            if (upperPart === "AM" || upperPart === "PM") {
              period = upperPart;
              break;
            }
          }
        }

        // If still no period, assume based on hour
        if (!period) {
          if (hour >= 12) {
            period = "PM";
            if (hour > 12) hour -= 12;
          } else {
            period = "AM";
          }
        } else {
          // If period is specified, convert to 12-hour format
          if (hour >= 13 && hour <= 23) {
            hour -= 12;
          } else if (hour === 12 && period === "AM") {
            // 12 AM stays 12
          } else if (hour === 12 && period === "PM") {
            // 12 PM stays 12
          } else if (hour > 12) {
            hour = hour % 12;
          }
        }

        // Format with two decimal places (always .00 for whole hours)
        return `${hour.toFixed(2)} ${period}`;
      };

      const formattedStart = parseAndFormatTime(startTime);
      const formattedEnd = parseAndFormatTime(endTime);

      return `${formattedStart} - ${formattedEnd}`;
    }

    // If it's a single time like "8AM", format it too
    const singleTimeRegex = /(\d+\.?\d*)\s*(AM|PM)/i;
    if (singleTimeRegex.test(cleanTime)) {
      const match = cleanTime.match(singleTimeRegex);
      if (match) {
        const hour = parseFloat(match[1]);
        const period = match[2].toUpperCase();
        return `${hour.toFixed(2)} ${period}`;
      }
    }

    return cleanTime;
  } catch (error) {
    console.error("Error formatting schedule time:", error);
    return timeStr;
  }
};
