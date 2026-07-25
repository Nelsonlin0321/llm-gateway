import { SendEmailCommand } from "@aws-sdk/client-ses";
import { createElement } from "react";
import { render, toPlainText } from "react-email";

import VerificationEmail, {
  verificationEmailSubject,
} from "@/emails/verification-email";
import { sesClient } from "@/lib/ses";

export interface SendVerificationEmailOptions {
  email: string;
  verificationUrl: string;
}

const EMAIL_FROM = process.env.EMAIL_FROM!;

async function renderVerificationEmail({
  email,
  verificationUrl,
}: SendVerificationEmailOptions) {
  const html = await render(
    createElement(VerificationEmail, {
      email,
      verificationUrl,
    }),
  );

  return {
    subject: verificationEmailSubject,
    html,
    text: toPlainText(html),
  };
}

export async function sendVerificationEmail({
  email,
  verificationUrl,
}: SendVerificationEmailOptions) {
  const { html, subject, text } = await renderVerificationEmail({
    email,
    verificationUrl,
  });

  return sesClient.send(
    new SendEmailCommand({
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
          Text: {
            Charset: "UTF-8",
            Data: text,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: EMAIL_FROM,
    }),
  );
}
