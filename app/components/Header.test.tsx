import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Header from "./Header";

test("Header component renders and handles user input", () => {
  const setSearchTerm = vi.fn();
  const setSelectedCategory = vi.fn();

  render(
    <Header
      searchTerm=""
      setSearchTerm={setSearchTerm}
      selectedCategory="all"
      setSelectedCategory={setSelectedCategory}
    />
  );

  // Check for logo text
  expect(screen.getByText("Exotic Scales")).toBeInTheDocument();

  // Check for search input
  const searchInput = screen.getByPlaceholderText("Search pets...");
  expect(searchInput).toBeInTheDocument();

  // Simulate typing in the search input
  fireEvent.change(searchInput, { target: { value: "python" } });
  expect(setSearchTerm).toHaveBeenCalledWith("python");

  // Check for category select
  const categorySelect = screen.getByRole("combobox");
  expect(categorySelect).toBeInTheDocument();

  // Simulate changing the category
  fireEvent.change(categorySelect, { target: { value: "snake" } });
  expect(setSelectedCategory).toHaveBeenCalledWith("snake");
});
