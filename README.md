# Anvil

Nineteen everyday utilities — text, study, conversion, generation, image, fun, and developer tools — in a single, fast, premium-feeling page. Pure HTML, CSS, and vanilla JavaScript. No build step, no backend, no dependencies beyond one Google Font.

## Run it locally

No build tools needed. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser (a couple of tools that read files, like the image tools, work fine straight from disk too).

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository (root of the repo, or a `/docs` folder).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", pick your branch and the folder that contains `index.html`.
4. Save. GitHub will publish the site at `https://<username>.github.io/<repo>/` within a minute or two.

No environment variables, no server, no database — it's static files only.

## Project structure

```
anvil/
├── index.html          Page structure: nav, hero, tool grid, modal shell, footer
├── css/
│   └── style.css       Design tokens (dark + light theme), layout, components, animation
├── js/
│   ├── tools.js         Tool registry — each tool's markup, logic, and event wiring
│   └── main.js           Site chrome — theme toggle, card rendering, modal, scroll reveal
└── README.md
```

## How tools are wired

Every tool is one object in the `TOOLS` array in `js/tools.js`:

```js
{
  id: "case-converter",
  category: "text",
  name: "Case converter",
  desc: "...",
  icon: "<path .../>",       // inline SVG path(s), rendered inside a shared <svg> wrapper
  render: () => "...",        // returns the HTML string injected into the modal body
  init: (root) => { ... }     // attaches event listeners scoped to that HTML
}
```

`js/main.js` reads this array once at load, builds the card grid per category, and opens the matching tool's markup inside a shared modal when a card is clicked. Adding a new tool means adding one object to the array — no other file needs to change.

## Data & privacy

Every tool runs entirely in the browser. Flashcards are the only thing persisted, saved to `localStorage` under `anvil_flashcards` so they survive a refresh. Nothing is sent to a server; there is no server.

## Browser support

Built with standard modern CSS (custom properties, `color-mix`, `backdrop-filter`) and ES6+ JavaScript. Works in current Chrome, Firefox, Safari, and Edge. `prefers-reduced-motion` is respected throughout.
