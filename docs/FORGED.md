# FORGED implementation

## Content contract

Portfolio data is immutable for this redesign. Descriptions, titles, technology labels, experience points, dates, education, URLs, source order, resume, and existing images retain their original values. No case-study stories, metrics, screenshots, or professional claims were invented.

- `src/assets/data.js` remains the original project/skill source, including commented-out records. Its only change is removal of an unused icon import for lint compliance.
- `src/forged/content.js` contains verbatim experience/education extraction and the existing hero introduction, name, phone, resume and social URLs. Both new GUI and CLI use these records. The legacy experience page also imports these same records.
- `src/forged/catalog.js` holds presentation metadata separately: slugs, featured selection, filter aliases, and project type inferred from existing descriptions. Original records are not normalized or rewritten.
- `docs/content-baseline/` stores the complete original source as text, plus SHA-256 checksums of all original source files and public assets. The baseline was captured before any implementation changes.
- `npm run check:content` checks original project and skill declarations (including comments), exact experience/education records and order, original contact URLs, the introduction, all archived source bytes, and every original public asset.

The original six published projects remain published. Commented-out project entries remain commented out. Payment gateway skills already present in the source now also have an accessible category. No original public assets were removed or changed.

## Architecture and visual direction

React 18, Vite, React Router, Tailwind, Framer Motion, React Three Fiber and Drei remain. FORGED adds a charcoal/bone/orange design system, locally served Syne/Instrument Sans/IBM Plex Mono, a focused hero, two editorial featured layouts followed by the archive, complete descriptions, project detail URLs, a selectable stack explorer, experience timeline, contact form, command palette and recruiter overview.

The new UI is under `src/forged/`. Original components remain in place, outside the active application import graph, to preserve source content. Their changes are lint corrections and the shared experience extraction. The original splash remains preserved and unmounted; the active introduction is the independently implemented `SystemBoot`. The original stars/sphere/cursor implementations are not imported by the new application.

The Engineering Core uses demand rendering, damped inspection and scroll response. Keyboard rotation/reset controls complement dragging. It loads only on sufficiently wide fine-pointer devices; mobile, reduced-motion, save-data, initialization errors and context loss use an SVG diagram. Offscreen/hidden-tab scenes unmount. Terminal mode never mounts a canvas.

The build prerenders 12 public routes from the same actual page components and data. Generated HTML is replaced by the client application at startup rather than hydrated, avoiding mismatches from per-visitor theme/mode preferences. Vite's normal SSR build produces the temporary render module. `dist/` is the deployable output; `dist-ssr/` is ignored build output. Canonical URLs, descriptions, Open Graph data, sitemap and robots are generated. Existing Vercel rewrites are retained; filesystem assets take precedence over rewrites.

## System boot introduction

Every full client application load mounts a deterministic 2.5-second System Forge introduction. Client-side route and visual/terminal mode changes do not replay it. The sequence assembles a local SVG signal core, advances through fixed portfolio diagnostics, and opens through a split-panel reveal. It represents a designed introduction rather than actual network, build or system progress.

Visual entry inherits the active light/dark tokens. Direct terminal entry uses the terminal surface and the validated saved Bone, Orange, Green or Amber foreground. The sequence uses only React, local SVG and CSS; it performs no fetch, canvas/WebGL work, storage write or external asset load.

While active, the application frame is inert and hidden from the accessibility tree, document scrolling is locked, and the current step is announced politely. Skip becomes visible after 500ms and Escape dismisses immediately. Completion restores focus to visual main content or the terminal command line. Reduced-motion visitors receive a static final-status handoff lasting 320ms. The layout removes secondary telemetry on small or short screens while retaining the identity, status, progress and a minimum 44px Skip target.

## Terminal and navigation

`?mode=terminal` and `?mode=visual` override stored preferences. Entry canonicalizes the URL so browser history restores an explicit mode. Visual route, project filters and scroll position survive mode changes. Command output and history survive switching within the current page session; reload resets transcript and history, while preserving mode and a validated terminal palette. History and transcript each retain at most 100 entries. Preference reads/writes tolerate blocked storage.

