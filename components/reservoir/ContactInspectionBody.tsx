"use client";

import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { siGithub } from "simple-icons";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import {
  type ContactFormErrors,
  validateContactSubmission,
} from "@/lib/contact-form";
import type { ContactSocialLink, Resource } from "@/types/content";

type ContactInspectionBodyProps = {
  resource: Resource;
};

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

type DeliveryState = "idle" | "submitting" | "success" | "failure";

const INITIAL_FORM_STATE: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

function getSocialIcon(link: ContactSocialLink) {
  const path = link.provider === "linkedin" ? faLinkedin.icon[4] : siGithub.path;
  return Array.isArray(path) ? path.join(" ") : path;
}

function getSocialLabel(link: ContactSocialLink) {
  return link.provider === "linkedin"
    ? "Open LinkedIn profile"
    : "Open GitHub profile";
}

export function ContactInspectionBody({
  resource,
}: ContactInspectionBodyProps) {
  const nameId = useId();
  const emailId = useId();
  const subjectId = useId();
  const messageId = useId();
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [deliveryState, setDeliveryState] = useState<DeliveryState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const contactContent = resource.content?.kind === "contact" ? resource.content : null;

  if (!contactContent) {
    return (
      <section className="inspection-contact inspection-contact--unavailable">
        <p className="artifact-window__section-index">Contact unavailable</p>
        <p>The Contact Resource is missing its approved contact configuration.</p>
      </section>
    );
  }

  function updateField(field: keyof ContactFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field as keyof ContactFormErrors]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (deliveryState !== "idle") {
      setDeliveryState("idle");
      setStatusMessage("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deliveryState === "submitting") return;

    const validation = validateContactSubmission(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      setDeliveryState("failure");
      setStatusMessage("Please correct the highlighted fields.");
      return;
    }

    setErrors({});
    setDeliveryState("submitting");
    setStatusMessage("Sending message…");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        error?: string;
        errors?: ContactFormErrors;
      };

      if (!response.ok) {
        setErrors(result.errors ?? {});
        setDeliveryState("failure");
        setStatusMessage(result.error ?? "Message delivery is unavailable.");
        return;
      }

      setForm(INITIAL_FORM_STATE);
      setDeliveryState("success");
      setStatusMessage("Thank you — your message has been sent.");
    } catch {
      setDeliveryState("failure");
      setStatusMessage("Message delivery is unavailable. Please try again later.");
    }
  }

  function describedBy(field: keyof ContactFormErrors) {
    return errors[field] ? `${fieldId(field)}-error` : undefined;
  }

  function fieldId(field: keyof ContactFormErrors) {
    return `${resource.id}-${field}`;
  }

  return (
    <section className="inspection-contact" data-inspection-contact-state={deliveryState}>
      <form className="inspection-contact__form" noValidate onSubmit={submit}>
        <div className="inspection-contact__field">
          <label htmlFor={nameId}>Name</label>
          <input
            id={nameId}
            name="name"
            autoComplete="name"
            required
            value={form.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            onChange={(event) => updateField("name", event.target.value)}
          />
          {errors.name ? <p id={fieldId("name")} className="inspection-contact__error">{errors.name}</p> : null}
        </div>

        <div className="inspection-contact__field">
          <label htmlFor={emailId}>Email</label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            onChange={(event) => updateField("email", event.target.value)}
          />
          {errors.email ? <p id={fieldId("email")} className="inspection-contact__error">{errors.email}</p> : null}
        </div>

        <div className="inspection-contact__field">
          <label htmlFor={subjectId}>Subject <span>(optional)</span></label>
          <input
            id={subjectId}
            name="subject"
            value={form.subject}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={describedBy("subject")}
            onChange={(event) => updateField("subject", event.target.value)}
          />
          {errors.subject ? <p id={fieldId("subject")} className="inspection-contact__error">{errors.subject}</p> : null}
        </div>

        <div className="inspection-contact__field">
          <label htmlFor={messageId}>Message</label>
          <textarea
            id={messageId}
            name="message"
            required
            rows={6}
            value={form.message}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message")}
            onChange={(event) => updateField("message", event.target.value)}
          />
          {errors.message ? <p id={fieldId("message")} className="inspection-contact__error">{errors.message}</p> : null}
        </div>

        <div className="inspection-contact__honeypot" aria-hidden="true">
          <label htmlFor={`${resource.id}-website`}>Website</label>
          <input
            id={`${resource.id}-website`}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </div>

        <button className="inspection-contact__submit" type="submit" disabled={deliveryState === "submitting"}>
          {deliveryState === "submitting" ? "Sending message" : "Send message"}
        </button>
        <p className="inspection-contact__status" aria-live="polite" role="status">
          {statusMessage}
        </p>
      </form>

      <nav className="inspection-contact__social-links" aria-label="Professional profiles">
        {contactContent.socialLinks.map((link) => {
          const icon = getSocialIcon(link);
          return (
            <a
              key={link.provider}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={getSocialLabel(link)}
              title={getSocialLabel(link)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={icon} fill="currentColor" />
              </svg>
            </a>
          );
        })}
      </nav>
    </section>
  );
}
