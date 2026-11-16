import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const shareRequest = z.object({
  courseSlug: z.string().min(1),
  lessonTitle: z.string().min(1),
  pdfBase64: z.string().min(1),
  documentKey: z.string().min(1)
});
export type ShareRequest = z.infer<typeof shareRequest>;

export function watermarkText(input: Pick<ShareRequest, "courseSlug" | "lessonTitle">): string {
  return `Course: ${input.courseSlug} | Lesson: ${input.lessonTitle} | External copy`;
}

export async function prepareExternalShare(input: unknown, client: InfraiClient, bucket: string): Promise<{ text: string; url: string }> {
  const parsed = shareRequest.parse(input);
  const text = watermarkText(parsed);
  await client.createBucket(bucket);
  const result = await client.watermark(parsed.pdfBase64, text);
  const pdf = result.pdf;
  if (!pdf) throw new Error("watermark response did not include a document reference");
  const upload = await client.presign(bucket, parsed.documentKey, "put");
  await client.uploadObject(upload.url, pdf);
  const signed = await client.presign(bucket, parsed.documentKey, "get");
  return { text, url: signed.url };
}
