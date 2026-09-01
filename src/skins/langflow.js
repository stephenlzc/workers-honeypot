// ============================================================
// FAKE LANGFLOW HONEYPOT
// Langflow CVE-2025-3248: /api/v1/validate/code RCE probe path.
// ============================================================

import { nowISO, escapeHtml } from '../core/utils.js';
import { recordCredentialAttempt } from '../core/db.js';

const LANGFLOW_VERSION = '1.3.0';
const LANGFLOW_TITLE = 'Langflow';

// ============================================================
// FAKE LANGFLOW API RESPONSES
// ============================================================

function fakeHealthResponse() {
  return {
    status: 'ok',
    version: LANGFLOW_VERSION,
    uptime: Math.floor(Math.random() * 86400),
    database: 'connected',
    redis: 'connected',
    workers: 4,
    timestamp: nowISO()
  };
}

function fakeVersionResponse() {
  return {
    version: LANGFLOW_VERSION,
    build: '2026-03-10',
    python: '3.11.5',
    node: '20.11.0',
    api_version: 'v1'
  };
}

function fakeFlowsResponse() {
  return {
    flows: [
      {
        id: 'flow-001',
        name: 'Customer Support Bot',
        description: 'AI-powered customer support automation',
        status: 'active',
        created_at: '2026-03-10T10:00:00Z',
        updated_at: '2026-03-13T14:30:00Z'
      },
      {
        id: 'flow-002',
        name: 'Data Pipeline',
        description: 'ETL workflow for analytics',
        status: 'active',
        created_at: '2026-03-11T08:00:00Z',
        updated_at: '2026-03-13T12:00:00Z'
      },
      {
        id: 'flow-003',
        name: 'Code Review Assistant',
        description: 'Automated code review with LLM',
        status: 'draft',
        created_at: '2026-03-12T16:00:00Z',
        updated_at: '2026-03-12T16:00:00Z'
      }
    ],
    total: 3,
    page: 1,
    page_size: 20
  };
}

