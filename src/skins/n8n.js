// ============================================================
// FAKE N8N HONEYPOT
// n8n CVE-2025-68613 CVSS 9.9: Workflow automation platform
// ============================================================

import { nowISO, escapeHtml } from '../core/utils.js';
import { recordCredentialAttempt } from '../core/db.js';

const N8N_VERSION = '1.32.0';
const N8N_TITLE = 'n8n';

// ============================================================
// FAKE N8N API RESPONSES
// ============================================================

function fakeHealthResponse() {
  return {
    status: 'ok',
    version: N8N_VERSION,
    uptime: Math.floor(Math.random() * 86400),
    database: { type: 'postgresdb', connected: true },
    cache: { mode: 'memory', connected: true },
    queue: { mode: 'builtin', healthy: true },
    timestamp: nowISO()
  };
}

function fakeVersionResponse() {
  return {
    version: N8N_VERSION,
    cliVersion: N8N_VERSION,
    storage: 'database',
    execution: 'main',
    license: { plan: 'community' }
  };
}

function fakeWorkflowsResponse() {
  return {
    data: [
      {
        id: 'wf-001',
        name: 'Email Processing Pipeline',
        active: true,
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-13T14:30:00.000Z',
        tags: [{ name: 'production' }, { name: 'email' }]
      },
      {
        id: 'wf-002',
        name: 'Slack Notifications',
        active: true,
        createdAt: '2026-03-11T08:00:00.000Z',
        updatedAt: '2026-03-13T12:00:00.000Z',
        tags: [{ name: 'slack' }]
      },
      {
        id: 'wf-003',
        name: 'Data Sync - Salesforce',
        active: false,
        createdAt: '2026-03-12T16:00:00.000Z',
        updatedAt: '2026-03-12T16:00:00.000Z',
        tags: [{ name: 'integration' }]
      }
    ],
    count: 3
  };
}

