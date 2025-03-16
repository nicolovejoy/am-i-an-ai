/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Badges from "./Badges";

describe("Badges", () => {
  it("renders all badges with correct links", () => {
    render(<Badges />);

    const badges = [
      { alt: "MIT License", url: "https://opensource.org/licenses/MIT" },
      { alt: "React", url: "https://reactjs.org/" },
      { alt: "TypeScript", url: "https://www.typescriptlang.org/" },
      { alt: "AWS", url: "https://aws.amazon.com/" },
      { alt: "Terraform", url: "https://www.terraform.io/" },
      { alt: "Next.js", url: "https://nextjs.org/" },
    ] as const;

    // Check for all badge images and their links
    badges.forEach(({ alt, url }) => {
      const img = screen.getByRole("img", { name: alt });
      expect(img).toBeInTheDocument();

      const link = img.closest("a");
      expect(link).toHaveAttribute("href", url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
