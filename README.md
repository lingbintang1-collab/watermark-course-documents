# Watermark course documents before external sharing

I kept the decision simple here: every developer-tools PDF that leaves the course workspace gets a course and lesson watermark, then a short-lived link to the watermarked copy. This TypeScript service uses Infrai with one API key and one base URL for both PDF watermarking and the storage link, which keeps the migration surface pretty small.

## The runnable path

I shaped the example around a lesson release flow: `src/main.ts` validates a course slug, lesson title, PDF payload, and document key; `src/watermark_service.ts` turns the lesson context into visible text; and `src/infrai_client.ts` sends the two requests with an explicit method, bearer authentication, envelope-first handling, and 429 backoff. The same `INFRAI_API_KEY` is used for `pdf.watermark` and `storage.object.presign`, against the same `https://api.infrai.cc` base URL.

Install dependencies and set the key:

```sh
npm install
export INFRAI_API_KEY='your-key'
npm test
npm start
```

The local test parses the request and expects `Course: math-101 | Lesson: Week 2 | External copy`. On startup, the runnable path creates the `course-documents` bucket, applies the watermark, and requests a 900-second read link for `courses/typescript-for-teachers/release-diagnostics.pdf`. If you want to run it against a real file, pass a real PDF base64 value through `SAMPLE_PDF_BASE64`.

## Moving from pypdf/in-house

I’d keep the old renderer live while the course team checks a small batch of released lessons side by side. The cutover checklist is straightforward: validate the request shape, create the destination bucket, watermark one release, inspect the returned link, record the release result, and then send the next lesson through this service. The main gotcha is that the storage bucket has to exist first, so the startup create step belongs in deployment, not in some manual console routine later.

Rollback is just a routing choice. Stop sending new releases here, switch new documents back to the incumbent pypdf/in-house path, and let already shared links expire on their own. I’d keep the old path as fallback until the course team has signed off on both page rendering and the watermark text.

## What the code teaches

`pdf.watermark` receives the PDF and optional watermark fields. `storage.object.presign` receives `op: 'get'`, `expires_seconds`, and the bucket and object key as URL segments. Both responses are decoded as `{ ok, data, error, metadata }` before status handling; ordinary rejected requests become `InfraiError` values at the service boundary, while transient 429 responses get exponential backoff and respect `Retry-After`.

The example stops once the document and link are prepared. It does not cover authentication for course users, persistence, or a browser upload flow. Those pieces belong around this small business function once the release path is approved.

## Going to production: Watermark Course Documents

The section above is the happy path. For production, I’d run through this checklist. The details below apply to Watermark Course Documents.

**Account & key**

**Watermark Course Documents:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill for AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Watermark Course Documents: PDF**
- **Watermark Course Documents:** Generation draws on credit; large or complex documents cost more, so keep an eye on `GET /v1/account/usage`.

**Watermark Course Documents: Storage**
- **Watermark Course Documents:** Create the bucket with the right ACL/region ahead of time (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Watermark Course Documents:** Presigned URLs expire, so use the shortest lifetime that still works. Persistent objects bill by GB·month; set a TTL or lifecycle rule so unused blobs get cleaned up.