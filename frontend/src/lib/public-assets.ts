const PUBLIC_ASSETS_BUCKET = 'public-assets';

export function publicBucketStorageUrl(bucket: string, objectPath: string): string {
  const raw = import.meta.env.VITE_SUPABASE_URL;
  if (!raw?.trim()) {
    return '';
  }
  const base = raw.replace(/\/+$/, '');
  const bucketName = bucket.replace(/^\/+|\/+$/g, '');
  const path = objectPath.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/${bucketName}/${path}`;
}

export function publicStorageUrl(objectPath: string): string {
  return publicBucketStorageUrl(PUBLIC_ASSETS_BUCKET, objectPath);
}
