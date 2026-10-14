"""Perfume loader unit tests (real parsing rules, no Excel file needed)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.perfumes.loader import (  # noqa: E402
    _gender_type, _slug_base, num, parse_notes, _canon_sku,
)


def test_num_spaces():
    assert num("3 450") == 3450.0
    assert num("1 977") == 1977.0
    assert num(560) == 560.0
    assert num("") is None
    assert num(None) is None
    assert num("1 132,5") == 1132.5


def test_notes_full():
    raw = ("Група ароматів: квіткові, фруктові "
           "Верхні ноти : бергамот, мандарин "
           "Ноти серця : жасмин, півонія "
           "Базові ноти : мускус, ваніль")
    p = parse_notes(raw)
    assert p["families"] == ["Квіткові", "Фруктові"]
    assert "Бергамот" in p["top"] and "Мандарин" in p["top"]
    assert "Жасмин" in p["heart"] and "Півонія" in p["heart"]
    assert "Мускус" in p["base"] and "Ваніль" in p["base"]
    assert p["description"] == ""


def test_notes_free_text():
    p = parse_notes("Вона — ніжність і глибина одночасно.")
    assert p["top"] == [] and p["heart"] == [] and p["base"] == []
    assert "ніжність" in p["description"]


def test_gender_type():
    g, t, d = _gender_type("Жіноча парфумована вода Remember THALIA, 35 мл")
    assert g == "Жіночі" and t == "Парфумована вода"
    assert d.startswith("Remember")
    g2, t2, _ = _gender_type("Туалетна вода для чоловіків Black, 50 мл")
    assert g2 == "Чоловічі" and t2 == "Туалетна вода"


def test_sku_canon_and_slug():
    assert _canon_sku("А123") == "A123"
    assert _slug_base("А123") == "a123"
    assert _slug_base("777777") == "777777"


def test_discount_recalc_shape():
    price, promo = 3450.0, 1977.0
    assert round((1 - promo / price) * 100) == 43
