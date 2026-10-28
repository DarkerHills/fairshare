import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

// Follow the system light/dark setting
const dark = window.matchMedia("(prefers-color-scheme: dark)")
const applyTheme = () => {
  document.documentElement.classList.toggle("dark", dark.matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark.matches ? "#17122E" : "#F4F2FF")
}
applyTheme()
dark.addEventListener("change", applyTheme)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
