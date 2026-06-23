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
        try:
            _client.create_bucket(Bucket=settings.s3_bucket)
        except _client.exceptions.BucketAlreadyOwnedByYou:
            pass
        except Exception:
            pass
    return _client


def upload_document(file_bytes: bytes, content_type: str, key: str) -> str:
    client = get_s3_client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return key


def get_presigned_url(key: str, expires: int = 3600) -> str:
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires,
    )


def delete_document(key: str) -> None:
    client = get_s3_client()
    client.delete_object(Bucket=settings.s3_bucket, Key=key)
