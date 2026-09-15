require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { verifyToken, requireRole } = require('./middleware/verifyToken');
const {
  AUTH_SERVICE_URL,
  USER_SERVICE_URL,
  EVENTS_SERVICE_URL,
  OPPORTUNITIES_SERVICE_URL,
  CERTIFICATION_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
  DOCUMENT_VAULT_SERVICE_URL,
  AI_SERVICE_URL,
  MOCK_TEST_SERVICE_URL,
} = require('./config/services');

const app = express();

// FRONTEND_ORIGIN may be a single URL or a comma-separated list (e.g. the deployed
// Vercel URL plus a Vercel preview URL) - localhost:5173 is always allowed too, so
// local frontend dev keeps working against a deployed gateway without extra config.
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean),
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// No express.json() here on purpose: this gateway only ever inspects the
// Authorization header, never the body. Parsing the body would consume the
// request stream and break proxying (JSON bodies, file uploads, everything).

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'api-gateway' }));

// Forwards the caller's identity to the downstream service for convenience/logging.
// Downstream services do NOT trust these headers for auth - they independently
// re-verify the same JWT from the Authorization header, which the proxy passes
// through untouched.
const forwardUserIdentity = {
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.id);
      proxyReq.setHeader('x-user-role', req.user.role);
    }
  },
};

// ---- Auth Service ----

// The admin-only faculty-review endpoints. Registered before the generic /api/auth
// mount below so they're matched first - /api/auth/admin/login must stay public
// (you don't have a token yet at login time), so only this specific sub-path is gated.
app.use(
  '/api/auth/admin/faculty-requests',
  verifyToken,
  requireRole('admin'),
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth/admin/faculty-requests': '/auth/admin/faculty-requests' },
    ...forwardUserIdentity,
  })
);

// A student updating their own name/branch/year needs a valid token, but signup/
// login/verify-otp do not - so this one sub-path is gated ahead of the public mount.
app.use(
  '/api/auth/student/me',
  verifyToken,
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth/student/me': '/auth/student/me' },
    ...forwardUserIdentity,
  })
);

// Everything else under /api/auth/* is public (signup/login/verify-otp endpoints
// issue the tokens in the first place, so they can't require one).
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
  })
);

// ---- User Service ----

// All /api/users/* routes require a valid JWT. Fine-grained ownership (self vs
// admin-override) is enforced inside user-service, which is where that business
// rule actually lives.
app.use(
  '/api/users',
  verifyToken,
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/users' },
    ...forwardUserIdentity,
  })
);

// ---- Events Service ----

// All /api/events/* routes require a valid JWT. Role checks (Admin/Faculty for
// write routes) and creator-or-admin ownership are enforced inside events-service.
app.use(
  '/api/events',
  verifyToken,
  createProxyMiddleware({
    target: EVENTS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/events': '/events' },
    ...forwardUserIdentity,
  })
);

// ---- Opportunities Service ----

// Same pattern: role checks (Admin/Faculty for create/edit/delete) and creator-or-admin
// ownership are enforced downstream. Pure information listing - the platform never
// tracks whether a student applied (that happens on the company's own site via
// applicationLink), so there's nothing student-specific to route here.
app.use(
  '/api/opportunities',
  verifyToken,
  createProxyMiddleware({
    target: OPPORTUNITIES_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/opportunities': '/opportunities' },
    ...forwardUserIdentity,
  })
);

// ---- Certification Service ----

app.use(
  '/api/certifications',
  verifyToken,
  createProxyMiddleware({
    target: CERTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/certifications': '/certifications' },
    ...forwardUserIdentity,
  })
);

// ---- Notification Service ----

// The Socket.io path gets its own proxy mount, registered BEFORE the general
// /api/notifications mount below, and deliberately WITHOUT verifyToken:
//
// - A raw WebSocket upgrade request never passes through Express's middleware stack
//   at all - Node's http.Server emits a separate 'upgrade' event for it, which
//   bypasses app.use() entirely. verifyToken here would never even see it.
// - Socket.io's own handshake auth (see notification-service/socket/socketServer.js)
//   is the real, authoritative check for this connection - same defense-in-depth
//   principle as every REST service independently re-verifying its own JWT
//   regardless of what the gateway already checked.
//
// This also covers Socket.io's HTTP long-polling fallback transport (its initial
// handshake before upgrading to a raw WebSocket), which DOES go through Express -
// that's proxied here too, un-gated, for the same reason.
const notificationSocketProxy = createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  // No pathRewrite: notification-service's Socket.io server is configured with the
  // matching custom `path: '/api/notifications/socket'`, so the path passes through unchanged.
});

app.use('/api/notifications/socket', notificationSocketProxy);

// Explicitly blocked, registered before the general /api/notifications mount below.
// Without this, the path is still technically reachable through the gateway with any
// valid student/faculty/admin JWT - it would only fail one hop later inside
// notification-service for lacking the internal secret a browser has no way to know.
// That's still secure, but this makes the intent explicit at the front door too:
// broadcast is a service-to-service call, made directly against notification-service's
// own URL, and never something the gateway should route at all.
app.use('/api/notifications/broadcast', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Everything else under /api/notifications/* (GET /me, PUT /:id/read) requires a
// valid JWT, same as every other REST route.
app.use(
  '/api/notifications',
  verifyToken,
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/notifications' },
    ...forwardUserIdentity,
  })
);

// ---- Document Vault Service ----

// All /api/vault/* routes require a valid JWT. Student-only role check and
// self-only ownership are enforced inside document-vault-service. Downloads proxy
// bytes through document-vault-service itself (which in turn fetches a freshly-signed
// Cloudinary URL server-side) - the gateway doesn't need any special handling for
// that beyond the standard proxy mount, same as it needed none for avatar uploads.
app.use(
  '/api/vault',
  verifyToken,
  createProxyMiddleware({
    target: DOCUMENT_VAULT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/vault': '/vault' },
    ...forwardUserIdentity,
  })
);

// ---- AI Service ----

// All /api/ai/* routes require a valid JWT; student-only is enforced inside
// ai-service. AI calls (especially resume analysis, which also extracts text from an
// uploaded PDF server-side first) can still take longer than the fast CRUD calls
// every other proxied service handles - explicit generous timeouts here so the
// gateway doesn't cut a slow-but-legitimate AI response short.
app.use(
  '/api/ai',
  verifyToken,
  createProxyMiddleware({
    target: AI_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/ai': '/ai' },
    proxyTimeout: 60000,
    timeout: 60000,
    ...forwardUserIdentity,
  })
);

// ---- Mock Test Service ----

// All /api/mocktest/* routes require a valid JWT. Student-only for
// questions/submit/history, Admin/Faculty-only for adding questions - enforced
// inside mock-test-service.
app.use(
  '/api/mocktest',
  verifyToken,
  createProxyMiddleware({
    target: MOCK_TEST_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/mocktest': '/mocktest' },
    ...forwardUserIdentity,
  })
);

// ---- Future services ----
// All nine originally-planned backend services are now built. Follow the same
// pattern for anything added later: mount the specific/protected route before any
// broader catch-all for that prefix, and reuse `verifyToken` / `requireRole` as needed.

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// http.createServer (rather than app.listen) so the 'upgrade' event below can be
// wired manually - app.listen() creates the same underlying server but doesn't
// expose it, and WebSocket upgrades need that raw server-level hook.
const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/api/notifications/socket')) {
    notificationSocketProxy.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[api-gateway] listening on port ${PORT}`);
});
