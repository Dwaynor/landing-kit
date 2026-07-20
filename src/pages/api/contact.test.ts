import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CONTACT_PATH = './contact';

interface ContactModule {
  POST: (context: { request: Request }) => Promise<Response>;
}

function createFormData(fields?: Record<string, string>): FormData {
  const formData = new FormData();
  const values = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Inc',
    position: 'Managing Director',
    message: 'This is a sufficiently long message.',
    website_url: '',
    ...fields,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function createRequest(options?: {
  // Pass `null` to construct a request with NO Origin header at all (for
  // testing the fail-closed rejection). Omit or pass a string for a normal
  // same-origin request — real browsers always send Origin on POST, so that's
  // the default here, matching production traffic.
  origin?: string | null;
  secFetchSite?: string;
  ip?: string;
  fields?: Record<string, string>;
}): Request {
  const headers = new Headers();
  if (options?.origin !== null) {
    headers.set('origin', options?.origin ?? 'https://www.example.com');
  }
  if (options?.secFetchSite) {
    headers.set('sec-fetch-site', options.secFetchSite);
  }
  if (options?.ip) {
    headers.set('cf-connecting-ip', options.ip);
  }

  // CRITICAL: trailing slash required — trailingSlash: 'always' in astro.config.mjs.
  // Without it, POST /api/contact redirects to /api/contact/ and loses method/body.
  return new Request('https://www.example.com/api/contact/', {
    method: 'POST',
    headers,
    body: createFormData(options?.fields),
  });
}

async function loadContactModule(): Promise<ContactModule> {
  vi.resetModules();
  vi.spyOn(globalThis, 'setInterval').mockImplementation(
    () => ({}) as ReturnType<typeof setInterval>,
  );
  return import(CONTACT_PATH) as Promise<ContactModule>;
}

function createSuccessFetchMock() {
  return vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'token-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 202 }));
}

describe('POST /api/contact', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MS_TENANT_ID = 'tenant-id';
    process.env.MS_CLIENT_ID = 'client-id';
    process.env.MS_CLIENT_SECRET = 'client-secret';
    process.env.CONTACT_EMAIL = 'contact@example.com';
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('rejects requests from disallowed origins', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({ request: createRequest({ origin: 'https://evil.example' }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid request.',
    });
  });

  it('rejects requests with no origin header (fail-closed)', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({ request: createRequest({ origin: null }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid request.',
    });
  });

  it('rejects requests with Sec-Fetch-Site: cross-site', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({ request: createRequest({ secFetchSite: 'cross-site' }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid request.',
    });
  });

  it('allows requests with Sec-Fetch-Site: same-origin', async () => {
    const fetchMock = createSuccessFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await loadContactModule();
    const response = await POST({
      request: createRequest({ secFetchSite: 'same-origin', ip: '203.0.113.22' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('rate limits repeated submissions from the same IP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('blocked', { status: 500 }))),
    );
    const { POST } = await loadContactModule();

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await POST({ request: createRequest({ ip: '203.0.113.9' }) });
      expect(response.status).toBe(500);
    }

    const limited = await POST({ request: createRequest({ ip: '203.0.113.9' }) });

    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toEqual({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  });

  it('returns success silently for honeypot submissions', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({
      request: createRequest({
        fields: { website_url: 'https://bot.invalid' },
        ip: '203.0.113.10',
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('requires the mandatory form fields', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({
      request: createRequest({ fields: { name: '', email: '', message: '' }, ip: '203.0.113.11' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Please fill in all required fields.',
    });
  });

  it('validates name length', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({
      request: createRequest({ fields: { name: 'A' }, ip: '203.0.113.12' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Name must be between 2 and 100 characters.',
    });
  });

  it('rejects overly long email addresses', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({
      request: createRequest({
        fields: { email: `${'a'.repeat(245)}@example.com` },
        ip: '203.0.113.13',
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Email address is too long.',
    });
  });

  it('validates message length', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({
      request: createRequest({ fields: { message: 'Too short' }, ip: '203.0.113.14' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Message must be between 10 and 2000 characters.',
    });
  });

  it('validates optional company and position lengths', async () => {
    const { POST } = await loadContactModule();

    const companyResponse = await POST({
      request: createRequest({ fields: { company: 'C'.repeat(201) }, ip: '203.0.113.15' }),
    });
    expect(companyResponse.status).toBe(400);
    await expect(companyResponse.json()).resolves.toEqual({
      success: false,
      error: 'Company name is too long.',
    });

    const positionResponse = await POST({
      request: createRequest({ fields: { position: 'P'.repeat(201) }, ip: '203.0.113.16' }),
    });
    expect(positionResponse.status).toBe(400);
    await expect(positionResponse.json()).resolves.toEqual({
      success: false,
      error: 'Position is too long.',
    });
  });

  it('validates email format', async () => {
    const { POST } = await loadContactModule();

    const response = await POST({
      request: createRequest({ fields: { email: 'not-an-email' }, ip: '203.0.113.17' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Please enter a valid email address.',
    });
  });

  it('returns a server error when mailer credentials are missing', async () => {
    delete process.env.MS_TENANT_ID;
    delete process.env.MS_CLIENT_ID;
    delete process.env.MS_CLIENT_SECRET;

    const { POST } = await loadContactModule();

    const response = await POST({ request: createRequest({ ip: '203.0.113.18' }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Could not send message. Please try again or email us directly.',
    });
  });

  it('returns a server error when CONTACT_EMAIL is missing', async () => {
    delete process.env.CONTACT_EMAIL;

    const { POST } = await loadContactModule();

    const response = await POST({ request: createRequest({ ip: '203.0.113.23' }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Could not send message. Please try again or email us directly.',
    });
  });

  it('returns a server error when token retrieval fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('bad token', { status: 401, statusText: 'Unauthorized' })),
    );

    const { POST } = await loadContactModule();
    const response = await POST({ request: createRequest({ ip: '203.0.113.19' }) });

    expect(response.status).toBe(500);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Could not send message. Please try again or email us directly.',
    });
  });

  it('returns a server error when Graph sendMail fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'token-123' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response('send failed', { status: 502, statusText: 'Bad Gateway' }),
        ),
    );

    const { POST } = await loadContactModule();
    const response = await POST({ request: createRequest({ ip: '203.0.113.20' }) });

    expect(response.status).toBe(500);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Could not send message. Please try again or email us directly.',
    });
  });

  it('sends a sanitized HTML email on success', async () => {
    const fetchMock = createSuccessFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await loadContactModule();
    const response = await POST({
      request: createRequest({
        ip: '203.0.113.21',
        fields: {
          name: 'Jane <script>',
          email: 'jane@example.com',
          company: 'Acme & Co',
          position: 'Founder > Lead',
          message: 'Hello <b>team</b> & thanks for the reply.',
        },
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const sendMailCall = fetchMock.mock.calls[1];
    const init = sendMailCall?.[1];
    expect(init).toBeDefined();

    const requestInit = init as RequestInit;
    const body = typeof requestInit.body === 'string' ? requestInit.body : '';

    expect(body).toContain('Jane &lt;script&gt;');
    expect(body).toContain('Acme &amp; Co');
    expect(body).toContain('Founder &gt; Lead');
    expect(body).toContain('Hello &lt;b&gt;team&lt;/b&gt; &amp; thanks for the reply.');
  });

  it('falls back to x-forwarded-for for the client IP and sends to CONTACT_EMAIL', async () => {
    const fetchMock = createSuccessFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await loadContactModule();
    const request = createRequest({
      fields: {
        company: '',
        position: '',
      },
    });
    request.headers.set('x-forwarded-for', '198.51.100.8, 198.51.100.9');

    const response = await POST({ request });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });

    const sendMailCall = fetchMock.mock.calls[1];
    expect(sendMailCall?.[0]).toBe(
      'https://graph.microsoft.com/v1.0/users/contact@example.com/sendMail',
    );

    const init = sendMailCall?.[1] as RequestInit;
    const body = typeof init.body === 'string' ? init.body : '';
    expect(body).not.toContain('Company</td>');
    expect(body).not.toContain('Position</td>');
  });

  it('returns a generic error for unexpected exceptions', async () => {
    const { POST } = await loadContactModule();
    const headers = new Headers();
    headers.set('origin', 'https://www.example.com');
    const request = {
      headers,
      formData: async (): Promise<FormData> => {
        throw new Error('boom');
      },
    } as unknown as Request;

    const response = await POST({ request });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'An unexpected error occurred.',
    });
  });
});
