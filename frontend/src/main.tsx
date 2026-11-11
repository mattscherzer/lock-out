import "leaflet/dist/leaflet.css";
import "./styles/index.css";
import "./map/map.css";
import { createRoot } from "react-dom/client";
import { App, LoadError } from "./app/App.tsx";
import { ErrorBoundary } from "./app/ErrorBoundary.tsx";
import { loadAppData } from "./data/load.ts";

const root = createRoot(document.getElementById("root")!);
try {
  root.render(
    <ErrorBoundary>
      <App {...await loadAppData()} />
    </ErrorBoundary>,
  );
} catch (err) {
  console.error(err);
  root.render(<LoadError />);
}
