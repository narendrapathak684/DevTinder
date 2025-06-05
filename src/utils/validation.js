const validator = require("validator");

// Allowed fields for profile editing
const ALLOWED_EDIT_FIELDS = ["firstname", "lastname", "age", "gender"];

// Validation rules for each field
const validationRules = {
  firstname: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: "First name can only contain letters and spaces",
  },
  lastname: {
    required: false,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    message: "Last name can only contain letters and spaces",
  },
  age: {
    required: false,
    min: 7,
    max: 100,
    message: "Age must be between 7 and 100",
  },
  gender: {
    required: false,
    allowedValues: ["male", "female", "other"],
    message: "Gender must be either male, female, or other",
  },
};

const validateProfileEdit = (data) => {
  const errors = {};
  const validatedData = {};

  // Check for disallowed fields
  const disallowedFields = Object.keys(data).filter(
    (field) => !ALLOWED_EDIT_FIELDS.includes(field)
  );
  if (disallowedFields.length > 0) {
    errors.disallowedFields = `Fields not allowed for editing: ${disallowedFields.join(
      ", "
    )}`;
  }

  // Validate each allowed field if present
  ALLOWED_EDIT_FIELDS.forEach((field) => {
    if (data[field] !== undefined) {
      const rules = validationRules[field];
      const value = data[field];

      // Required field check
      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        return;
      }

      // Skip validation if field is not required and not provided
      if (!rules.required && !value) {
        return;
      }

      // Validate based on field type
      switch (field) {
        case "firstname":
        case "lastname":
          if (
            value.length < rules.minLength ||
            value.length > rules.maxLength
          ) {
            errors[
              field
            ] = `${field} must be between ${rules.minLength} and ${rules.maxLength} characters`;
          } else if (!rules.pattern.test(value)) {
            errors[field] = rules.message;
          } else {
            validatedData[field] = value.trim();
          }
          break;

        case "age":
          if (
            !validator.isInt(value.toString(), {
              min: rules.min,
              max: rules.max,
            })
          ) {
            errors[field] = rules.message;
          } else {
            validatedData[field] = parseInt(value);
          }
          break;

        case "gender":
          if (!rules.allowedValues.includes(value.toLowerCase())) {
            errors[field] = rules.message;
          } else {
            validatedData[field] = value.toLowerCase();
          }
          break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedData,
  };
};

module.exports = {
  validateProfileEdit,
  ALLOWED_EDIT_FIELDS,
};
