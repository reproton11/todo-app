import "server-only";
import { Resend } from "resend";
import { APP_URL } from "@/lib/app-url";

const FROM = "TugasKu <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Fallback dev yang jujur: isi email ditulis ke log server, bukan disembunyikan
    console.log(`[EMAIL:FALLBACK] Kepada: ${to} | Subjek: ${subject} | Isi: ${stripTags(html)}`);
    return { delivered: false };
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({ from: FROM, to, subject, html });
  return { delivered: true };
}

type ReminderPayload = {
  name: string;
  title: string;
  dueLabel: string | null;
  description: string | null;
};

export async function sendReminderEmail(to: string, task: ReminderPayload) {
  const link = `${APP_URL}/tasks`;
  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:24px;background:#f0fdfa;font-family:Segoe UI,Arial,sans-serif;color:#134e4a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #bee8e3;border-radius:10px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #bee8e3;font-size:18px;font-weight:700;">
          Tugas<span style="color:#0d9488;">Ku</span>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 12px;">Halo ${escapeHtml(task.name)},</p>
          <p style="margin:0 0 12px;">Tugas ini mendekati atau melewati tenggat:</p>
          <p style="margin:0 0 8px;font-size:17px;font-weight:700;">${escapeHtml(task.title)}</p>
          ${task.dueLabel ? `<p style="margin:0 0 12px;color:#ea580c;font-weight:600;">Jatuh tempo: ${escapeHtml(task.dueLabel)}</p>` : ""}
          ${task.description ? `<p style="margin:0 0 12px;color:#4b6a65;">${escapeHtml(task.description)}</p>` : ""}
          <p style="margin:20px 0 0;">
            <a href="${link}" style="display:inline-block;background:#0d9488;color:#042f2e;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px;">Buka TugasKu</a>
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#4b6a65;">
            Pengingat ini aktif karena kamu menyalakan notifikasi email di Pengaturan.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return sendEmail(to, `TugasKu: Pengingat "${task.title}"`, html);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
