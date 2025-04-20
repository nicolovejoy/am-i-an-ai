import React from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "../contexts/AuthContext";
import { act } from "@testing-library/react";

async function customRender(
  ui: React.ReactElement,
  { ...renderOptions }: RenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  const rendered = rtlRender(ui, { wrapper: Wrapper, ...renderOptions });

  // Wait for any pending state updates
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return rendered;
}

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
