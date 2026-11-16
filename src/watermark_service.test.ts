import test from "node:test";
import assert from "node:assert/strict";
import { watermarkText, shareRequest } from "./watermark_service.ts";

test("external course copies carry a teacher-readable watermark", () => {
  const input = shareRequest.parse({ courseSlug: "math-101", lessonTitle: "Week 2", pdfBase64: "pdf", documentKey: "math/week-2.pdf" });
  assert.equal(watermarkText(input), "Course: math-101 | Lesson: Week 2 | External copy");
});
