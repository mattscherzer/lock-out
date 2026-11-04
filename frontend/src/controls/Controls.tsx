import { Check } from "lucide-react";
import { useId, type ButtonHTMLAttributes } from "react";
import "./controls.css";

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: {
  variant?: "primary" | "tonal" | "outlined" | "text";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`btn btn-${variant} label-lg ${className}`} {...rest} />;
}

const LIST = {
  chip: "gap-2",
  segmented: "choice-list-segmented gap-1 rounded-md bg-secondary-container p-1",
};

// Single choice from a list. Native radios give grouping and arrow keys; the checked option shows a check mark and a 2px border, not colour alone.
export function Choice({
  label,
  options,
  value,
  onChange,
  variant = "chip",
  pattern,
}: {
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  variant?: "chip" | "segmented";
  pattern?: string; // the selector's "citywide pattern" label (D-18)
}) {
  const id = useId();
  return (
    <fieldset
      className="m-0 min-w-0 border-0 p-0"
      aria-describedby={pattern ? `${id}-pattern` : undefined}
    >
      <legend className="sr-only">{label}</legend>
      <div className={`flex flex-wrap ${LIST[variant]}`}>
        {options.map((o) => (
          <label key={o.value} className="choice label-lg">
            <input
              className="absolute inset-0 m-0 cursor-[inherit] opacity-0"
              type="radio"
              name={id}
              value={o.value}
              checked={o.value === value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
            />
            <Check aria-hidden size={16} strokeWidth={2.5} />
            {o.label}
          </label>
        ))}
      </div>
      {pattern && (
        <p id={`${id}-pattern`} className="mt-2 mb-0 body-sm text-on-surface-variant">
          {pattern}
        </p>
      )}
    </fieldset>
  );
}
