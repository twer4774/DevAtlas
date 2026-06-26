from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://gittrack:gittrack@localhost:5434/gittrack"

    s3_endpoint_url: str = "http://localhost:9002"
    s3_bucket: str = "gittrack-attachments"
    s3_access_key: str = "gittrack"
    s3_secret_key: str = "gittrackSecret"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    github_client_id: str = ""
    github_client_secret: str = ""
    github_webhook_secret: str = ""

    token_encryption_key: str = ""

    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
