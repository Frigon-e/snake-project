import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import ContactPage from "./contact";

test("Contact page renders correctly", () => {
  render(<ContactPage />);
  expect(
    screen.getByRole("heading", { level: 1, name: /contact page/i })
  ).toBeInTheDocument();
});
