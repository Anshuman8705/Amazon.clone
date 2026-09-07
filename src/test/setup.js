import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom does not implement scrollTo; the app calls it on navigation.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
