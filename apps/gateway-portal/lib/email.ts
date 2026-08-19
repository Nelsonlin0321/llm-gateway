import { SendEmailCommand } from "@aws-sdk/client-ses";
import { createElement } from "react";
import { render, toPlainText } from "react-email";

import InvitationEmail, {
  invitationEmailSubject,
} from "@/emails/invitation-email";
import VerificationEmail, {
  verificationEmailSubject,
} from "@/emails/verification-email";
import { sesClient } from "@/lib/ses";
import { Role } from "./organization/permissions";

export interface SendVerificationEmailOptions {
  email: string;
  verificationUrl: string;
}

export interface SendInvitationEmailOptions {
  email: string;
  inviterName: string;
  organizationName: string;
  roleLabel: Role;
  invitationUrl: string;
}

const EMAIL_FROM = process.env.EMAIL_FROM!;

async function sendHtmlEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  return sesClient.send(
    new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
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

export async function sendVerificationEmail({
  email,
  verificationUrl,
}: SendVerificationEmailOptions) {
  const html = await render(
    createElement(VerificationEmail, {
      email,
      verificationUrl,
    }),
  );

  return sendHtmlEmail({
    to: email,
    subject: verificationEmailSubject,
    html,
    text: toPlainText(html),
  });
}

export async function sendInvitationEmail({
  email,
  inviterName,
  organizationName,
  roleLabel,
  invitationUrl,
}: SendInvitationEmailOptions) {
  const html = await render(
    createElement(InvitationEmail, {
      email,
      inviterName,
      organizationName,
      roleLabel,
      invitationUrl,
    }),
  );

  return sendHtmlEmail({
    to: email,
    subject: invitationEmailSubject(organizationName),
    html,
    text: toPlainText(html),
  });
}
