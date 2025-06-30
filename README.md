# PennyPincher: AI-Powered Expense Tracker

PennyPincher is a modern, offline-first expense tracking application built with Next.js and powered by Google's Gemini AI. It provides intelligent tools to help you manage your finances effortlessly, from scanning receipts to asking an AI assistant about your spending habits. All your financial data is stored securely on your own device, ensuring complete privacy.

![PennyPincher Dashboard](https://storage.googleapis.com/project-pincher/app-screenshot.png)

## ✨ Key Features

- **AI Assistant**: A voice-enabled conversational interface to ask questions about your finances ("How much did I spend on food last month?") or log transactions ("Log a $15 expense for coffee").
- **Receipt Scanning**: Use your device's camera to take a photo of a receipt, and the AI will automatically extract and itemize the expenses for you.
- **Statement Importing**: Upload PDF or CSV bank/credit card statements, and the AI will parse all transactions, suggest categories, and prepare them for import.
- **Smart Bill Splitting**: Easily split expenses with friends, track who has paid, and manage settlements.
- **Secure Vault**: A password-protected vault to store sensitive information like warranty details or secure notes, fully encrypted on your device.
- **Data Privacy & Security**: All your financial data is stored locally in your browser's storage. It is never uploaded to a central server.
- **Encrypted Backups**: Create password-protected, encrypted backups of all your app data that you can store securely and use for restoration.
- **Customization**: Personalize your experience with light and dark themes and support for over 150 world currencies.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Generative AI**: [Google Gemini](https://deepmind.google/technologies/gemini/) via [Genkit](https://firebase.google.com/docs/genkit)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context with a `useLocalStorage` hook for persistent, offline-first state.

## 🚀 Getting Started

To run this project locally, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- `npm`, `yarn`, or `pnpm`

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repo-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of your project and add your Google AI API key. You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    ```env
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Run the development server:**
    The main application and the Genkit flows run on different ports.

    - **Run the Next.js app:**
      ```bash
      npm run dev
      ```
      The application will be available at `http://localhost:9002`.

    - **Run the Genkit AI flows (optional, for debugging):**
      If you want to view the Genkit developer UI to inspect and debug your AI flows, run this command in a separate terminal:
      ```bash
      npm run genkit:dev
      ```
      The Genkit UI will be available at `http://localhost:4000`.

## 📦 Deployment

This application is optimized for deployment on platforms like [Vercel](https://vercel.com/).

### Environment Variables

Before deploying, ensure you add your `GOOGLE_API_KEY` as an environment variable in your Vercel project settings.

1.  Go to your project's dashboard on Vercel.
2.  Navigate to the **Settings** tab.
3.  Click on **Environment Variables**.
4.  Add a new variable with the name `GOOGLE_API_KEY` and paste your API key as the value.

The app is configured to use this environment variable automatically.

## 📁 Project Structure

```
.
├── src
│   ├── app/                # Next.js App Router pages and layouts
│   ├── ai/                 # Genkit configuration and AI flows
│   │   ├── flows/          # Specific AI-powered features (assistant, scanning, etc.)
│   │   └── genkit.ts       # Genkit initialization
│   ├── components/         # Reusable React components
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/             # ShadCN UI components
│   ├── contexts/           # React context providers for global state
│   ├── hooks/              # Custom React hooks (e.g., useLocalStorage, useExpenses)
│   └── lib/                # Core utilities, types, and constants
├── public/                 # Static assets
└── tailwind.config.ts      # Tailwind CSS configuration
```