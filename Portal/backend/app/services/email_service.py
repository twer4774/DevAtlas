import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


async def send_invite_email(to_email: str, org_name: str, invited_by: str, invite_url: str) -> None:
    if not settings.smtp_host or not settings.smtp_user:
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[DevAtlas] {org_name} 조직에 초대되었습니다"
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to_email

    text_body = (
        f"{invited_by}님이 DevAtlas의 {org_name} 조직에 초대했습니다.\n\n"
        f"초대 수락 링크:\n{invite_url}\n\n"
        "이 링크는 7일 후 만료됩니다."
    )

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;background:#0d1117;color:#e6edf3;margin:0;padding:40px;">
  <div style="max-width:480px;margin:0 auto;background:#161b22;border:1px solid #21262d;border-radius:12px;padding:32px;">
    <div style="margin-bottom:24px;">
      <span style="font-size:22px;font-weight:700;color:#e6edf3;">DevAtlas</span>
    </div>
    <h2 style="margin:0 0 8px;font-size:18px;color:#e6edf3;">조직 초대</h2>
    <p style="margin:0 0 24px;color:#7d8590;font-size:14px;line-height:1.6;">
      <strong style="color:#e6edf3;">{invited_by}</strong>님이
      <strong style="color:#e6edf3;">{org_name}</strong> 조직에 초대했습니다.
    </p>
    <a href="{invite_url}"
       style="display:inline-block;background:#1f6feb;color:#ffffff;text-decoration:none;
              padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      초대 수락하기
    </a>
    <p style="margin:24px 0 0;color:#484f58;font-size:12px;">
      이 링크는 7일 후 만료됩니다. 본인이 요청하지 않았다면 무시하세요.
    </p>
  </div>
</body>
</html>"""

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=settings.smtp_use_tls,
    )
