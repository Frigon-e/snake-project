import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { MemoryRouter } from "react-router-dom";

import PetCard from "./PetCard";
import type { Pet } from "../types/Pet";

const mockPet: Pet = {
  id: "1",
  name: "Test Snake",
  scientificName: "Testus Snakus",
  price: 100,
  origin: "Testland",
  size: "Medium",
  images: ["/test-snake.jpg"],
  category: "snake",
  description: "A test snake.",
  careDifficulty: "Easy",
  temperament: "Friendly",
  lifespan: "10 years",
  diet: "Mice",
};

test("PetCard component renders with correct pet data", () => {
  render(
    <MemoryRouter>
      <PetCard pet={mockPet} />
    </MemoryRouter>
  );

  expect(screen.getByText("Test Snake")).toBeInTheDocument();
  expect(screen.getByText("$100")).toBeInTheDocument();
  expect(screen.getByText(/Origin: Testland/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /view details/i })).toHaveAttribute(
    "href",
    "/pets/1"
  );
});
