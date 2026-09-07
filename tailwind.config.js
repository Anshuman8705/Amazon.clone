/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#131921",
        slate: "#232F3E",
        "slate-hi": "#37475A",
        ember: "#FEBD69",
        "ember-dark": "#F0A64B",
        sunny: "#FFD814",
        "sunny-dark": "#F7CA00",
        link: "#007185",
        ink: "#0F1111",
        muted: "#565959",
        line: "#D5D9D9",
        page: "#EAEDED",
        crimson: "#CC0C39",
        star: "#FFA41C",
        pine: "#067D62",
      },
      fontFamily: {
        sans: ["Amazon Ember", "Arial", "Helvetica", "sans-serif"],
      },
      maxWidth: {
        site: "1600px",
      },
    },
  },
  plugins: [],
};
