/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-pop-in": {
          "0%": {
            "position": "relative",
            "top": "2rem",
            "opacity": "0"
          },
          "100%": {
            "position": "relative",
            "top": "0rem",
            "opacity": "1"
          }
        }
      },
      animation: {
        "fade-pop-in": "fade-pop-in 1.5s ease-in-out forwards"
      },
      height: {
        "full-vh": "100vh",
        "75-vh": "75vh",
        "half-vh": "50vh"
      },
      width: {
        "full-vw": "100vw",
        "75-vw": "75vw",
        "half-vw": "50vw"
      },
      backgroundImage: {
        "img-anime": 'url("/wallpaper.jpg")'
      },
      colors: {
        "blurple": "rgb(88, 101, 242)",
        "anime-dark-blue": "rgb(18, 32, 58)",
        "anime-bg": "rgb(21, 35, 64)",
        "smoke-white": "rgba(255, 255, 255, 0.3)",
        "anime-light-blue": "rgb(62, 98, 134)"
      }        
    },
  },
  plugins: [],
}
