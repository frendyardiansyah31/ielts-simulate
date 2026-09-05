"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface FormInputFieldProps<TFieldValues extends FieldValues> {
  id: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}

export function FormInputField<TFieldValues extends FieldValues>({
  id,
  name,
  control,
  label,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
}: FormInputFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value ?? ""}
            onChange={(e) => {
              // type="number" fields deliver a real number to RHF state so
              // the zod schema can stay `z.number()` (no coerce needed).
              if (type === "number") {
                const parsed = e.target.valueAsNumber;
                field.onChange(Number.isNaN(parsed) ? undefined : parsed);
              } else {
                field.onChange(e.target.value);
              }
            }}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
