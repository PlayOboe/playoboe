import { NextResponse } from "next/server";
import { CONTACT, SITE } from "@/lib/site";

const LIMITS = { name: 120, email: 200, phone: 40, reed: 80, message: 2000 } as const;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const order = {
    name: clean(payload.name, LIMITS.name),
    email: clean(payload.email, LIMITS.email),
    phone: clean(payload.phone, LIMITS.phone),
    reed: clean(payload.reed, LIMITS.reed),
    message: clean(payload.message, LIMITS.message),
  };

  const errors: Record<string, string> = {};
  if (order.name.length < 2) errors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(order.email)) {
    errors.email = "Please enter an email address we can reply to.";
  }
  if (order.message.length < 10) errors.message = "Please add a short note about your order.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDERS_TO_EMAIL || CONTACT.email;
  // Resend only accepts a from-address on a domain verified in the account. Until
  // playoboe.net is verified there, its shared sending domain is the working default.
  const from = process.env.ORDERS_FROM_EMAIL || "Play Oboe <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; order not delivered:", order);
    return NextResponse.json({ error: "Email is not configured." }, { status: 500 });
  }

  const rows = [
    ["Name", order.name],
    ["Email", order.email],
    ["Phone", order.phone || "—"],
    ["Reed preference", order.reed || "—"],
  ];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: order.email,
        subject: `Reed order — ${order.name}`,
        text:
          rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
          `\n\nOrder:\n${order.message}\n\nSent from ${SITE.url}`,
        html:
          rows
            .map(([k, v]) => `<p><strong>${k}:</strong> ${escapeHtml(v)}</p>`)
            .join("") +
          `<p><strong>Order:</strong></p><p>${escapeHtml(order.message).replace(/\n/g, "<br>")}</p>` +
          `<hr><p style="color:#667">Sent from ${SITE.url}</p>`,
      }),
    });

    if (!response.ok) {
      // Logged in full so an order is still recoverable from the deployment logs.
      console.error(
        `Resend rejected the order (${response.status}): ${await response.text()}`,
        order
      );
      return NextResponse.json({ error: "Could not send the enquiry." }, { status: 502 });
    }
  } catch (error) {
    console.error("Order could not be delivered:", error, order);
    return NextResponse.json({ error: "Could not send the enquiry." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
