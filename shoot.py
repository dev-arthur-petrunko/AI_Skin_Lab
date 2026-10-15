"""Generate README screenshots into shots/ (Playwright).

Usage:  python shoot.py      (site must run at http://localhost:3000)

Naming: <page>-<width>-<theme>.png  ->  home-1440-dark.png, perfume-375-light.png ...
Covers: home / catalog / product / perfume x (375, 768, 1440) x (light, dark)
        + AI consultant panel (home-chat-1440-light.png)
"""
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path(__file__).resolve().parent / "shots"
WIDTHS = [(375, 812), (768, 1024), (1440, 900)]
THEMES = ["light", "dark"]
SETTLE_MS = 2600


def first_product_id() -> str:
    with urllib.request.urlopen(f"{BASE}/api/catalog", timeout=20) as r:
        items = json.load(r)["items"]
    return str(items[0]["id"])


def shoot(browser, url: str, theme: str, width: int, height: int, path: Path) -> None:
    ctx = browser.new_context(viewport={"width": width, "height": height})
    ctx.add_init_script(f"try {{ localStorage.setItem('theme', '{theme}'); }} catch (e) {{}}")
    page = ctx.new_page()
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_timeout(SETTLE_MS)
    page.screenshot(path=str(path))
    ctx.close()
    print(f"ok  {path.name}")


def main() -> int:
    OUT.mkdir(exist_ok=True)
    pid = first_product_id()
    pages = {
        "home": "/",
        "catalog": "/catalog",
        "product": f"/product/{urllib.parse.quote(pid, safe='')}",
        "perfume": "/perfume",
    }
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width, height in WIDTHS:
            for theme in THEMES:
                for name, path in pages.items():
                    shoot(
                        browser,
                        BASE + path,
                        theme,
                        width,
                        height,
                        OUT / f"{name}-{width}-{theme}.png",
                    )
        # AI consultant panel open (desktop, light)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script("try { localStorage.setItem('theme', 'light'); } catch (e) {}")
        page = ctx.new_page()
        page.goto(BASE + "/", wait_until="domcontentloaded")
        page.wait_for_timeout(2200)
        page.click("button[aria-label='AI-консультант']")
        page.wait_for_timeout(1600)
        page.screenshot(path=str(OUT / "home-chat-1440-light.png"))
        ctx.close()
        print("ok  home-chat-1440-light.png")
        browser.close()

    wanted = [f"{n}-{w}-{t}.png" for w, _ in WIDTHS for t in THEMES for n in pages]
    wanted.append("home-chat-1440-light.png")
    missing = [f for f in wanted if not (OUT / f).exists()]
    print(f"generated {len(wanted) - len(missing)}/{len(wanted)}")
    if missing:
        print("MISSING:", *missing, sep="\n  ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
