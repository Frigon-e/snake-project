import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import IndexPage from "./_index";

test("Index page renders correctly", () => {
  render(<IndexPage />);
  expect(
    screen.getByRole("heading", { level: 1, name: /home page/i })
  ).toBeInTheDocument();
});
