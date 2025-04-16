import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document title
document.title = "AnimeVerse - Watch Anime Online";

createRoot(document.getElementById("root")!).render(<App />);
