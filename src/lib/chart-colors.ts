// Validated categorical/status palette (see the dataviz skill's palette.md).
// Mirrored here as plain hex because SVG chart libraries need literal color
// values rather than CSS custom properties; keep in sync with globals.css.
export const CHART_PALETTE = {
  light: {
    series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
    grid: "#e1e0d9",
    axis: "#898781",
    ink: "#52514e",
    surface: "#fcfcfb",
  },
  dark: {
    series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"],
    grid: "#2c2c2a",
    axis: "#898781",
    ink: "#c3c2b7",
    surface: "#1a1a19",
  },
};

export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};
