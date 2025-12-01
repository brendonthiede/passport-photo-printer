# Passport Photo Printer

A simple, privacy-focused web app for creating US passport photos that print at exactly 2" × 2". All processing happens in your browser—your photos never leave your device.

**🌐 [Use it online](https://brendonthiede.github.io/passport-photo-printer)**

## Features

- 📷 Upload any photo via drag-and-drop or file picker
- ✂️ Interactive crop with 1:1 aspect ratio
- 🎯 Head-size verification overlay (1" to 1⅜" guide lines)
- 📏 Prints at precisely 2" × 2" on any paper size
- 🔒 100% client-side—no server uploads, complete privacy
- ⚠️ Image quality warning for low-resolution photos

## Self-Hosting

If you prefer to run this app locally or host it yourself for extra privacy assurance, follow these steps:

### Prerequisites

If you are a [Nix user with Flakes enabled (currently experimental)](https://nixos.wiki/wiki/flakes), you can use the provided `flake.nix`, which is setup to work with [direnv](https://direnv.net/) (tested on Ubuntu 24.04). Otherwise, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)

### Local Development

```bash
# Clone the repository
git clone https://github.com/brendonthiede/passport-photo-printer.git
cd passport-photo-printer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/passport-photo-printer/`

### Build for Production

```bash
# Build the app
npm run build

# The output is in the `dist/` folder
```

### Serve the Production Build

You can serve the `dist/` folder using any static file server:

```bash
# Using npx serve
npx serve dist

# Or using Python
cd dist && python -m http.server 8000

# Or using Node.js http-server
npx http-server dist
```

### Deploy to Your Own Server

Simply copy the contents of the `dist/` folder to any static hosting service:

- **GitHub Pages**: Run `npm run deploy` (requires push access)
- **Netlify/Vercel**: Connect your repo and set build command to `npm run build`, output to `dist`
- **Any web server**: Copy `dist/` contents to your web root

### Docker (Optional)

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
```

```bash
npm run build
docker build -t passport-photo-printer .
docker run -p 8080:80 passport-photo-printer
```

## License

MIT
