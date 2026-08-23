import { sendContactEmail } from "@/lib/contact-delivery";
import {
  type ContactSubmissionInput,
  validateContactSubmission,
} from "@/lib/contact-form";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Please submit a valid message." },
      { status: 400 },
    );
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json(
      { error: "Please submit a valid message." },
      { status: 400 },
    );
  }

  const validation = validateContactSubmission(input as ContactSubmissionInput);
  if (!validation.valid) {
    return Response.json(
      {
        error: "Please correct the highlighted fields.",
        errors: validation.errors,
      },
      { status: 400 },
    );
  }

  try {
    await sendContactEmail(validation.value);
    return Response.json({ ok: true }, { status: 202 });
  } catch {
    return Response.json(
      { error: "Message delivery is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
