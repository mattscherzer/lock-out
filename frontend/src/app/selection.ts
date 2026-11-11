import type { Context } from "../search/types.ts";

export type Selection = {
  selected: string | null;
  cardOpen: boolean;
  pin: Context | null; // "you searched here"; only stations have coordinates
  highlighted: string | null; // the area under the arrow keys or pointer in the open search list
};
export type SelectionAction =
  | { type: "select"; id: string; context: Context | null }
  | { type: "clear" }
  | { type: "closeCard" }
  | { type: "highlight"; id: string | null };

export const initialSelection: Selection = {
  selected: null,
  cardOpen: false,
  pin: null,
  highlighted: null,
};

export function selection(state: Selection, action: SelectionAction): Selection {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.id, cardOpen: true, pin: action.context };
    case "clear":
      return { ...state, selected: null, cardOpen: false, pin: null };
    case "closeCard":
      return { ...state, cardOpen: false };
    case "highlight":
      return { ...state, highlighted: action.id };
  }
}
