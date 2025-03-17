import "@testing-library/jest-dom";
import { metadata } from "./layout";

jest.mock("next/font/google", () => ({
  Inter: jest.fn().mockReturnValue({
    className: "mocked-inter-class",
  }),
}));

describe("RootLayout", () => {
  it("verifies favicon is included in metadata", () => {
    expect(metadata.icons).toBeDefined();
    expect(JSON.stringify(metadata.icons)).toContain("/favicon.svg");
  });
});
