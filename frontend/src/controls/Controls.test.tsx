import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Button, Choice } from "./Controls.tsx";

const options = [
  { value: "a", label: "Morning" },
  { value: "b", label: "Night" },
  { value: "c", label: "Late", disabled: true },
];

it("groups the options, marks the selected one and reports changes", () => {
  const onChange = vi.fn();
  render(
    <Choice
      label="Time of day"
      options={options}
      value="a"
      onChange={onChange}
      pattern="Most thefts happen at night"
    />,
  );
  const group = screen.getByRole("group", { name: "Time of day" });
  expect(group.getAttribute("aria-describedby")).toBe(
    screen.getByText("Most thefts happen at night").id,
  );
  expect((screen.getByLabelText("Morning") as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByLabelText("Night"));
  expect(onChange).toHaveBeenCalledWith("b");
  expect((screen.getByLabelText("Late") as HTMLInputElement).disabled).toBe(true);
});

it("disabled button does not fire", () => {
  const onClick = vi.fn();
  render(
    <Button variant="tonal" disabled onClick={onClick}>
      Go
    </Button>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(onClick).not.toHaveBeenCalled();
});
