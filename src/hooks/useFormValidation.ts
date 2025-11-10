
import { useState } from "react";

interface FormErrors {
  [key: string]: string;
}

export function useFormValidation<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle special input types
    let processedValue: any = value;
    if (type === 'number') {
      // Convert to number if it's a valid number, otherwise keep as string for validation
      const numericValue = parseFloat(value);
      processedValue = value === '' ? '' : (isNaN(numericValue) ? value : numericValue);
    }
     
    setValues((prev) => ({ ...prev, [name]: processedValue }));
    validateField(name, processedValue);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name: string, value: any) => {
    let error = '';

    // Check if field is required
    if (value === '' || value === null || value === undefined) {
      error = 'This field is required';
    }

    // Update errors
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error === '';
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: FormErrors = {};
    const newTouched: Record<string, boolean> = {};

    // Validate all fields
    Object.keys(values).forEach((key) => {
      newTouched[key] = true;
      if (!validateField(key, values[key])) {
        isValid = false;
        newErrors[key] = errors[key] || 'This field is required';
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);
    
    return isValid;
  };

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const setMultipleValues = (newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
    Object.entries(newValues).forEach(([name, value]) => {
      validateField(name as string, value);
    });
  };

  const setFormErrors = (newErrors: FormErrors) => {
    setErrors(newErrors);
  };

  const setTouchedFields = (newTouched: Record<string, boolean>) => {
    setTouched(newTouched);
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    setMultipleValues,
    setErrors: setFormErrors,
    setTouched: setTouchedFields,
    validateForm,
    resetForm,
  };
}
