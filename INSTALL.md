# Installation Instructions

This project is configured to automatically use `--legacy-peer-deps` for all npm operations.

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd e-learn-ai

# Install dependencies (automatically uses --legacy-peer-deps)
npm install

# Start development server
npm run dev
```

## Configuration Details

### Automatic Legacy Peer Deps
This project uses a `.npmrc` file to automatically apply the `--legacy-peer-deps` flag to all npm operations. This ensures consistent dependency resolution across different environments.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run install:legacy` - Explicitly install with legacy peer deps (redundant but available)

### Environment Setup

Make sure to create a `.env` file with the following variables:

```env
# Authentication
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database
MONGODB_URI=your_mongodb_connection_string

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# OpenAI API (for AI content generation)
OPENAI_API_KEY=your_openai_api_key
```

### Deployment

When deploying to production environments (Vercel, Netlify, etc.), the `.npmrc` file will ensure that the build process uses `--legacy-peer-deps` automatically.

### Troubleshooting

If you encounter dependency issues:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` (will automatically use legacy peer deps)
3. If issues persist, run `npm run install:legacy`
