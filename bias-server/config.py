import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

ML_SERVER_URL = os.getenv("ML_SERVER_URL", "http://localhost:8000")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
