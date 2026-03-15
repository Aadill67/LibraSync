import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/* ─── Transporter ──────────────────────────────────────── */
let transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("📧 Ethereal email account:", testAccount.user);
  }
};

initTransporter().catch((err) =>
  console.warn("⚠️ Email transporter init failed:", err.message)
);

/* ─── Send Mail Helper ─────────────────────────────────── */
export const sendMail = async (to, subject, html) => {
  try {
    if (!transporter) await initTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LibraSync Library" <noreply@librasync.com>',
      to,
      subject,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log("📧 Preview:", previewUrl);
    return info;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return null;
  }
};

/* ─── Professional HTML Email Template Wrapper ─────────── */
const wrapTemplate = (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>LibraSync</title>
  <!--[if mso]>
  <style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0c1222;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0c1222">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-block;line-height:52px;font-size:24px;margin-bottom:12px">📚</div>
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px">LibraSync</h1>
                    <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;font-weight:500">Library Management System</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#1e293b;padding:36px 40px;border-left:1px solid rgba(148,163,184,0.1);border-right:1px solid rgba(148,163,184,0.1)">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#151d2e;border-radius:0 0 16px 16px;padding:24px 40px;border:1px solid rgba(148,163,184,0.08);border-top:none;text-align:center">
              <p style="color:#64748b;font-size:12px;margin:0 0 8px;line-height:1.5">
                This is an automated notification from LibraSync.<br>
                Please do not reply to this email.
              </p>
              <p style="color:#475569;font-size:11px;margin:0">
                © ${new Date().getFullYear()} LibraSync • All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/* ─── Action Button Component ──────────────────────────── */
const actionButton = (text, url, color = "#6366f1") => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0">
    <tr>
      <td align="center">
        <a href="${url}" target="_blank" style="display:inline-block;background:${color};color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">${text}</a>
      </td>
    </tr>
  </table>
`;

/* ─── Info Card Component ──────────────────────────────── */
const infoCard = (emoji, title, details, borderColor = "rgba(99,102,241,0.3)", bgColor = "rgba(99,102,241,0.08)") => `
  <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:12px;padding:20px;margin:20px 0">
    <p style="margin:0;font-weight:700;font-size:16px;color:#f1f5f9">${emoji} ${title}</p>
    ${details}
  </div>
`;

/* ─── Email Templates ──────────────────────────────────── */

export const sendIssueConfirmation = async (email, userName, bookName, dueDate) => {
  const html = wrapTemplate(`
    <h2 style="color:#818cf8;margin:0 0 16px;font-size:22px;font-weight:700">Book Issued Successfully ✅</h2>
    <p style="color:#f1f5f9;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${userName}</strong>,</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0">You have been issued the following book:</p>
    ${infoCard("📖", bookName,
      `<p style="margin:10px 0 0;color:#94a3b8;font-size:14px">Due Date: <strong style="color:#f59e0b">${new Date(dueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong></p>`
    )}
    <p style="color:#94a3b8;font-size:14px;line-height:1.6">Please return the book on or before the due date to avoid fines (₹5/day overdue).</p>
  `, `Book "${bookName}" issued to ${userName}`);
  return sendMail(email, `📖 Book Issued: ${bookName}`, html);
};

export const sendOverdueReminder = async (email, userName, bookName, daysOverdue, fine) => {
  const html = wrapTemplate(`
    <h2 style="color:#ef4444;margin:0 0 16px;font-size:22px;font-weight:700">⚠️ Overdue Book Reminder</h2>
    <p style="color:#f1f5f9;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${userName}</strong>,</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0">The following book is <strong style="color:#ef4444">${daysOverdue} days overdue</strong>:</p>
    ${infoCard("📖", bookName,
      `<p style="margin:10px 0 0;color:#f87171;font-size:15px">Current Fine: <strong style="font-size:18px">₹${fine}</strong></p>`,
      "rgba(239,68,68,0.3)", "rgba(239,68,68,0.08)"
    )}
    <p style="color:#94a3b8;font-size:14px;line-height:1.6">Please return the book as soon as possible to minimize fines (₹5/day).</p>
  `, `OVERDUE: ${bookName} — ₹${fine} fine`);
  return sendMail(email, `⚠️ Overdue: ${bookName} — ₹${fine} fine`, html);
};

export const sendReservationAvailable = async (email, userName, bookName) => {
  const html = wrapTemplate(`
    <h2 style="color:#10b981;margin:0 0 16px;font-size:22px;font-weight:700">🎉 Reserved Book Available!</h2>
    <p style="color:#f1f5f9;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${userName}</strong>,</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0">Great news! The book you reserved is now available for pickup:</p>
    ${infoCard("📖", bookName, "", "rgba(16,185,129,0.3)", "rgba(16,185,129,0.08)")}
    <p style="color:#94a3b8;font-size:14px;line-height:1.6">Please visit the library to collect your book. The reservation will be held for <strong style="color:#f1f5f9">3 days</strong>.</p>
  `, `Book "${bookName}" is now available`);
  return sendMail(email, `🎉 Available: ${bookName} — Ready for Pickup`, html);
};

export const sendFineReceipt = async (email, userName, bookName, fineAmount) => {
  const html = wrapTemplate(`
    <h2 style="color:#f59e0b;margin:0 0 16px;font-size:22px;font-weight:700">Book Returned with Fine</h2>
    <p style="color:#f1f5f9;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${userName}</strong>,</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0">Your book has been returned successfully:</p>
    ${infoCard("📖", bookName,
      `<p style="margin:10px 0 0;color:#fbbf24;font-size:15px">Fine Charged: <strong style="font-size:18px">₹${fineAmount}</strong></p>`,
      "rgba(245,158,11,0.3)", "rgba(245,158,11,0.08)"
    )}
    <p style="color:#94a3b8;font-size:14px;line-height:1.6">Thank you for using LibraSync! 📚</p>
  `, `Return receipt for "${bookName}"`);
  return sendMail(email, `📋 Return Receipt: ${bookName}`, html);
};

export const sendPasswordResetEmail = async (email, userName, resetUrl) => {
  const html = wrapTemplate(`
    <h2 style="color:#818cf8;margin:0 0 16px;font-size:22px;font-weight:700">🔐 Password Reset Request</h2>
    <p style="color:#f1f5f9;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${userName}</strong>,</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0">We received a request to reset your password. Click the button below to create a new one:</p>
    ${actionButton("Reset My Password", resetUrl)}
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin:16px 0">
      <p style="margin:0;color:#fbbf24;font-size:13px;font-weight:600">⏰ This link expires in 1 hour</p>
    </div>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:16px 0 0">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
    <p style="color:#64748b;font-size:12px;margin:12px 0 0;word-break:break-all">Direct link: <a href="${resetUrl}" style="color:#818cf8">${resetUrl}</a></p>
  `, "Password reset requested for your LibraSync account");
  return sendMail(email, `🔐 LibraSync — Password Reset`, html);
};
