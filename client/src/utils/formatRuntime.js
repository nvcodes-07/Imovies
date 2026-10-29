/**
 * Reusable utility to convert runtime in minutes to readable format, e.g. 138 -> "2h 18m"
 * @param {number|string} minutes - Movie runtime in minutes
 * @returns {string} Formatted string like "2h 18m" or empty string if invalid
 */
export const formatRuntime = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') return '';
  const totalMins = Math.round(Number(minutes));
  if (isNaN(totalMins) || totalMins <= 0) return '';

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

export default formatRuntime;

