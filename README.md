# 🛡️ The Hacker Kit

> A curated collection of cybersecurity tools — organized, searchable, and ready for security research, penetration testing, and learning.

[🚀 Live Demo](https://patkarmandar.github.io/HackKit) • [Features](#features) • [Quick Start](#quick-start)

## About

The Hacker Kit is a comprehensive directory of cybersecurity tools, categorized by technique, category, and target. Fast search, smart filters, and zero dependencies.

## Features

- 🔍 Instant search with autocomplete
- 🏷️ Filter by techniques, categories, targets
- ⭐ Favorites system with localStorage
- 🌓 Dark/light theme toggle
- ⌨️ Keyboard shortcuts (`/` search, `?` help, `D` dark mode, `V` view)
- 🔗 Share filtered results via URL
- 📱 Fully responsive

## Tech Stack

Pure vanilla JavaScript • No frameworks • No dependencies

- HTML5, CSS3, Vanilla JS
- Bootstrap Icons (CDN)
- LocalStorage API

## Quick Start

```bash
# Clone
git clone https://github.com/patkarmandar/HackKit.git
cd HackKit

# Run local server
python -m http.server 8000
# or
npx http-server

# Open browser
open http://localhost:8000
```

## Project Structure

```
HackKit/
├── index.html
├── css/style.min.css
├── js/script.min.js
└── data/
    ├── data.json
    └── tags.json
```

## Adding Content

### Add New Tool

Edit `data/data.json`:

```json
{
  "name": "ToolName",
  "url": "https://tool-website.com",
  "source": "https://github.com/user/repo",
  "description": "Brief description of the tool.",
  "techniques": ["exploitation"],
  "categories": ["web_app"],
  "targets": ["web"]
}
```

### Add New Tag

Edit `data/tags.json`:

```json
{
  "techniques": ["exploitation", "reconnaissance", "new_technique"],
  "categories": ["web_app", "network_scanner", "new_category"],
  "targets": ["web", "network", "new_target"]
}
```

## Contributing

Contributions are welcome! Here's how:

1. Fork repository
2. Add tool to `data/data.json`
3. Submit Pull Request

**Guidelines:** Ensure tool is legitimate, provide accurate URLs, use appropriate tags.

## 📮 Support

Found a bug? Want a feature? Have a tool to add?

- 🐛 [Report Bug](https://github.com/patkarmandar/HackKit/issues)
- 💡 [Request Feature](https://github.com/patkarmandar/HackKit/issues)
- 🔧 [Submit Tool](https://github.com/patkarmandar/HackKit/pulls)

<p align="center">
  <sub>Made with 🛡️ by <a href="https://github.com/patkarmandar">Mandar</a></sub>
</p>
