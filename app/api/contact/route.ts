import { NextResponse } from "next/server";
import { Resend } from "resend";

const MAX_MESSAGE = 10_000;

function getResend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    return new Resend(key);
}

export async function POST(request: Request) {
    const resend = getResend();
    if (!resend) {
        return NextResponse.json(
            { error: "Email delivery is not configured (missing RESEND_API_KEY)." },
            { status: 503 }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { name, email, subject, message, company } = body as Record<
        string,
        unknown
    >;

    if (typeof company === "string" && company.trim() !== "") {
        return NextResponse.json({ ok: true });
    }

    if (typeof message !== "string" || !message.trim()) {
        return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const trimmed = message.trim();
    if (trimmed.length > MAX_MESSAGE) {
        return NextResponse.json(
            { error: `Message must be at most ${MAX_MESSAGE} characters.` },
            { status: 400 }
        );
    }

    const nameStr = typeof name === "string" ? name.trim().slice(0, 200) : "";
    const emailStr = typeof email === "string" ? email.trim().slice(0, 320) : "";
    const subjectStr =
        typeof subject === "string" && subject.trim()
            ? subject.trim().slice(0, 200)
            : "Message from DevWallah";

    const to =
        process.env.CONTACT_TO_EMAIL?.trim() || "kaushiktripathi847@gmail.com";
    const from =
        process.env.RESEND_FROM?.trim() || "DevWallah <onboarding@resend.dev>";

    const textLines: string[] = [];
    if (nameStr) textLines.push(`Name: ${nameStr}`);
    if (emailStr) textLines.push(`Reply-to: ${emailStr}`);
    if (textLines.length) textLines.push("");
    textLines.push(trimmed);
    const text = textLines.join("\n");

    const sendPayload: Parameters<typeof resend.emails.send>[0] = {
        from,
        to,
        subject: subjectStr,
        text,
    };

    if (emailStr && emailStr.includes("@")) {
        sendPayload.replyTo = emailStr;
    }

    const { data, error } = await resend.emails.send(sendPayload);

    if (error) {
        console.error("[contact]", error);
        return NextResponse.json(
            { error: "Could not send your message. Please try again later." },
            { status: 502 }
        );
    }

    return NextResponse.json({ ok: true, id: data?.id });
}
