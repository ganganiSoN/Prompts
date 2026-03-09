# Social App 

A modern, full-stack social media platform featuring a React/Vite frontend and a Node.js/Express backend. 

## Project Architecture

This repository is organized into a monorepo-style structure:
- `/social-app-frontend` - The React Vite client application.
- `/social-app-backend` - The Node.js Express REST API server.

---

## Backend (`/social-app-backend`)

The backend service for the Social App platform. Built with Node.js, Express, and MongoDB.

### Features
- **User Authentication:** JWT-based login, Email Verification (Nodemailer), Password Reset, and Two-Factor Authentication (Speakeasy & QRCode).
- **OAuth Integration:** Google Sign-In support.
- **Social Graph:** Follow/Unfollow user functionality.
- **Content Management:** Create, Read, Update, and Delete posts.
- **Content Moderation:** Automated NSFW image detection (nsfwjs) and text toxicity analysis (TensorFlow Toxicity).
- **Scheduled Tasks:** Node-cron for background jobs.
- **Real-time Engine:** Socket.io integration for instant updates and notifications.
- **Data Export:** PDF generation for user data exports (PDFKit).

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB instance

### Environment Variables

Create a `.env` file in the `social-app-backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5174

# Email SMTP Settings (For Verification & Password Resets)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
```

### Installation & Running
1. Navigate to the backend folder:
   ```bash
   cd social-app-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## Frontend (`/social-app-frontend`)

A modern, responsive social media platform built with React, TypeScript, and Vite.

### Features
- **Modern UI/UX:** Glassmorphic design, smooth animations, and responsive layout powered by Tailwind CSS (Custom Implementation) and Lucide React icons.
- **Rich Interaction:** Real-time post feed, suggestions, likes, bookmarks, and threaded comments.
- **Rich Text Editing:** Integrated Tiptap editor for creating formatted rich-text posts and comments.
- **Authentication:** Full JWT authentication flow including Login, Signup (with Email verification), Password Reset, and Multi-Factor Authentication (MFA). 
- **Google OAuth:** Integrated `@react-oauth/google` for seamless social sign-in.
- **Real-time Features:** Powered by `socket.io-client` for live notifications.
- **Performance State Management:** Beautiful global top-bar loading indicators using `nprogress`.
- **Data Visualization:** Admin and profile analytics using `recharts`.

### Tech Stack
- **Framework:** React 19 + TypeScript 5
- **Build Tool:** Vite
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Styling:** Custom CSS with robust CSS Variables for Light/Dark themes.

### Prerequisites
- Node.js (v18+)

### Setup & Installation

1. Navigate to the frontend directory:
   ```bash
   cd social-app-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Create a `.env` file in the frontend root based on your backend configuration. 
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Development Server

Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5174` (or as specified in the terminal).

### Building for Production

Compile TypeScript and build the static files:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```
