🚀 AI Resume Analyzer
<div align="center">

🧠 AI-powered Resume Evaluation Platform

Analyze resumes, match with jobs, and get ATS scores with smart feedback.
<img width="3600" height="1040" alt="image" src="https://github.com/user-attachments/assets/db309d52-4e88-410c-a3db-bf4bda4807b4" />

</div>
📌 Overview

AI Resume Analyzer is a full-stack web application that allows users to:

Upload resumes 📄
Analyze them using AI 🤖
Get ATS (Applicant Tracking System) scores 📊
Receive personalized feedback based on job descriptions 🎯

It is built using modern technologies like React Router, TypeScript, Tailwind CSS, and Puter.js, with a focus on performance, scalability, and clean UI.

✨ Key Features
🔐 Authentication
Serverless authentication using Puter.js
No backend setup required
📂 Resume Management
Upload and store multiple resumes
Organized and secure storage
🤖 AI Resume Analysis
ATS score generation
Job-specific feedback
Smart evaluation based on job descriptions
🎨 Modern UI/UX
Responsive design (mobile + desktop)
Clean and reusable components
Built with Tailwind CSS + shadcn/ui
⚡ Performance
Server-Side Rendering (SSR)
Hot Module Replacement (HMR)
Fast builds with Vite
🛠️ Tech Stack
Technology	Description
⚛️ React	UI library for building components
🔀 React Router v7	Routing + data loading
🎨 Tailwind CSS	Utility-first CSS framework
🟦 TypeScript	Type-safe JavaScript
⚡ Vite	Fast build tool
🧠 Puter.js	Auth, storage & AI services
🐻 Zustand	Lightweight state management
📂 Project Structure
├── build/
│   ├── client/      # Static frontend assets
│   └── server/      # Server-side code
├── app/             # Main application code
├── public/          # Static files
├── package.json
⚙️ Installation & Setup
✅ Prerequisites

Make sure you have:

Node.js (>= 18)
npm / yarn
Git
📥 Clone Repository
git clone https://github.com/adrianhajdin/ai-resume-analyzer.git
cd ai-resume-analyzer
📦 Install Dependencies
npm install
▶️ Run Development Server
npm run dev

👉 App will run on:
http://localhost:5173

🏗️ Build for Production
npm run build
🐳 Docker Deployment
# Build Docker image
docker build -t ai-resume-analyzer .

# Run container
docker run -p 3000:3000 ai-resume-analyzer
🌐 Deployment Options

You can deploy this app on:

AWS ECS
Google Cloud Run
Azure Container Apps
Railway
Fly.io
DigitalOcean
📚 Learning Resources

🎥 Full tutorial:
https://www.youtube.com/watch?v=XUkNR-JfHwo

📦 Assets & UI Kit:
https://jsmastery.com/video-kit

🚀 Future Improvements
📊 Resume analytics dashboard
📈 Performance insights
🧠 Advanced AI feedback (LLM fine-tuning)
📑 Multi-format resume support (PDF, DOCX parsing)
🌍 Multi-language support
🤝 Contributing

Contributions are welcome!

# Fork the repo
# Create your branch
git checkout -b feature/your-feature

# Commit changes
git commit -m "Added new feature"

# Push
git push origin feature/your-feature
🧑‍💻 Author

Built with ❤️ using modern React ecosystem.

📄 License

This project is licensed under the MIT License.

⭐ Support

If you like this project:

👉 Give it a ⭐ on GitHub
👉 Share with others
