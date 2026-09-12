<div align="center">

# ⚒️ Anvil

**Nineteen everyday tools, forged into one page.**
Text, study, conversion, generation, image, fun, and developer utilities — no sign-up, no server, no build step.

[![Live demo](https://img.shields.io/badge/demo-live-6D63F6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://<your-username>.github.io/anvil/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Made with](https://img.shields.io/badge/made%20with-HTML%20·%20CSS%20·%20JS-1a1a1a?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](#)
[![No dependencies](https://img.shields.io/badge/dependencies-zero-3ECF8E?style=for-the-badge)](#)
[![Deploys to GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222?style=for-the-badge&logo=github)](#deploy-to-github-pages)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-837AFF?style=for-the-badge)](#contributing)

</div>

<br>

<div align="center">
  <img src="docs/screenshot-dark.png" width="80%" alt="Anvil — dark theme home screen">
</div>

<br>

## Why Anvil

Every tab you keep for a case converter, a JSON formatter, a coin flip — one page, one load, no account. Everything below runs client-side. Nothing you type ever leaves your browser.

## Tools

| Text | Study | Converters |
|---|---|---|
| Case converter | Flashcard maker | Unit converter |
| Text counter | Quick quiz generator | Number base converter |
| Text diff checker | Reading time estimator | |

| Generators | Image | For fun | Developer |
|---|---|---|---|
| Lorem ipsum generator | Image to Base64 | Yes / No oracle | JSON formatter |
| Dummy data generator | Image resizer | Random picker | CSS minifier |
| Random name generator | | Coin flip & dice roller | Markdown preview |

## Highlights

- **Zero backend** — pure HTML, CSS, and vanilla JavaScript, deployable as static files
- **Dark by default**, with a refined, persistent light mode
- **Private by design** — the only thing ever stored is flashcards, saved to your browser's `localStorage`
- **Fast** — no framework, no bundler, no build step, no external JS libraries
- **Accessible** — keyboard-navigable modals, visible focus states, `prefers-reduced-motion` respected

## Getting started

```bash
git clone https://github.com/DrPhrma/anvil.git
cd anvil
python3 -m http.server 8000
# open http://localhost:8000
```

Or skip the server entirely and open `index.html` directly in a browser.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch," then pick your branch and root folder.
4. Save — your site publishes at `https://<username>.github.io/<repo>/` within a minute or two.

## Project structure

```
anvil/
├── index.html          Page structure — nav, hero, tool grid, modal shell, footer
├── css/
│   └── style.css       Design tokens (dark + light), layout, components, animation
├── js/
│   ├── tools.js         Tool registry — markup, logic, and events for every tool
│   └── main.js           Site chrome — theme toggle, modal system, scroll reveal
└── README.md
```

## Adding a new tool

Every tool is one object in the `TOOLS` array in `js/tools.js`:

```js
{
  id: "case-converter",
  category: "text",
  name: "Case converter",
  desc: "Switch text between upper, title, camel, snake, and more.",
  icon: '<path d="..."/>',      // inline SVG path(s)
  render: () => `...`,           // HTML string injected into the modal body
  init: (root) => { ... }        // event listeners scoped to that HTML
}
```

`js/main.js` reads the array once, builds the card grid by category, and mounts the matching tool inside a shared modal on click. Add one object — nothing else needs to change.

## Contributing

Issues and pull requests are welcome. If you're adding a tool, keep it dependency-free and client-side only, matching the pattern above.
