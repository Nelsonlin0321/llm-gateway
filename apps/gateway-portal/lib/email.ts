import { createElement } from "react";
import { render, toPlainText } from "react-email";

import VerificationEmail, {
  verificationEmailSubject,
} from "@/emails/verification-email";

export interface RenderVerificationEmailOptions {
  email: string;
  verificationUrl: string;
}

export async function renderVerificationEmail({
  email,
  verificationUrl,
}: RenderVerificationEmailOptions) {
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

export { verificationEmailSubject };
