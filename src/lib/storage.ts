import { supabase } from "./supabase";

export type UploadFileOptions = {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
};

export async function uploadFile({
  bucket,
  path,
  file,
  upsert = false,
}: UploadFileOptions) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert,
    });

  if (error) throw error;

  return data;
}

export function getPublicFileUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function removeFile(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);

  if (error) throw error;

  return data;
}