function fakeLoginResponse() {
  return {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
      sub: 'admin',
      exp: Date.now() + 3600000,
      iat: Date.now(),
      role: 'admin'
    }))}.fake_signature_pLeAsE_nOt_ReAl`,
    token_type: 'bearer',
    user: {
      id: 'usr-admin-001',
      username: 'admin',
      email: 'admin@example.com',
      is_active: true,
      role: 'admin'
    }
  };
}

function fakeValidateCodeResponse() {
  // CVE-2025-3248: This endpoint is the primary target for exploit bots
  return {
    status: 'success',
    valid: true,
    message: 'Code validation passed',
    result: {
      output: 'Validation successful',
      syntax: 'valid',
      dependencies: ['langchain', 'openai', 'anthropic']
    }
  };
}

function fakeRunFlowResponse(flowId) {
  return {
    run_id: `run-${Math.random().toString(36).slice(2,12)}`,
    flow_id: flowId || 'flow-001',
    status: 'completed',
    outputs: [
      {
        node_id: 'node-output-001',
        output: {
          text: 'I can help you with that! Let me process your request.',
          tokens_used: 142,
          model: 'gpt-4'
        }
      }
    ],
    duration_ms: 1234,
    timestamp: nowISO()
  };
}

// ============================================================
// LANGFLOW HTML LOGIN PAGE
// ============================================================
function htmlLangflowLogin(error = null) {
  const errorBlock = error ? `<div style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:16px;font-size:14px">${escapeHtml(error)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Login - ${LANGFLOW_TITLE}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
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
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.15s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
      margin-top: 8px;
    }
    button:hover {
      opacity: 0.9;
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
      <div class="logo-icon">Lf</div>
      <span class="logo-text">${LANGFLOW_TITLE}</span>
    </div>
    <h1>Welcome Back</h1>
    <p class="subtitle">Sign in to your Langflow workspace</p>
    ${errorBlock}
    <form method="POST" action="/langflow/api/v1/auth/login">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="admin@example.com" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required>
      </div>
      <button type="submit">Sign In</button>
    </form>
    <div class="footer">
      Langflow v${LANGFLOW_VERSION} &bull; Open Source LLM Framework
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// LANGFLOW ROUTE HANDLER
// ============================================================
export async function handleLangflowRoute(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  // Dedicated-hostname entry point (langflow.<domain>/).
  if (path === '/') {
    return new Response(null, { status: 302, headers: { Location: '/login' } });
  }

  // Health check
  if (path === '/langflow/health' || path === '/health') {
    return new Response(JSON.stringify(fakeHealthResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Langflow-Version': LANGFLOW_VERSION,
        'Server': `Langflow/${LANGFLOW_VERSION}`
      }
    });
  }

  // Version endpoint
  if (path === '/langflow/api/v1/version' || path === '/api/v1/version') {
    return new Response(JSON.stringify(fakeVersionResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Langflow-Version': LANGFLOW_VERSION
      }
    });
  }

  // Login page
  if (path === '/langflow/login' || path === '/login') {
    if (method === 'GET') {
      return new Response(htmlLangflowLogin(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    // POST login
    const body = await request.formData().catch(() => new FormData());
    const email = body.get('email') || '';
    const password = body.get('password') || '';
    await recordCredentialAttempt(env, { honeypot: 'langflow', identifier: email, password, ip: request.headers.get('CF-Connecting-IP'), country: request.cf?.country });
    if (email && password) {
      return new Response(JSON.stringify(fakeLoginResponse()), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Langflow-Version': LANGFLOW_VERSION
        }
      });
    }
    return new Response(htmlLangflowLogin('Invalid credentials'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // CVE-2025-3248: /api/v1/validate/code - PRIMARY EXPLOIT TARGET
  if (path === '/langflow/api/v1/validate/code' || path === '/api/v1/validate/code') {
    const bodyText = await request.text().catch(() => '{}');
    let code = '';
    try {
      const body = JSON.parse(bodyText);
      code = body.code || body.script || '';
    } catch(_){}

    // Log the exploit attempt - this is valuable intelligence
    console.log('LANGFLOW_EXPLOIT_ATTEMPT:', JSON.stringify({
      endpoint: '/api/v1/validate/code',
      code: code.slice(0, 500),
      timestamp: nowISO(),
      source_ip: request.headers.get('CF-Connecting-IP') || 'unknown'
    }));

    // Simulate realistic delay
    await new Promise(r => setTimeout(r, 100 + Math.floor(Math.random() * 200)));

    return new Response(JSON.stringify(fakeValidateCodeResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Langflow-Version': LANGFLOW_VERSION
      }
    });
  }

  // Auth endpoints
  if (path === '/langflow/api/v1/auth/login' || path === '/api/v1/auth/login') {
    if (method === 'POST') {
      const bodyText = await request.text().catch(() => '{}');
      let credentials = {};
      try { credentials = JSON.parse(bodyText); } catch(_){}

      await recordCredentialAttempt(env, { honeypot: 'langflow', identifier: credentials.email || credentials.username, password: credentials.password, ip: request.headers.get('CF-Connecting-IP'), country: request.cf?.country });

      // Log credential attempt
      console.log('LANGFLOW_AUTH_ATTEMPT:', JSON.stringify({
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
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Flows API
  if (path === '/langflow/api/v1/flows' || path === '/api/v1/flows') {
    return new Response(JSON.stringify(fakeFlowsResponse()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Langflow-Version': LANGFLOW_VERSION
      }
    });
  }

  // Run flow
  if (path.startsWith('/langflow/api/v1/flows/') && path.endsWith('/run')) {
    const flowId = path.split('/').slice(-2, -1)[0];
    return new Response(JSON.stringify(fakeRunFlowResponse(flowId)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Langflow-Version': LANGFLOW_VERSION
      }
    });
  }

  // Main page / dashboard redirect
  if (path === '/langflow' || path === '/langflow/') {
    return new Response(null, {
      status: 302,
      headers: { Location: '/langflow/login' }
    });
  }

  // 404
  return new Response(JSON.stringify({ error: 'Not found', message: `Path ${path} not found` }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'X-Langflow-Version': LANGFLOW_VERSION
    }
  });
}
