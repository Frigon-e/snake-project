import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

test("Card component renders with all parts", () => {
  render(
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );

  expect(screen.getByText("Card Title")).toBeInTheDocument();
  expect(screen.getByText("Card Description")).toBeInTheDocument();
  expect(screen.getByText("Card Content")).toBeInTheDocument();
  expect(screen.getByText("Card Footer")).toBeInTheDocument();
});
