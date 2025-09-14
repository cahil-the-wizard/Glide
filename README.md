# Glide - AI-Powered Task Breakdown

Transform overwhelming tasks into manageable, actionable steps with AI assistance.

## 🚀 Features

- **AI Task Breakdown**: Enter vague or overwhelming tasks and get step-by-step guidance
- **User Authentication**: Secure sign-up and login with Supabase
- **Interactive Flows**: Check off steps and track progress
- **Onboarding Experience**: New users get a guided "Learn Glide Basics" flow
- **Responsive Design**: Works beautifully on web browsers
- **Real-time Updates**: Live sync across sessions

## 🛠 Tech Stack

- **Frontend**: React Native with Expo (Web)
- **AI**: Google Gemini API for task breakdown
- **Backend**: Supabase (Database + Authentication)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cahil-the-wizard/Glide.git
   cd Glide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your API keys:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL from `setup-supabase.sql` in your Supabase SQL Editor
   - Run `auth-policies.sql` to set up authentication policies

5. **Start Development**
   ```bash
   npm run web
   ```

## 🎯 Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in and create an API key
3. Copy to your `.env` file

### Supabase Setup
1. Create project at [Supabase](https://supabase.com/dashboard)
2. Go to Settings → API
3. Copy Project URL and anon public key
4. Run the provided SQL scripts in SQL Editor

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Main app screens
├── services/           # API and database services
├── types/              # TypeScript type definitions
└── config/             # Configuration files
```

## 🎨 Key Components

- **AuthScreen**: User login/signup interface
- **NewFlowScreen**: AI-powered task input
- **FlowDetailScreen**: Step-by-step task view
- **Sidebar**: Navigation and flows list

## 🔄 Deployment

### Vercel Deployment
1. Connect your GitHub repo to Vercel
2. Choose "Other" as framework preset
3. Set build command: `expo export:web`
4. Set output directory: `dist`
5. Add environment variables in Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or building upon.

## 🎉 Acknowledgments

Built with ❤️ using modern web technologies and AI assistance.