function fakeLoginResponse() {
  return {
    data: {
      id: 'usr-admin-001',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'global:owner',
      apiKey: 'n8n_api_' + Math.random().toString(36).slice(2, 14),
      password: {
        hash: '$2b$10$fake_hash_not_real',
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    },
    globalCookie: 'n8n-auth=' + Math.random().toString(36).slice(2, 34)
  };
}

function fakeWebhookResponse(workflowId) {
  return {
    executionId: `exec-${Math.random().toString(36).slice(2, 12)}`,
    workflowId: workflowId || 'wf-001',
    status: 'success',
    startedAt: nowISO(),
    finishedAt: nowISO(),
    data: {
      resultData: {
        runData: {
          'Webhook': [{
            startTime: Date.now() - 500,
            executionTime: 42,
            data: { main: [[{ json: { received: true, processed: true } }]] }
          }]
        }
      }
    }
  };
}

function fakeCredentialResponse() {
  return {
    data: [
      {
        id: 'cred-001',
        name: 'OpenAI API',
        type: 'openAiApi',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-13T14:30:00.000Z'
      },
      {
        id: 'cred-002',
        name: 'Slack OAuth',
        type: 'slackOAuth2Api',
        createdAt: '2026-03-11T08:00:00.000Z',
        updatedAt: '2026-03-13T12:00:00.000Z'
      },
      {
        id: 'cred-003',
        name: 'PostgreSQL',
        type: 'postgresDb',
        createdAt: '2026-03-12T16:00:00.000Z',
        updatedAt: '2026-03-12T16:00:00.000Z'
      }
    ],
    count: 3
  };
}

// ============================================================
// N8N HTML LOGIN PAGE
// ============================================================
function htmlN8nLogin(error = null) {
  const errorBlock = error ? `<div style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;padding:12px;margin-bottom:16px;font-size:14px">${escapeHtml(error)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Login - ${N8N_TITLE}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: #ff6d5a;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      font-weight: bold;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 24px;
      text-align: center;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
    }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #dbdfe7;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.15s;
    }
    input:focus {
      outline: none;
      border-color: #ff6d5a;
      box-shadow: 0 0 0 3px rgba(255, 109, 90, 0.1);
    }
    button {
      width: 100%;
      padding: 12px;
      background: #ff6d5a;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      margin-top: 8px;
    }
    button:hover {
      background: #e55a48;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="logo">
      <div class="logo-icon">n8n</div>
      <span class="logo-text">${N8N_TITLE}</span>
    </div>
    <h1>Welcome to n8n</h1>
    ${errorBlock}
    <form method="POST" action="/n8n/rest/login">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="admin@example.com" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required>
      </div>
      <button type="submit">Login</button>
    </form>
    <div class="footer">
      n8n v${N8N_VERSION} &bull; Fair-code licensed workflow automation
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// N8N ROUTE HANDLER
// ============================================================
export async function handleN8nRoute(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  // Dedicated-hostname entry point (n8n.<domain>/).
  if (path === '/') {
    return new Response(null, { status: 302, headers: { Location: '/signin' } });
  }

  // Health check
  if (path === '/n8n/healthz' || path === '/healthz') {
    return new Response(JSON.stringify(fakeHealthResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION,
        'n8n-version': N8N_VERSION,
        'Server': `n8n/${N8N_VERSION}`
      }
    });
  }

  // Version
  if (path === '/n8n/rest/version' || path === '/rest/version') {
    return new Response(JSON.stringify(fakeVersionResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION
      }
    });
  }

  // Login page
  if (path === '/n8n/signin' || path === '/signin' || path === '/n8n/login' || path === '/login') {
    if (method === 'GET') {
      return new Response(htmlN8nLogin(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }

  // REST Login endpoint
  if (path === '/n8n/rest/login' || path === '/rest/login') {
    if (method === 'POST') {
      const bodyText = await request.text().catch(() => '{}');
      let credentials = {};
      try { credentials = JSON.parse(bodyText); } catch(_){}
      if (!credentials.email && request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
        const form = new URLSearchParams(bodyText);
        credentials = { email: form.get('email') || '', password: form.get('password') || '' };
      }

      await recordCredentialAttempt(env, { honeypot: 'n8n', identifier: credentials.email || credentials.username, password: credentials.password, ip: request.headers.get('CF-Connecting-IP'), country: request.cf?.country });

      // Log credential attempt
      console.log('N8N_AUTH_ATTEMPT:', JSON.stringify({
        identifier_kind: credentials.email ? 'email' : 'username',
        timestamp: nowISO(),
        source_ip: request.headers.get('CF-Connecting-IP') || 'unknown'
      }));

      if (credentials.email && credentials.password) {
        return new Response(JSON.stringify(fakeLoginResponse()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Workflows API
  if (path === '/n8n/rest/workflows' || path === '/rest/workflows') {
    return new Response(JSON.stringify(fakeWorkflowsResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION
      }
    });
  }

  // Credentials API
  if (path === '/n8n/rest/credentials' || path === '/rest/credentials') {
    return new Response(JSON.stringify(fakeCredentialResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION
      }
    });
  }

  // Webhook execution (trap)
  if (path.startsWith('/n8n/webhook/') || path.startsWith('/webhook/')) {
    const workflowId = path.split('/').pop();
    return new Response(JSON.stringify(fakeWebhookResponse(workflowId)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION
      }
    });
  }

  // Production webhook (another trap)
  if (path.startsWith('/n8n/webhook-test/') || path.startsWith('/webhook-test/')) {
    const workflowId = path.split('/').pop();
    return new Response(JSON.stringify(fakeWebhookResponse(workflowId)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION
      }
    });
  }

  // Main page / dashboard redirect
  if (path === '/n8n' || path === '/n8n/') {
    return new Response(null, {
      status: 302,
      headers: { Location: '/n8n/signin' }
    });
  }

  // REST API catch-all
  if (path.startsWith('/n8n/rest/') || path.startsWith('/rest/')) {
    return new Response(JSON.stringify({ message: 'Not found', code: 'NOT_FOUND' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Version': N8N_VERSION
      }
    });
  }

  // 404
  return new Response(JSON.stringify({ error: 'Not found', message: `Path ${path} not found` }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-Version': N8N_VERSION
    }
  });
}
