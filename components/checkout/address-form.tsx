"use client";

import { subRegionsFor, type CountryConfig } from "@/lib/country";

export type AddressValues = Record<string, string>;

/**
 * Entirely schema-driven. Nigeria's State/LGA/landmark model is not Ghana's,
 * and hardcoding it here would guarantee a rewrite for the second country.
 */
export function AddressForm({
  config,
  values,
  errors,
  onChange,
}: {
  config: CountryConfig;
  values: AddressValues;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {config.addressSchema.map((field) => {
        const wide = field.type === "textarea" || field.name === "street" || field.name === "landmark";
        const options =
          field.optionsKey === "regions"
            ? config.regions
            : field.optionsKey === "subRegions"
              ? subRegionsFor(config, values.region || config.defaultRegion)
              : [];
        const error = errors[field.name];
        const id = `addr-${field.name}`;

        return (
          <div key={field.name} className={wide ? "sm:col-span-2" : ""}>
            <label htmlFor={id} className="mb-1 block text-small text-muted-foreground">
              {field.label}
              {field.required ? "" : ""}
            </label>

            {field.type === "select" ? (
              <select
                id={id}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-11 w-full rounded-md border px-2 text-body text-foreground ${
                  error ? "border-destructive" : "border-border"
                }`}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                id={id}
                rows={2}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-body text-foreground"
              />
            ) : (
              <input
                id={id}
                type={field.type === "tel" ? "tel" : "text"}
                inputMode={field.type === "tel" ? "tel" : undefined}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={field.helper ? `${id}-helper` : undefined}
                className={`h-11 w-full rounded-md border px-3 text-body text-foreground ${
                  error ? "border-destructive" : "border-border"
                }`}
              />
            )}

            {error ? (
              <p className="mt-1 text-small text-destructive">{error}</p>
            ) : field.helper ? (
              <p id={`${id}-helper`} className="mt-1 text-small text-subtle-foreground">
                {field.helper}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function validateAddress(config: CountryConfig, values: AddressValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of config.addressSchema) {
    const value = (values[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required`;
      continue;
    }
    if (field.type === "tel" && value && !config.phone.pattern.test(value.replace(/\s/g, ""))) {
      errors[field.name] = `Enter a valid ${config.name} mobile number, for example ${config.phone.example}`;
    }
  }
  return errors;
}
