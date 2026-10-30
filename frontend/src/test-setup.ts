import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// no vitest globals, so RTL cannot register its own auto-cleanup
afterEach(cleanup);
