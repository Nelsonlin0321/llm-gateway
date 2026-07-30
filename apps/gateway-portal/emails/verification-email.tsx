import type { CSSProperties } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

export interface VerificationEmailProps {
  email: string;
  verificationUrl: string;
}

const defaultProps: VerificationEmailProps = {
  email: "example@example.com",
  verificationUrl: "https://example.com/verify",
};

export const verificationEmailSubject = "Verify your email for Gateway Portal";

const previewText = "Verify your email to continue to Gateway Portal.";

const styles = {
  body: {
    margin: 0,
    padding: "32px 16px",
    backgroundColor: "#050608",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  outer: {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
  },
  shell: {
    backgroundColor: "#0d0f14",
    border: "1px solid #1e222b",
    borderRadius: "28px",
    overflow: "hidden",
  },
  shellTop: {
    padding: "18px 24px",
    borderBottom: "1px solid #1e222b",
    backgroundColor: "#0d0f14",
  },
  chromeDots: {
    fontSize: "12px",
    lineHeight: "12px",
    letterSpacing: "4px",
    color: "#7c8190",
    margin: "0",
  },
  routeTag: {
    margin: "0",
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Menlo, monospace',
    fontSize: "11px",
    lineHeight: "16px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#7c8190",
  },
  hero: {
    padding: "24px",
    background:
      "linear-gradient(180deg, rgba(13,15,20,1) 0%, rgba(4,18,32,1) 100%)",
  },
  infoBadge: {
    display: "inline-block",
    margin: "0 0 16px",
    padding: "7px 12px",
    borderRadius: "999px",
    backgroundColor: "#041220",
    color: "#84c6ff",
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Menlo, monospace',
    fontSize: "11px",
    lineHeight: "14px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  eyebrow: {
    margin: "0 0 12px",
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Menlo, monospace',
    fontSize: "11px",
    lineHeight: "16px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#7c8190",
  },
  heading: {
    margin: "0 0 14px",
    fontFamily: "Outfit, Inter, system-ui, sans-serif",
    fontSize: "34px",
    lineHeight: "36px",
    fontWeight: 600,
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  copy: {
    margin: "0 0 14px",
    fontSize: "15px",
    lineHeight: "26px",
    color: "#d8d9de",
  },
  emailPill: {
    display: "inline-block",
    margin: "0",
    padding: "9px 14px",
    borderRadius: "14px",
    backgroundColor: "#1e222b",
    border: "1px solid #373b47",
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    wordBreak: "break-word",
  },
  ctaWrap: {
    padding: "0 24px 24px",
  },
  ctaCard: {
    padding: "20px",
    borderRadius: "24px",
    border: "1px solid #1e222b",
    backgroundColor: "#1e222b",
  },
  ctaHeading: {
    margin: "0 0 10px",
    fontFamily: "Outfit, Inter, system-ui, sans-serif",
    fontSize: "24px",
    lineHeight: "28px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#ffffff",
  },
  button: {
    display: "inline-block",
    marginTop: "4px",
    marginBottom: "14px",
    borderRadius: "12px",
    backgroundColor: "#0a84ff",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "14px",
    textDecoration: "none",
    padding: "14px 20px",
  },
  helper: {
    margin: "0",
    fontSize: "13px",
    lineHeight: "22px",
    color: "#7c8190",
  },
  helperLink: {
    color: "#84c6ff",
    fontSize: "13px",
    lineHeight: "22px",
    wordBreak: "break-all",
    textDecoration: "underline",
  },
  notesWrap: {
    padding: "0 24px 24px",
  },
  noteTitle: {
    margin: "0 0 8px",
    fontFamily: "Outfit, Inter, system-ui, sans-serif",
    fontSize: "18px",
    lineHeight: "22px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#ffffff",
  },
  footerCopy: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "24px",
    color: "#d8d9de",
  },
} satisfies Record<string, CSSProperties>;

export default function VerificationEmail({
  email = defaultProps.email,
  verificationUrl = defaultProps.verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.shell}>
            <Section style={styles.shellTop}>
              <Text style={styles.chromeDots}>● ● ●</Text>
              <Text style={styles.routeTag}>/auth/verify-email</Text>
            </Section>

            <Section style={styles.hero}>
              <Text style={styles.infoBadge}>Gateway Portal verification</Text>
              <Text style={styles.eyebrow}>{verificationEmailSubject}</Text>
              <Heading as="h1" style={styles.heading}>
                Verify your email
              </Heading>
              <Text style={styles.copy}>
                Continue with <strong>{email}</strong>.
              </Text>
              <Text style={styles.emailPill}>{email}</Text>
            </Section>

            <Section style={styles.ctaWrap}>
              <Section style={styles.ctaCard}>
                <Heading as="h2" style={styles.ctaHeading}>
                  Confirm email
                </Heading>
                <Text style={styles.copy}>
                  This link expires in 15 minutes.
                </Text>
                <Button href={verificationUrl} style={styles.button}>
                  Verify email
                </Button>
                <Text style={styles.helper}>
                  If the button does not work, use this link:
                </Text>
                <Link href={verificationUrl} style={styles.helperLink}>
                  {verificationUrl}
                </Link>
              </Section>
            </Section>

            <Section style={styles.notesWrap}>
              <Heading as="h2" style={styles.noteTitle}>
                Not you?
              </Heading>
              <Text style={styles.footerCopy}>
                You can ignore this email if you did not request it.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
