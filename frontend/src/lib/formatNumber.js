export function formatNumber(value) {
  if (value < 1000) {
    return value.toString();
  } else if (value < 1000000) {
    return (value / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k';
  } else {
    return (value / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  }
}