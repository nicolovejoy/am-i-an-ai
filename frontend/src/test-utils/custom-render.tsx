import React from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "../contexts/AuthContext";
import { act } from "@testing-library/react";

async function customRender(
  ui: React.ReactElement,
  { delay = 0, ...renderOptions }: RenderOptions & { delay?: number } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  let rendered: ReturnType<typeof rtlRender>;

  // Wrap the initial render in act
  await act(async () => {
    rendered = rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
  });

  // Only wait if a delay is specified
  if (delay > 0) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
    });
  }

  return rendered!;
}

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
