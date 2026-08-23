import "server-only";

import { Resend } from "resend";
import type { ContactSubmission } from "./contact-form";

const DEFAULT_CONTACT_RECIPIENT = "kodyepugh@alumni.stanford.edu";

type ContactDeliveryConfig = {
  apiKey: string;
  from: string;
  to: string;
};

export class ContactDeliveryUnavailableError extends Error {}

function getContactDeliveryConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ContactDeliveryConfig | null {
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.CONTACT_FROM_EMAIL?.trim();
  const to = environment.CONTACT_TO_EMAIL?.trim() || DEFAULT_CONTACT_RECIPIENT;

  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
}

function getContactMessageText(submission: ContactSubmission) {
  return [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Subject: ${submission.subject || "(No subject)"}`,
    "",
    submission.message,
  ].join("\n");
}

export async function sendContactEmail(submission: ContactSubmission) {
  const config = getContactDeliveryConfig();
  if (!config) {
    throw new ContactDeliveryUnavailableError(
      "Contact delivery is not configured.",
    );
  }

  const resend = new Resend(config.apiKey);
  const response = await resend.emails.send({
    from: config.from,
    to: config.to,
    replyTo: submission.email,
    subject: `Portfolio message from ${submission.name}`,
    text: getContactMessageText(submission),
  });

  if (response.error) {
    throw new Error("Contact delivery failed.");
  }
}
