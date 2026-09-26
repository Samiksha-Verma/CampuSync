# Deploying CampuSync

Architecture: **frontend on Vercel**, **API gateway + 9 backend services on Render** (one Docker web service each, via the `render.yaml` Blueprint at the repo root), **MongoDB Atlas unchanged** (already cloud-hosted).

This doc never contains a real secret value - every credential below says which local `.env` file to copy it from. `render.yaml` marks every secret `sync: false`, which means Render will prompt you to paste each one in during the Blueprint's first deploy and will *never* store the value in the repo.

---

## 0. Prerequisite: this repo isn't on GitHub yet

Render and Vercel both deploy from a Git remote, and this project currently has no `.git` at all. Before anything else:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create an empty repo on GitHub (no README/license - keep it empty) and push:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Double-check `git status` doesn't show any `.env` files staged - every service's `.gitignore` already excludes them, but it's worth a glance before the first push.

---

## 1. Render service names and predicted URLs

Render gives every web service a public URL of the form `https://<name>.onrender.com`, and the name is exactly what's in `render.yaml`. These are hardcoded into each other's env vars in the blueprint, so the table below is also your reference if Render ever tells you a name is taken and you have to change one:

| Service | Render name | Public URL |
|---|---|---|
| API Gateway | `campusync-gateway` | `https://campusync-gateway.onrender.com` |
| Auth | `campusync-auth` | `https://campusync-auth.onrender.com` |
| User | `campusync-user` | `https://campusync-user.onrender.com` |
| Events | `campusync-events` | `https://campusync-events.onrender.com` |
| Opportunities | `campusync-opportunities` | `https://campusync-opportunities.onrender.com` |
| Certification | `campusync-certification` | `https://campusync-certification.onrender.com` |
| Document Vault | `campusync-vault` | `https://campusync-vault.onrender.com` |
| AI | `campusync-ai` | `https://campusync-ai.onrender.com` |
| Mock Test | `campusync-mocktest` | `https://campusync-mocktest.onrender.com` |
| Notification | `campusync-notification` | `https://campusync-notification.onrender.com` |

If you rename one, grep `render.yaml` for its old URL and update every other service that references it.

