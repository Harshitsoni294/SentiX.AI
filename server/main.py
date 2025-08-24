from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
from pathlib import Path
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API keys
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

if os.getenv("GOOGLE_API_KEY") in (None, "") and os.getenv("GEMINI_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

# Initialize client properly
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

@app.get("/")
async def root():
    return {"message": "API is live!"}

class RephraseRequest(BaseModel):
    content: str

@app.post("/rephrase/")
async def rephrase_endpoint(payload: RephraseRequest):
    try:
        prompt = (
            "Generate a 1-page sentiment analysis report based on 15 Reddit posts (topics, descriptions, and comments), do not mention reddit or (according to reddit community) anywhere, only write according to social media posts. Do not use * for bold formatting. Use ## for section heading.Leave one line after heading and two lines after each section.Structure: Overview: 3 lines summarizing the context. Positive Sentiments: 3 lines summarizing what users liked or valued. Negative Sentiments: 3 lines summarizing what users disliked or criticized. Conclusion: Show sentiment distribution as %positive, %negative, %neutral, followed by a 1-line closing statement.Make the writing professional, concise, and wonderful to read.Do not write any extra word other than report content.\n\n"
            f"6 posts:\n{payload.content}"
        )

        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
        )

        return {"rephrased": response.text}
    except Exception as e:
        return {"error": str(e)}
