import sys
sys.path.insert(0, r'C:\Users\bakra\Desktop\PyMastery\backend')
import os
os.chdir(r'C:\Users\bakra\Desktop\PyMastery\backend')
from dotenv import load_dotenv
load_dotenv(override=True)
key = os.getenv('GEMINI_API_KEY')
print(f'KEY: {repr(key[:20] if key else None)}')
from services.gemini_service import GeminiService
svc = GeminiService()
print(f'is_available: {svc.is_available}')
print(f'api_key set: {bool(svc.api_key)}')
