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
    <fieldset className="choices" aria-describedby={pattern ? `${id}-pattern` : undefined}>
      <legend className="sr-only">{label}</legend>
      <div className={`choice-list choice-list-${variant}`}>
        {options.map((o) => (
          <label key={o.value} className="choice label-lg">
            <input
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
        <p id={`${id}-pattern`} className="choices-pattern body-sm">
          {pattern}
        </p>
      )}
    </fieldset>
  );
}
