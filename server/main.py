from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path
import os

app = FastAPI()

# Enable CORS for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from .env (if present)
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# Ensure your Gemini API key is set as an environment variable GEMINI_API_KEY
# export GEMINI_API_KEY="your_api_key_here"
# Map GEMINI_API_KEY -> GOOGLE_API_KEY if needed for google-genai client
if os.getenv("GOOGLE_API_KEY") in (None, "") and os.getenv("GEMINI_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")
client = genai.Client()

class RephraseRequest(BaseModel):
    content: str

@app.post("/rephrase/")
async def rephrase_endpoint(payload: RephraseRequest):
    try:
        prompt = (
            "Rephrase the following paragraph to be clearer and concise while "
            "preserving the original meaning. Do not add extra information.\n\n"
            f"Paragraph:\n{payload.content}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )

        rephrased_text = response.text
        return {"rephrased": rephrased_text}
    except Exception as e:
        return {"error": str(e)}

