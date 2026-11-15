import { useState, type SyntheticEvent } from "react";

import type { MessageKey } from "~/i18n/messages";
import { useI18n } from "~/i18n/provider";

type ValidationMessage = {
  [K in MessageKey]: import("~/i18n/messages").MessageArgs<K> extends [] ? K : never;
}[MessageKey];

// Keep the existing HTML constraints. Store message keys so changing language
// updates an open form's errors without resetting its uncontrolled fields.
export function useNativeValidation() {
  const { t } = useI18n();
  const [errors, setErrors] = useState<Record<string, ValidationMessage | undefined>>({});

  function field<T extends HTMLInputElement | HTMLSelectElement = HTMLInputElement>(
    name: string,
    fallback: ValidationMessage,
  ) {
    function update(input: T) {
      const message = input.validity.valid
        ? undefined
        : input.validity.valueMissing
          ? "validation.required"
          : fallback;
      setErrors((previous) => ({ ...previous, [name]: message }));
    }

    return {
      invalid: !!errors[name],
      errorMessage: errors[name] ? t(errors[name]) : undefined,
      onInvalid(event: SyntheticEvent<T>) {
        event.preventDefault();
        update(event.currentTarget);
      },
      onInput(event: SyntheticEvent<T>) {
        if (errors[name]) update(event.currentTarget);
      },
    };
  }

  return { field, reset: () => setErrors({}) };
}
