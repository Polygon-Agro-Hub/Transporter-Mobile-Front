export const formatScheduleTime = (timeStr: string): string => {
  if (!timeStr) return "Not Scheduled";

  try {
    // Remove "Within " prefix if present
    let cleanTime = timeStr.replace(/^Within\s+/i, "").trim();

    // Helper: pull hour / minute / period out of a single time chunk
    // like "08:00 AM", "8AM", "12", "12:00"
    const extractTimeParts = (
      chunk: string
    ): { hour: number; minute: number; period: string | null } | null => {
      const match = chunk.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (!match) return null;

      const hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3] ? match[3].toUpperCase() : null;

      return { hour, minute, period };
    };

    // Normalize a parsed time into a 12-hour "H.MM AM/PM" string
    const formatParsedTime = (
      parsed: { hour: number; minute: number; period: string | null }
    ): string => {
      let { hour, period } = parsed;
      const minute = parsed.minute;

      if (!period) {
        // No AM/PM found anywhere - fall back to guessing from magnitude
        if (hour >= 12) {
          period = "PM";
          if (hour > 12) hour -= 12;
        } else {
          period = "AM";
        }
      } else {
        // Period is known - normalize to 12-hour range
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

      const minuteStr = minute.toString().padStart(2, "0");
      return `${hour}.${minuteStr} ${period}`;
    };

    // Split into exactly two halves around the range dash
    const rangeParts = cleanTime.split(/\s*-\s*/).filter(Boolean);

    if (rangeParts.length >= 2) {
      const startChunk = rangeParts[0];
      const endChunk = rangeParts[rangeParts.length - 1];

      const startParsed = extractTimeParts(startChunk);
      const endParsed = extractTimeParts(endChunk);

      if (startParsed && endParsed) {
        // If one side is missing AM/PM (e.g. "8-12 PM"), borrow it
        // from the other side rather than losing it.
        if (!startParsed.period && endParsed.period) {
          startParsed.period = endParsed.period;
        }
        if (!endParsed.period && startParsed.period) {
          endParsed.period = startParsed.period;
        }

        const formattedStart = formatParsedTime(startParsed);
        const formattedEnd = formatParsedTime(endParsed);

        return `${formattedStart} - ${formattedEnd}`;
      }
    }

    // Single time value like "8AM"
    const singleParsed = extractTimeParts(cleanTime);
    if (singleParsed && singleParsed.period) {
      return formatParsedTime(singleParsed);
    }

    return cleanTime;
  } catch (error) {
    console.error("Error formatting schedule time:", error);
    return timeStr;
  }
};