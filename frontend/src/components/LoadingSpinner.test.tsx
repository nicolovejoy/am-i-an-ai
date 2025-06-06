import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoadingSpinner, FullPageLoader, CenterLoader, ButtonLoader } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders with text", () => {
    render(<LoadingSpinner text="Loading test..." />);
    expect(screen.getByText("Loading test...")).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByTestId("loading-spinner")).toHaveClass("h-4", "w-4");

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByTestId("loading-spinner")).toHaveClass("h-12", "w-12");
  });

  it("applies color classes correctly", () => {
    const { rerender } = render(<LoadingSpinner color="blue" />);
    expect(screen.getByTestId("loading-spinner")).toHaveClass("border-blue-500");

    rerender(<LoadingSpinner color="white" />);
    expect(screen.getByTestId("loading-spinner")).toHaveClass("border-white");
  });
});

describe("FullPageLoader", () => {
  it("renders with default text", () => {
    render(<FullPageLoader />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<FullPageLoader text="Custom loading text" />);
    expect(screen.getByText("Custom loading text")).toBeInTheDocument();
  });
});

describe("CenterLoader", () => {
  it("renders without text", () => {
    render(<CenterLoader />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders with text", () => {
    render(<CenterLoader text="Center loading" />);
    expect(screen.getByText("Center loading")).toBeInTheDocument();
  });
});

describe("ButtonLoader", () => {
  it("renders button-sized loader", () => {
    render(<ButtonLoader />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("h-4", "w-4", "border-white");
  });
});