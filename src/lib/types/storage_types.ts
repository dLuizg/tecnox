export type UploadFileOptions = {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
};
