import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary.tsx";

it("a render error ends in the load-error status, not an empty page", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const Broken = (): never => {
    throw new Error("boom");
  };
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  expect(screen.getByText("Could not load map data")).toBeTruthy();
  expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
  log.mockRestore();
});
