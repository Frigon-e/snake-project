import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import PetsPage from "./pets";

test("Pets page renders correctly", () => {
  render(<PetsPage />);
  expect(
    screen.getByRole("heading", { level: 1, name: /pets page/i })
  ).toBeInTheDocument();
});
