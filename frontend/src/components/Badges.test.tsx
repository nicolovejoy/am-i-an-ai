/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Badges from "./Badges";

describe("Badges", () => {
  it("renders all badges correctly", () => {
    render(<Badges />);

    const badges = [
      { alt: "Next.js Badge" },
      { alt: "TypeScript Badge" },
      { alt: "React Badge" },
      { alt: "Tailwind CSS Badge" },
      { alt: "AWS Badge" },
    ] as const;

    // Check for all badge images
    badges.forEach(({ alt }) => {
      const img = screen.getByRole("img", { name: alt });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "120");
      expect(img).toHaveAttribute("height", "28");
    });
  });
});
