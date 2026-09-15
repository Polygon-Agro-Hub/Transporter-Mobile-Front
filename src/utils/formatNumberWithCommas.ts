// Function to format number with commas
export const formatNumberWithCommas = (value: any): string => {
  const number = Number(value);

  if (isNaN(number) || !isFinite(number)) {
    return "0.00";
  }
  const parts = number.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};
