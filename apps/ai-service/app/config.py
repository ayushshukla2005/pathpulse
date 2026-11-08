import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    AI_SERVICE_TOKEN: str = os.getenv("AI_SERVICE_TOKEN", "dev-pathpulse-ai-internal-service-token-secret")
    MODEL_VERSION: str = "pathpulse-classifier-v1.0.0"
    DUPLICATE_THRESHOLD: float = 0.65
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()
