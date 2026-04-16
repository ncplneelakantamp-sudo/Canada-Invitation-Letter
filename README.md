# Canadian Invitation Letter Generator

A professional tool to generate high-quality Canadian invitation letters for Visitor Visa and Super Visa applications.

## Deployment on Vercel

This project is optimized for deployment on Vercel. Follow these steps to deploy:

1. **Push to GitHub/GitLab/Bitbucket**: Ensure your code is in a repository.
2. **Import to Vercel**: Go to [Vercel](https://vercel.com) and import your repository.
3. **Configure Environment Variables**:
  - In the Vercel project settings, add an environment variable named `VITE_GEMINI_API_KEY`.
   - Set its value to your Google Gemini API key.
4. **Build Settings**:
   - Vercel should automatically detect the Vite framework.
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Deploy**: Click "Deploy".

## Features

- **Multi-Applicant Support**: Generate letters for one or two applicants.
- **AI-Powered Extraction**: Upload documents to automatically fill in details.
- **Super Visa Ready**: Includes LICO requirement statements and specific legal undertakings.
- **Professional Formatting**: Generates clean, formal tables and paragraphs.
- **Document Management**: Manage supporting documents for all parties.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **AI**: Google Gemini API (@google/genai)
- **Document Generation**: docx, file-saver
- **UI Components**: shadcn/ui, Lucide React
"# Canada-Invitation-Letter" 
