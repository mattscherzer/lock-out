import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Details } from "./Details.tsx";
import { metadata, rec, selectors } from "./testData.ts";

it("details chart the citywide timing as a labelled picture, with days compared per day", () => {
  render(
    <Details
      area={rec({ reports_12m: 41 })}
      selectors={selectors}
      metadata={metadata}
      onAbout={() => {}}
    />,
  );
  expect(screen.queryByRole("button", { name: /Evening/ })).toBeNull(); // not selectors: the shares cannot change an area's rating
  expect(
    screen.getByRole("img", {
      name: /Time of day: Morning 18%, Afternoon 29%, Evening 28%, Night 26%/,
    }),
  ).toBeTruthy();
  // 59% over four days, 16% over one, 25% over two
  expect(
    screen.getByRole("img", { name: "Day of the week: Mon–Thu 15%, Friday 16%, Weekend 12%" }),
  ).toBeTruthy();
});

it("the citywide label explains itself on tap", () => {
  render(<Details area={rec()} selectors={selectors} metadata={metadata} onAbout={() => {}} />);
  const tag = screen.getByRole("button", { name: "Citywide pattern" });
  expect(tag.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByText(/same for every area/)).toBeNull();
  fireEvent.click(tag);
  expect(tag.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText(/same for every area/)).toBeTruthy();
  fireEvent.click(tag);
  expect(screen.queryByText(/same for every area/)).toBeNull();
});

it("details show the report count and a way to the About page", () => {
  let about = 0;
  render(
    <Details
      area={rec({ reports_12m: 41 })}
      selectors={selectors}
      metadata={metadata}
      onAbout={() => about++}
    />,
  );
  expect(screen.getByText("41")).toBeTruthy();
  fireEvent.click(screen.getByRole("link", { name: "About the data" }));
  expect(about).toBe(1);
});

it("the area's own numbers sit under their own heading, apart from the citywide charts", () => {
  render(
    <Details
      area={rec({ reports_12m: 41 })}
      selectors={selectors}
      metadata={metadata}
      onAbout={() => {}}
    />,
  );
  const own = screen.getByRole("heading", { name: "This area's data" });
  expect(own.parentElement?.textContent).toContain("41");
  expect(
    screen
      .getByRole("heading", { name: "When bikes were last seen" })
      .parentElement?.parentElement?.contains(own),
  ).toBe(false);
});
