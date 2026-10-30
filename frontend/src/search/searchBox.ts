import { parseQuery, searchRows } from "./places.ts";
import { note, row } from "./rows.ts";
import type { Areas, Index, Place } from "./types.ts";

type Entry = { el: HTMLLIElement; choose?: () => void };
type Options = {
  input: HTMLInputElement;
  list: HTMLElement;
  index: Index;
  areas: Areas;
  onSelect: (id: string, place: Place) => void;
  loadStreets?: () => Promise<unknown>;
};

// Dropdown search: type -> one row per matching place and area. onSelect(areaId, place) fires on choosing a row.
// loadStreets (optional) fetches the street data into index on focus and must reject on failure; a failed load is retried
// on the next focus, and the search reruns once the data is in.
export function createSearchBox({ input, list, index, areas, onSelect, loadStreets }: Options) {
  let options: (Entry & { choose: () => void })[] = []; // selectable entries
  let active = -1;

  const setActive = (i: number) => {
    active = i;
    options.forEach(({ el }, n) => {
      el.classList.toggle("active", n === i);
      el.setAttribute("aria-selected", String(n === i));
    });
    if (i >= 0) {
      input.setAttribute("aria-activedescendant", options[i].el.id);
      options[i].el.scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  };

  // entries without `choose` are notes: shown, not selectable
  const show = (entries: Entry[]) => {
    options = entries.filter((e): e is Entry & { choose: () => void } => !!e.choose);
    options.forEach(({ el }, n) => Object.assign(el, { id: `search-option-${n}`, role: "option" }));
    list.replaceChildren(...entries.map((e) => e.el));
    list.hidden = entries.length === 0;
    input.setAttribute("aria-expanded", String(!list.hidden));
    setActive(options.length ? 0 : -1);
  };

  const finish = (id: string, place: Place) => {
    input.value = place.label;
    show([]);
    onSelect(id, place);
  };

  const search = () => {
    const { text, houseNumber } = parseQuery(input.value);
    if (!text.trim()) return show([]);
    const rows = searchRows(index, text);
    show([
      ...(houseNumber ? [{ el: note("House numbers aren't searchable yet, showing the street.") }] : []),
      ...(rows.length ? rows.map((r) => ({ el: row(r, areas[r.id]), choose: () => finish(r.id, r.place) })) : [{ el: note(`No match for "${text.trim()}".`) }]),
    ]);
  };

  const onKey: Record<string, () => void> = {
    ArrowDown: () => setActive((active + 1) % options.length),
    ArrowUp: () => setActive((active - 1 + options.length) % options.length),
    Enter: () => options[active]?.choose(),
    Escape: () => show([]),
  };

  let loading: Promise<void> | undefined;
  input.addEventListener("focus", () => {
    if (!loadStreets || loading) return;
    loading = loadStreets().then(
      () => {
        if (input.value) search();
      },
      () => {
        loading = undefined;
      },
    );
  });
  input.addEventListener("input", search);
  input.addEventListener("blur", () => show([]));
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (!options.length && e.key !== "Escape") return;
    if (onKey[e.key]) {
      e.preventDefault();
      onKey[e.key]();
    }
  });
  list.addEventListener("mousedown", (e: MouseEvent) => {
    // mousedown, not click: the input's blur must not close the list first
    e.preventDefault();
    options.find(({ el }) => el === (e.target as Element).closest("li"))?.choose();
  });
}
