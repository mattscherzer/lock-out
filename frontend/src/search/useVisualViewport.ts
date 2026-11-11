import { useEffect } from "react";

// the soft keyboard overlays the page instead of resizing it, so size the full-screen panel to the visible area
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement.style;
    const fit = () => {
      root.setProperty(
        "--vv-covered",
        `${Math.max(0, window.innerHeight - vv.offsetTop - vv.height)}px`,
      ); // keyboard and Safari's floating bars
      root.setProperty("--vv-top", `${vv.offsetTop}px`);
    };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
      root.removeProperty("--vv-top");
      root.removeProperty("--vv-covered");
    };
  }, []);
}
