# Vendored Axentra API contract

`openapi.json` in this folder is a verbatim copy of the backend's `openapi/axentra-v1.json`.
It is never edited by hand. Update it with:

```bash
npm run api:sync                                   # copy ../axentra/openapi/axentra-v1.json
npm run api:sync -- --sha <commit>                 # fetch from GitHub at a commit
npm run api:sync -- --url https://host/openapi.json  # fetch from any URL
```

The script records where the document came from in `SOURCE` and regenerates
`src/api/schema.d.ts` with `openapi-typescript`. Commit all three files together.
