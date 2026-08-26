import { afterEach, describe, expect, it } from "@jest/globals";

async function providerHttp() {
  process.env.DATABASE_URL ||= "postgresql://unused:unused@127.0.0.1:1/unused";
  process.env.JWT_SECRET ||= "phase6-provider-test-secret-longer-than-thirty-two-characters";
  return import("../modules/ndie/provider-orchestrator/provider-http.js");
}

describe("NDIE provider failure handling", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("marks provider 5xx and network failures as retryable without returning content", async () => {
    const { fetchProviderJson, NdieProviderError } = await providerHttp();
    global.fetch = (async () => new Response("{}", { status: 503 })) as typeof fetch;
    await expect(fetchProviderJson("provider.test", "https://provider.invalid", {}, 100)).rejects.toMatchObject({
      name: "NdieProviderError",
      providerId: "provider.test",
      retryable: true
    });

    global.fetch = (async () => { throw new Error("network unavailable"); }) as typeof fetch;
    await expect(fetchProviderJson("provider.test", "https://provider.invalid", {}, 100)).rejects.toBeInstanceOf(NdieProviderError);
  });

  it("marks non-transient provider rejections as non-retryable", async () => {
    const { fetchProviderJson } = await providerHttp();
    global.fetch = (async () => new Response("{}", { status: 400 })) as typeof fetch;
    await expect(fetchProviderJson("provider.test", "https://provider.invalid", {}, 100)).rejects.toMatchObject({
      retryable: false
    });
  });

  it("aborts a provider request after the configured timeout", async () => {
    const { fetchProviderJson } = await providerHttp();
    global.fetch = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    await expect(fetchProviderJson("provider.test", "https://provider.invalid", {}, 5)).rejects.toMatchObject({
      retryable: true
    });
  });

  it("refuses an oversized unhosted page instead of truncating provider input", async () => {
    const { imageSource } = await providerHttp();
    await expect(imageSource({ imageBuffer: Buffer.alloc(1_400_001) })).rejects.toMatchObject({
      providerId: "provider.input",
      retryable: false
    });
  });
});
