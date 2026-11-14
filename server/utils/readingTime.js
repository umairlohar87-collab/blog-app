const WORDS_PER_MINUTE = 200;

/** Estimated reading time in whole minutes (minimum 1). */
function readingTime(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

module.exports = readingTime;