**Plan/region**: all 10 are set to `plan: free`, `region: singapore`. Free means each service spins down after 15 min idle and takes ~30-60s to wake up on the next request - the first request after idle time (e.g. someone's first login of the day) can look like it's hanging before it succeeds. Bump `plan` to `starter` (~$7/mo each) on any service you want always-on, most usefully the gateway and auth-service since those are on every request path.

---

## 2. Environment variables per service

Every `sync: false` var below, Render will prompt for during Blueprint setup. Paste it in from the local file named.

### `campusync-gateway` (api-gateway/.env)
| Key | Value |
|---|---|
| `JWT_SECRET` | copy from `api-gateway/.env` |
| `FRONTEND_ORIGIN` | your Vercel URL once you have it (Step 5) - comma-separate if you add more than one |
| `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `EVENTS_SERVICE_URL`, `OPPORTUNITIES_SERVICE_URL`, `CERTIFICATION_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `DOCUMENT_VAULT_SERVICE_URL`, `AI_SERVICE_URL`, `MOCK_TEST_SERVICE_URL` | already filled in `render.yaml` from the table above - nothing to do |

### `campusync-auth` (services/auth-service/.env)
| Key | Value |
|---|---|
| `MONGO_URI` | copy (already `campusync_auth` database) |
| `JWT_SECRET` | **must be byte-for-byte identical** across all 10 services |
| `INTERNAL_SERVICE_SECRET` | copy - must match events/opportunities/certification/notification |
| `EMAIL_USER`, `EMAIL_PASS` | copy (Gmail address + App Password) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | copy - only used if you run `npm run seed:admin` from Render's Shell tab later |
| `JWT_STUDENT_EXPIRES_IN`, `JWT_STAFF_EXPIRES_IN`, `OTP_EXPIRES_MIN`, `EMAIL_SERVICE` | already filled in `render.yaml` (not secret) |

### `campusync-user` (services/user-service/.env)
| Key | Value |
|---|---|
| `MONGO_URI` | copy (`campusync_users` database) |
| `JWT_SECRET` | same value as every other service |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | copy |

### `campusync-events` / `campusync-opportunities` / `campusync-certification` (each service's own .env)
| Key | Value |
|---|---|
| `MONGO_URI` | copy (each has its own database - `campusync_events`, `campusync_opportunities`, `campusync_certifications`) |
| `JWT_SECRET` | same value as every other service |
| `INTERNAL_SERVICE_SECRET` | same value as auth/notification |
| `NOTIFICATION_SERVICE_URL` | already filled in `render.yaml` |

`campusync-events` and `campusync-certification` additionally need (event / course banner uploads, added after initial deploy - if you deployed before these features existed, add these to each existing service in Render's Environment tab and it'll redeploy):
| Key | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | copy (same Cloudinary account as user-service/document-vault-service) |

### `campusync-vault` (services/document-vault-service/.env)
| Key | Value |
|---|---|
| `MONGO_URI` | copy (`campusync_vault` database) |
| `JWT_SECRET` | same value as every other service |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | copy (same Cloudinary account as user-service) |

### `campusync-ai` (services/ai-service/.env)
| Key | Value |
|---|---|
| `JWT_SECRET` | same value as every other service |
| `GROQ_API_KEY` | copy |
| `DOCUMENT_VAULT_SERVICE_URL`, `USER_SERVICE_URL`, `OPPORTUNITIES_SERVICE_URL` | already filled in `render.yaml` |
| *(no `MONGO_URI`)* | this service is stateless by design |

### `campusync-mocktest` (services/mock-test-service/.env)
| Key | Value |
|---|---|
| `MONGO_URI` | copy (`campusync_mocktest` database) |
| `JWT_SECRET` | same value as every other service |

### `campusync-notification` (services/notification-service/.env)
| Key | Value |
|---|---|
| `MONGO_URI` | copy (`campusync_notifications` database) |
| `JWT_SECRET` | same value as every other service |
| `INTERNAL_SERVICE_SECRET` | same value as auth/events/opportunities/certification |
| `EMAIL_USER`, `EMAIL_PASS` | same Gmail credentials as auth-service |
| `FRONTEND_ORIGIN` | **must match the gateway's value exactly** - this is Socket.io's own separate CORS check |
| `AUTH_SERVICE_URL` | already filled in `render.yaml` |

**The one value every single service shares**: `JWT_SECRET`. Copy it once from any local `.env` and paste the identical string into all 10 prompts - a mismatch anywhere breaks that service's ability to verify tokens issued by auth-service.

---

## 3. MongoDB Atlas and Gmail - nothing to change

- **Atlas Network Access** is already set to allow `0.0.0.0/0` (done earlier in this project when local dev hit the same "Render/cloud services have no fixed IP" problem) - Render's services can already reach it.
- **Gmail SMTP** (Nodemailer, used by auth-service and notification-service): Render doesn't block outbound SMTP, so this should work unchanged. If email sending ever fails only in production, that's the first thing to check regardless.

---

## 4. Deploy the backend (Render Blueprint)

1. Go to the Render dashboard -> **New** -> **Blueprint**.
2. Connect your GitHub account if you haven't, and select this repo.
3. Render reads `render.yaml` and lists all 10 services. Review the plan/region (free/Singapore, per the table above).
4. For each `sync: false` variable it lists, paste the value from Section 2. This is the tedious-but-one-time part - ~35 values across 10 services.
5. Click **Apply** / **Create New Resources**. Render builds all 10 Docker images and deploys them - this can take several minutes, since it's 10 separate builds.
6. Once done, hit `https://campusync-gateway.onrender.com/health` (and the others) to confirm each is live before moving to the frontend.

**If you'd rather deploy one at a time manually instead of via Blueprint** (e.g. Blueprint fails on something): for each service, go to **New -> Web Service**, connect the repo, set **Root Directory** to that service's folder (e.g. `services/auth-service`), Render auto-detects the `Dockerfile` there, set the env vars from Section 2 by hand, and deploy. Repeat 10 times. The Blueprint just automates exactly this.

---

## 5. Deploy the frontend (Vercel)

1. Go to Vercel -> **Add New** -> **Project**, import the same GitHub repo.
2. **Root Directory**: `frontend` (this is a monorepo - Vercel needs to know the app isn't at the repo root).
3. Framework preset: **Vite** (should auto-detect once Root Directory is set).
4. Build command: `npm run build` (default). Output directory: `dist` (default).
5. Environment variable: `VITE_API_BASE_URL` = `https://campusync-gateway.onrender.com` (no trailing slash, no `/api` - the frontend's own client already appends that).
6. Deploy. Vercel gives you a URL like `https://campusync-xyz.vercel.app`.

---

## 6. Close the loop: point the gateway at the real frontend URL

Now that you have the real Vercel URL:

1. In Render, open `campusync-gateway` -> Environment -> set `FRONTEND_ORIGIN` to your Vercel URL (e.g. `https://campusync-xyz.vercel.app`).
2. Do the same on `campusync-notification` - its `FRONTEND_ORIGIN` must match exactly (separate CORS check for Socket.io).
3. Both services redeploy automatically when you save an env var change.

If you later add a custom domain or Vercel preview deployments you want to test against, add them to `FRONTEND_ORIGIN` as a comma-separated list on both services - see `api-gateway/server.js` and `services/notification-service/socket/socketServer.js` for how the list is parsed.

---

## 7. Post-deploy checklist

- [ ] All 10 `/health` endpoints return `200` (see Render's own per-service logs if any don't - almost always a missing/mismatched env var).
- [ ] Full login flow works end-to-end from the deployed frontend (Student/Faculty/Admin).
- [ ] If this is a fresh Atlas cluster with no Admin yet: run `npm run seed:admin` for auth-service, `npm run seed:questions` and `npm run seed:coding` for mock-test-service - either from Render's **Shell** tab on that service, or locally with your `.env` pointed at the same Atlas cluster (equivalent either way).
- [ ] Real-time notifications (Socket.io) connect from the deployed frontend - open the browser console and confirm no CORS/connection errors on `/api/notifications/socket`.
- [ ] Resume Analyzer / Chat / Voice Interview / Recommendations (ai-service, Groq-backed) all still work - this is the one service with no database and the most cross-service calls (vault, user, opportunities).
