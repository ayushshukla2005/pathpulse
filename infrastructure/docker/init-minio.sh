#!/bin/sh
set -e

ENDPOINT="${S3_ENDPOINT:-http://minio:9000}"
ACCESS_KEY="${S3_ACCESS_KEY_ID:-${MINIO_ROOT_USER:-pathpulse_admin}}"
SECRET_KEY="${S3_SECRET_ACCESS_KEY:-${MINIO_ROOT_PASSWORD:-pathpulse_secret_key}}"
BUCKET="${S3_BUCKET:-pathpulse-evidence}"
ORIGIN="${WEB_ORIGIN:-http://localhost:3000}"

until mc alias set local "$ENDPOINT" "$ACCESS_KEY" "$SECRET_KEY"; do
  echo "Waiting for MinIO at $ENDPOINT..."
  sleep 1
done

if ! mc ls local/"$BUCKET" > /dev/null 2>&1; then
  mc mb local/"$BUCKET"
  echo "Bucket $BUCKET created."
else
  echo "Bucket $BUCKET already exists."
fi

cat <<EOF > /tmp/cors.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedOrigins": ["$ORIGIN", "http://localhost:3000"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

mc cors set local/"$BUCKET" /tmp/cors.json || true
echo "CORS configured for $BUCKET."

