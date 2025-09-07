import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Footer from "./Footer";

test("Footer component renders with correct text", () => {
  render(<Footer />);
  const textElement = screen.getByText(
    /© 2024 Exotic Pet Retailer. All rights reserved./i
  );
  expect(textElement).toBeInTheDocument();
});
