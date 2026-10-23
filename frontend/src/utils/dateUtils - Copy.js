// Today's date as YYYY-MM-DD using the device/system clock (local time,
// not UTC, so it never jumps a day early or late).
export const getToday = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// True when a YYYY-MM-DD value is later than today.
export const isFutureDate = (value) => Boolean(value) && value > getToday();

// If a value is in the future (typed by hand or restored from an old draft),
// return "" so it can be cleared; otherwise return it unchanged.
export const clampToToday = (value) => (isFutureDate(value) ? "" : value);