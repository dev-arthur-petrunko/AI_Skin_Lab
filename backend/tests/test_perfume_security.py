"""SSRF / URL safety tests for perfume image downloads."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.perfumes.images import normalize_url, safe_fetch, _host_allowed  # noqa: E402


def test_drive_conversion():
    u = "https://drive.google.com/file/d/abc123XYZ/view?usp=sharing"
    assert normalize_url(u) == "https://drive.google.com/uc?export=download&id=abc123XYZ"


def test_reject_private_hosts():
    assert not _host_allowed("127.0.0.1")
    assert not _host_allowed("localhost")
    assert not _host_allowed("192.168.1.10")
    assert not _host_allowed("10.0.0.5")
    assert not _host_allowed("172.16.3.4")
    assert not _host_allowed("169.254.169.254")
    assert not _host_allowed("0.0.0.0")
    assert not _host_allowed("::1")


def test_safe_fetch_rejects_non_http():
    assert safe_fetch("ftp://example.com/a.png") is None
    assert safe_fetch("file:///etc/passwd") is None
    assert safe_fetch("") is None


def test_safe_fetch_rejects_loopback_url():
    assert safe_fetch("http://127.0.0.1:8000/api/health") is None
    assert safe_fetch("http://192.168.0.1/x.png") is None
