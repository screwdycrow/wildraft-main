# Wildraft - D&D Content Manager Frontend

A beautiful, modern Vue 3 + TypeScript frontend for managing D&D 5E content with glassmorphism UI design.

## 🎨 Features

- **Dark Glassmorphism Theme** - Sleek, modern UI with glass effects
- **Authentication System** - Email/password & Google OAuth
- **Responsive Design** - Works on all devices
- **Type-Safe** - Full TypeScript support
- **State Management** - Pinia for reactive state
- **Modern Stack** - Vue 3, Vite, Vuetify 3

## 🚀 Quick Start

### Prerequisites

- Node.js (v20+ recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.development file
echo "VITE_API_URL=http://localhost:3000/api" > .env.development
echo "VITE_APP_NAME=Wildraft" >> .env.development

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

## 🏗️ Project Structure

```
src/
├── api/              # API client and endpoints
├── assets/           # Static assets
├── components/       # Reusable Vue components
│   ├── auth/        # Authentication components
│   ├── common/      # Common UI components
│   ├── items/       # Item management components
│   ├── library/     # Library components
│   └── tags/        # Tag components
├── composables/      # Vue composables
├── layouts/          # Layout components
├── plugins/          # Plugin configurations
├── router/           # Vue Router setup
├── stores/           # Pinia stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── views/            # Page components
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## 🔧 Configuration

### Environment Variables

Create `.env.development` and `.env.production` files:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Wildraft
```

### API Configuration

The API client is configured in `src/api/axios.ts` with:
- Automatic token refresh
- Request/response interceptors
- Error handling

## 🎨 Glassmorphism Theme

The app features a custom dark glassmorphism theme with:
- Translucent cards with backdrop blur
- Animated gradients
- Smooth transitions
- Custom scrollbar
- Hover effects

Colors:
- Primary: `#DC143C` (Crimson)
- Secondary: `#FFD700` (Gold)
- Accent: `#9C27B0` (Purple)
- Background: `#0F0F1E` (Dark blue-black)

## 📱 Features Implemented

### ✅ Authentication
- [x] Login form with validation
- [x] Registration with password strength meter
- [x] Google OAuth integration
- [x] Token refresh mechanism
- [x] Protected routes
- [x] Auth state management

### 🚧 Coming Soon
- [ ] Library CRUD operations
- [ ] Stat block creator
- [ ] Character sheets
- [ ] Item management
- [ ] Tag system
- [ ] File uploads
- [ ] Sharing & permissions

## 🤝 Backend Integration

Make sure the backend API is running at `http://localhost:3000` (or update `VITE_API_URL`).

Backend repository: [wildraft-prisma-backend](../wildraft-prisma-backend)

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## 🐛 Troubleshooting

### Port already in use
```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 5174
```

### API connection issues
- Ensure backend is running on port 3000
- Check CORS configuration on backend
- Verify `VITE_API_URL` in `.env.development`

### Build errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions welcome! Please read the contributing guidelines first.

---

**Built with ❤️ for D&D enthusiasts**
