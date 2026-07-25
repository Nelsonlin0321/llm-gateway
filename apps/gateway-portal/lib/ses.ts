import { SESClient } from "@aws-sdk/client-ses";

export const sesClient = new SESClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

export default sesClient;
