import { InfraiClient } from "./infrai_client.ts";
import { prepareExternalShare } from "./watermark_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example.");

const client = new InfraiClient(key);
const input = {
  courseSlug: "typescript-for-teachers",
  lessonTitle: "Release diagnostics",
  pdfBase64: process.env.SAMPLE_PDF_BASE64 ?? "JVBERi0xLjQKJcTl8uXrp/OgCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj5lbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHMgWzMgMCBSXS9Db3VudCAxPj5lbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94IFswIDAgMjAwIDIwMF0+PmVuZG9iago=",
  documentKey: "courses/typescript-for-teachers/release-diagnostics.pdf"
};
const result = await prepareExternalShare(input, client, "course-documents");
console.log(`Prepared ${result.text}; temporary link: ${result.url}`);
