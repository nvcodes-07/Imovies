/**
 * Extract YouTube Video ID from various YouTube URL formats
 * Supports standard watch URLs, short youtu.be, embed URLs, and mobile URLs
 * @param {string} url
 * @returns {string|null} 11-character YouTube video ID or null
 */
export const getYoutubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // Standard regex to match YouTube video IDs
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
};

/**
 * Validate whether a string is a valid YouTube video link
 * @param {string} url
 * @returns {boolean}
 */
export const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return Boolean(getYoutubeVideoId(url));
};

/**
 * Get privacy-enhanced YouTube embed URL with autoplay turned off
 * @param {string} url
 * @returns {string|null}
 */
export const getYoutubeEmbedUrl = (url) => {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
};

