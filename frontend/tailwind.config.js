module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    // tailwind.config.js
  extend: {
    colors: {
      amber_light: "#F7E4C6",   // Background
      amber_dark: "#D4A373",    // Buttons/accents
      brown_dark: "#5C3D2E",    // Text/board lines
      gold_accent: "#C89B3C",   // Hover highlights
      red_accent: "#A63C3C",    // Alerts/back button
    },
  }
  },
  plugins: []
}
