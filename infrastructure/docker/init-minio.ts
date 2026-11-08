import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

async function initBucket(): Promise<void> {
  const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
  const region = process.env.S3_REGION || "us-east-1";
  const bucket = process.env.S3_BUCKET || "pathpulse-evidence";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || "pathpulse_admin";
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "pathpulse_secret_key";
  const origin = process.env.WEB_ORIGIN || "http://localhost:3000";

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" already exists.`);
  } catch (error: unknown) {
    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`Bucket "${bucket}" created successfully.`);
    } catch (createErr: unknown) {
      console.warn(`Could not create bucket "${bucket}":`, createErr);
    }
  }

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "HEAD"],
              AllowedOrigins: [origin, "http://localhost:3000"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
    console.log(`CORS rules applied to bucket "${bucket}" allowing PUT from ${origin}.`);
  } catch (corsErr: unknown) {
    console.warn(`Could not apply CORS configuration to "${bucket}":`, corsErr);
  }
}

if (require.main === module) {
  initBucket()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { initBucket };

