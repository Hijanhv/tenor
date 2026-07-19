# Tenor docs

Documentation site for Tenor, built with [Mintlify](https://mintlify.com).

## Pages

- `docs.json` — navigation, theme, colors
- `introduction.mdx`, `quickstart.mdx` — get started
- `concepts.mdx`, `fixed-rate.mdx` — core concepts
- `how-it-works.mdx`, `architecture.mdx` — the protocol, with mermaid diagrams
- `contracts.mdx` — deployed testnet contracts

## Preview locally

```bash
npm i -g mint       # install the Mintlify CLI
cd docs
mint dev            # opens http://localhost:3000
```

If a page does not show up, check that its filename (without `.mdx`) is listed in
`docs.json` under `navigation.groups`.

## Publish on Mintlify

The docs live in the `docs/` folder of this repo, so publishing is a one time
connect and then automatic on every push.

1. **Push the repo to GitHub** (it already lives at `github.com/Hijanhv/tenor`).
2. Go to [mintlify.com](https://mintlify.com) and sign up with GitHub.
3. **Install the Mintlify GitHub App** when prompted and grant it access to the
   `tenor` repository.
4. In onboarding, choose this repo and set the **docs directory to `docs`** (not
   the repo root). Mintlify reads `docs/docs.json` as the config.
5. Click deploy. You get a URL like `https://tenor.mintlify.app`.
6. From then on, **every push to the default branch redeploys** the docs
   automatically.

### Custom domain (optional)

In the Mintlify dashboard, open **Settings → Domain**, add `docs.tenor.xyz` (or
your domain), and create the `CNAME` record it shows you at your DNS provider.

### Point the site's Docs link at Mintlify

Once the docs are live, update the app so its **Docs** links go to Mintlify
instead of the built in `/docs` page. In `web/lib/config.ts` add:

```ts
docs: "https://tenor.mintlify.app", // your live docs URL
```

and change the `Docs` links in `web/components/Nav.tsx` and
`web/components/Footer.tsx` from `href="/docs"` to `href={CONFIG.docs}` with
`target="_blank"`.