- `terminal/parser.js`: 512-character tokenizer with quoted arguments and explicit rejection of control characters, pipes, redirects, chaining, command substitution and background execution.
- `terminal/commands.js`: allowlisted command metadata and pure execution results.
- `terminal/filesystem.js`: read-only virtual paths backed exclusively by existing records; `~`, absolute paths and parent traversal are clamped to `/home/ashiqe`.
- `terminal/Terminal.jsx`: bounded transcript, concise status announcements, keyboard history, completion and window state.
- `terminal/TerminalChrome.jsx`: semantic command output and the accessible macOS-style title bar.

The shell supports read-only navigation and search (`pwd`, `ls`, `cd`, `cat`, `tree`, `find`, `grep`), familiar utilities (`whoami`, `hostname`, `uname`, `echo`, `date`, `history`, `clear`, `help`, `man`) and the existing portfolio commands. Run `help` to discover the complete contract. `resume` returns an accessible link, avoiding popup blocking. No user input becomes executable code, HTML, an operating-system command, a network request or an arbitrary URL. External destinations come only from existing portfolio data; browser navigation actions are fixed internal paths.

Terminal mode renders a centered macOS-style window on desktop and a full-height window on mobile. Red returns to the visual site, yellow minimizes, and green toggles the expanded state. Bone is the default foreground; Orange, Green, Amber and Bone remain available through the validated `theme` command rather than visible controls. Ctrl+C cancels the current line, Ctrl+L clears output, arrows recall history, and Tab completes unique matches or prints bounded candidates. Accepted completions wrap focus to the window controls instead of trapping keyboard users.

The command palette supports Cmd/Ctrl+K, arrows, Enter, Escape, native dialog focus containment and restoration. The highlighted home-page Quick overview link remains; its duplicate footer link is omitted only on the home route.

## Contact configuration

Keep the existing `.env` variables:

```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

EmailJS receives the unchanged `name`, `email`, and `message` fields. Invalid inputs are identified and focused. Errors retain the visitor's text; success clears the form. Missing configuration gives a clear message and existing contact links. Automated tests mock EmailJS and never send a real message.

## Dependencies and commands

Use Node 22.12 or newer (the tested runtime is Node 22.17.1).

Added runtime packages are the three self-hosted font packages and `prop-types` for component validation. Test dependencies are Vitest, React Testing Library, user-event, jest-dom, jsdom, Playwright and axe-core. Existing dependencies were updated within their declared compatible ranges to address audit findings; the new Vitest dependency uses version 5 because earlier versions had audit findings.

```
npm ci
npm run dev
npm run lint
npm test
npm run check:content
npx playwright install chromium firefox webkit
npm run test:e2e
npm run build
npm run preview
node scripts/measure.js
```

`measure.js` expects production preview on port 4173 and writes screenshots plus metrics into ignored `artifacts/`. Playwright automatically starts a local dev server on port 5173 when needed.

## Validation and practical limits

See `docs/VALIDATION.md` for measured results. Accessibility automation complements keyboard and visual checks; it is not a substitute for testing with actual screen readers and physical mobile keyboards. Local throttled performance is a lab sample, not a field-performance guarantee.

The WebGL chunk remains comparatively large, but is optional, lazy loaded, and excluded from mobile and terminal routes. Missing case-study narratives remain intentionally unpublished. Existing project illustrations are retained exactly as stored assets and image-error fallbacks. New decorative covers are documented in [REFINEMENTS.md](REFINEMENTS.md). The site has not been deployed, and a real EmailJS delivery has not been sent as part of validation.

## Implementation references

- [React Three Fiber demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [React Router search parameters](https://reactrouter.com/api/hooks/useSearchParams)
- [Vite SSR builds](https://vite.dev/guide/ssr.html)
- [Vercel rewrite filesystem precedence](https://vercel.com/docs/project-configuration/vercel-json#rewrites)

## Visual refinement pass

See [REFINEMENTS.md](REFINEMENTS.md) for the hero, stack, contact and terminal refinements, generated asset paths, prompts and current validation.
