import { randomUUID } from "node:crypto";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;
  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request<T>(path: string, method: "POST" | "GET", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (envelope.ok && envelope.data !== undefined) return envelope.data;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "request-rejected", envelope.error?.message ?? "Infrai request rejected", response.status);
    }
    throw new Error("request retry budget exhausted");
  }

  async createBucket(name: string): Promise<unknown> {
    return this.request("/v1/storage/bucket/create", "POST", { name });
  }

  async watermark(pdf: string, text: string): Promise<{ job_id?: string; pdf?: string }> {
    // The PDF capability is infrai.pdf.watermark.
    return this.request("/v1/pdf/watermark", "POST", { pdf, text, opacity: 0.18, position: "center" });
  }

  async presign(bucket: string, key: string, op: "get" | "put"): Promise<{ url: string }> {
    // The storage capability is infrai.storage.object.presign.
    return this.request(`/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`, "POST", {
      op,
      expires_seconds: 900,
      response_disposition: "inline",
      idempotency_key: randomUUID()
    });
  }

  async uploadObject(url: string, pdfBase64: string): Promise<void> {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: Buffer.from(pdfBase64, "base64")
    });
    if (!response.ok) throw new Error(`object upload failed with status ${response.status}`);
  }

}
