export const CONTACT_FIELD_LIMITS = {
  name: 120,
  email: 254,
  subject: 180,
  message: 5000,
} as const;

export type ContactSubmissionInput = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
};

export type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactFormErrors = Partial<
  Record<"name" | "email" | "subject" | "message" | "form", string>
>;

export type ContactSubmissionValidation =
  | { valid: true; value: ContactSubmission }
  | { valid: false; errors: ContactFormErrors };

function readField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function containsUnsafeHeaderCharacters(value: string) {
  return /[\r\n]/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateContactSubmission(
  input: ContactSubmissionInput,
): ContactSubmissionValidation {
  const name = readField(input.name);
  const email = readField(input.email);
  const subject = readField(input.subject);
  const message = readField(input.message);
  const honeypot = readField(input.website);
  const errors: ContactFormErrors = {};

  if (!name) {
    errors.name = "Enter your name.";
  } else if (
    name.length > CONTACT_FIELD_LIMITS.name ||
    containsUnsafeHeaderCharacters(name)
  ) {
    errors.name = "Enter a valid name.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (
    email.length > CONTACT_FIELD_LIMITS.email ||
    containsUnsafeHeaderCharacters(email) ||
    !isValidEmail(email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (
    subject.length > CONTACT_FIELD_LIMITS.subject ||
    containsUnsafeHeaderCharacters(subject)
  ) {
    errors.subject = "Use a shorter subject without line breaks.";
  }

  if (!message) {
    errors.message = "Enter a message.";
  } else if (message.length > CONTACT_FIELD_LIMITS.message) {
    errors.message = "Use a shorter message.";
  }

  if (honeypot) {
    errors.form = "Unable to send this message.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: { name, email, subject, message },
  };
}
