# 🌌✨ SentiX.AI ✨🌌  
🤖 Smart Sentiment Analyzer  

## 📖 Overview  
**SentiX.AI** is a smart sentiment analyzer that helps you understand how people feel about a company on social media.  

🔍 Just enter a company name,  
🌐 It will search discussions across social media platforms,  
🧠 Send that data to an AI model,  
📊 And return a beautiful sentiment report (Positive 💚 | Neutral 😐 | Negative 💔).  

---

## 🛠️ Tech Stack  
- 🎨 **Client**: React + Tailwind + Vite  
- ⚡ **Server**: FastAPI + Python  
- 🔑 **AI Engine**: Gemini API  
- 🌐 **Reddit API** (via PRAW)  

---

## ⚡ Setup Instructions  

### 1️⃣ Clone the repo  
git clone https://github.com/Harshitsoni294/SentiX.AI.git
cd SentiX.AI


### 2️⃣ Setup Client (Frontend) 🖥️  
cd client
npm install
npm run dev

📄 **.env (Client)**  
REDDIT_CLIENT_ID=your_id_here
REDDIT_CLIENT_SECRET=your_secret_here
APP_USER_AGENT=your_user_agent_here
VITE_REDDIT_PROXY_BASE=http://localhost:8080
VITE_API_BASE=http://localhost:8000


---

### 3️⃣ Setup Server (Backend) ⚙️  
cd server
python -m venv venv
source venv/bin/activate # Mac/Linux
venv\Scripts\activate # Windows

pip install -r requirements.txt
uvicorn main:app --reload --port 8000


📄 **.env (Server)**  
GEMINI_API_KEY=your_gemini_api_key_here

---

## 🎯 Usage Flow  
1. 🏢 Enter a company name in the search bar.  
2. 🌐 The app fetches discussions from Reddit/social media.  
3. 🧠 AI model (Gemini) processes sentiment.  
4. 📊 Get a **Sentiment Report** with clear insights.  

---

## 📸 Screenshots 
<img width="1665" height="759" alt="image" src="https://github.com/user-attachments/assets/4ec1c031-4e6e-4421-b2a3-ebe042956a0d" />




---

## 💡 Future Plans  
 
📈 Trend analysis over time  
🐦 Twitter/X integration  

---

## 🤖 Development Environment
This project is developed using **GitHub Copilot Workspace** - an advanced AI-powered development environment. See [COPILOT_USAGE.md](./COPILOT_USAGE.md) for details about the AI assistance features in use.

## 🤝 Contributing  
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.  


