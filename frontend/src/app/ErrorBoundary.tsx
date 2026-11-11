import { Component, type ReactNode } from "react";
import { LoadError } from "./App.tsx";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError = () => ({ failed: true });
  componentDidCatch(err: Error) {
    console.error(err);
  }
  render() {
    return this.state.failed ? <LoadError /> : this.props.children;
  }
}
