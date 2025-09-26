# TikTok Video Analyzer

A Next.js 14 application for analyzing TikTok viral videos using AI to extract insights about what makes them successful.

## Task 1 Implementation Summary

Successfully initialized and configured the Next.js project with the following components:

### ✅ Completed Items

1. **Next.js 14 Project Initialization**
   - Created Next.js 14 project with App Router
   - Configured TypeScript for type safety
   - Set up Tailwind CSS for styling

2. **Project Structure**
   ```
   tiktok-video-analyzer/
   ├── app/
   │   ├── actions/        # Server Actions
   │   ├── api/analyze/    # API routes
   │   └── components/     # React components
   ├── lib/
   │   ├── services/       # Business logic services
   │   ├── types/         # TypeScript type definitions
   │   └── utils/         # Utility functions
   └── tests/
       ├── unit/          # Unit tests
       └── integration/   # Integration tests
   ```

3. **Environment Configuration**
   - Created `.env.example` template with all required environment variables
   - Set up `.env.local` for development configuration
   - Configured Google Cloud Storage and Gemini API settings

4. **Dependencies Installed**
   - Production: `@google-cloud/storage`, `@google/generative-ai`, `puppeteer`, `axios`, `dotenv`
   - Development: Testing libraries (Jest, Testing Library), TypeScript types

5. **Testing Infrastructure**
   - Configured Jest with Next.js support
   - Created comprehensive unit tests for:
     - Type definitions validation
     - Input validation utilities (TikTok URLs, share text)
     - State management system
   - All 35 tests passing successfully

## Project Features Implemented

### Type System (`lib/types/index.ts`)
- Processing status types
- Video metadata interfaces
- Analysis result structures
- Error code enumerations

### Validation Utilities (`lib/utils/validation.ts`)
- TikTok URL validation
- Share text (口令) detection
- URL extraction from share text
- File size validation
- Session ID generation

### State Management (`lib/utils/state-manager.ts`)
- In-memory session state tracking
- Automatic session cleanup (30-minute timeout)
- Progress tracking
- Error handling
- Singleton pattern implementation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud Storage account
- Gemini API key

### Installation

1. Clone the repository:
```bash
cd tiktok-video-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test:coverage
```

Watch mode for development:
```bash
npm test:watch
```

### Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Next Steps

The foundation is now ready for implementing the remaining tasks:
- Task 2: Implement main page layout and UI components
- Task 3: Implement TikTok link parsing service
- Task 4: Implement video download service
- Task 5: Implement Google Cloud Storage integration
- Task 6: Implement Gemini AI analysis service
- And more...

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
