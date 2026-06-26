import uuid

import boto3
from botocore.config import Config

from app.config import settings

_client = None


def get_s3_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(signature_version="s3v4"),
        )
    return _client


def ensure_bucket() -> None:
    client = get_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except Exception:
        client.create_bucket(Bucket=settings.s3_bucket)


def generate_upload_key(filename: str) -> str:
    return f"attachments/{uuid.uuid4()}/{filename}"


def get_presigned_upload_url(key: str, mime_type: str, expires: int = 3600) -> str:
    client = get_s3_client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": mime_type},
        ExpiresIn=expires,
    )


def get_presigned_download_url(key: str, expires: int = 3600) -> str:
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires,
    )


def delete_object(key: str) -> None:
    get_s3_client().delete_object(Bucket=settings.s3_bucket, Key=key)
