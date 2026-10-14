"""Download perfume photos from Excel hyperlinks into data/perfume_photos_raw/ + cache."""
import sys, pathlib, re
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "backend"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.perfumes.loader import load_products, write_reports
from app.perfumes.images import safe_fetch, normalize_url, _save_webp, CACHE_DIR
from io import BytesIO

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "perfume_photos_raw"

def main():
    products, report = load_products()
    print("products:", len(products))
    photos = []
    RAW.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    ok = fail = 0
    for p in products:
        url = normalize_url(p.get("photo_url") or "")
        status = "ok"
        if not url:
            status = "немає посилання"
        else:
            data = safe_fetch(url)
            if data is None:
                status = "недоступно"
            else:
                head = data[:20].lstrip().lower()
                if head.startswith((b"<!doctype", b"<html")):
                    status = "not_image"
                else:
                    base = re.sub(r"[^0-9A-Za-z]+", "", p["sku"]).lower()
                    ext = ".png" if data[:4] == b"\x89PNG" else ".jpg"
                    (RAW / f"{base}{ext}").write_bytes(data)
                    _save_webp(data, CACHE_DIR / f"{base}.webp")
                    ok += 1
        if status != "ok":
            fail += 1
            print(" FAIL", p["sku"], status, url[:80] if url else "")
        photos.append({"sku": p["sku"], "slug": p["slug"], "url": url or "", "status": status})
    write_reports(products, report, photos)
    print(f"downloaded ok={ok} fail={fail}; report: data/perfume_report.csv, data/perfume_photos_report.csv")
    # quick stats
    genders = {}
    for p in products:
        genders[p["gender"]] = genders.get(p["gender"], 0) + 1
    print("genders:", genders)
    print("brands:", sorted({p["brand"] for p in products}))
    no_notes = [p["sku"] for p in products if not p["notes"]["top"] and not p["notes"]["heart"] and not p["notes"]["base"] and not p["description"]]
    print("without notes/desc:", no_notes)
    dup = [r for r in report if r.get("type") == "sku"]
    print("sku report rows:", len(dup))
    disc = [r for r in report if r.get("type") == "discount"]
    print("discount mismatches:", len(disc))

if __name__ == "__main__":
    main()
