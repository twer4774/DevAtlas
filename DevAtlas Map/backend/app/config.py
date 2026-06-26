from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://akw:akw@localhost:5433/akw"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_bucket: str = "akw-documents"
    s3_access_key: str = "akw"
    s3_secret_key: str = "akwsecret"
    cors_origins: str = "http://localhost:5173"

    # When set (e.g. from env DEVATLAS_API_TOKEN), all routes except OPTIONS and GET /health
    # require Authorization: Bearer <same value>. Leave unset for open local API.
    # Env: DEVATLAS_API_TOKEN (see pydantic-settings env naming)
    devatlas_api_token: str | None = None

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
