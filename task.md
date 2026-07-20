# Deployment Fix Tasks

- [x] Analyze all errors
- [ ] Delete root `package-lock.json` (confuses Render/Vercel into using npm)
- [ ] Copy shared-types inline into backend (removes `workspace:*` dep)
- [ ] Remove `@types/cheerio` from backend/package.json
- [ ] Fix `@web-inspectra/shared-types` import in backend/src/index.ts
- [ ] Fix Axios `content-length` type cast (line 562)
- [ ] Fix cheerio type errors in index.ts (AnyNode, tagName, attribs)
- [ ] Add `render.yaml` for Render backend deployment
- [ ] Update frontend `vite.config.ts` API URL for production
- [ ] Add Vercel config for frontend-only deployment
- [ ] Verify backend TypeScript compiles clean
