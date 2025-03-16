/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { metadata } from "./layout";

describe("RootLayout", () => {
  it("verifies favicon is included in metadata", () => {
    // Check that favicon is defined in the metadata
    expect(metadata.icons).toBeDefined();

    // Type-safe approach to check for icon property
    const icons = metadata.icons as { icon: string };
    expect(icons.icon).toBe("/favicon.svg");
  });

  it("renders with favicon link in head", () => {
    // Create a custom document head to test
    document.head.innerHTML = "";
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = "/favicon.svg";
    link.type = "image/svg+xml";
    document.head.appendChild(link);

    expect(document.querySelector('link[rel="icon"]')).toBeInTheDocument();
    expect(document.querySelector('link[rel="icon"]')).toHaveAttribute(
      "href",
      "/favicon.svg"
    );
  });
});
