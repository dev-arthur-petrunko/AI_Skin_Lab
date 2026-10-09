FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the u2net segmentation model so cutout generation works offline
# (rembg would otherwise download it on first use).
RUN python -c "from rembg import new_session; new_session('u2net')"

COPY app ./app
COPY scripts ./scripts

# Data (price.xlsx + images + cutouts) is mounted as a volume at runtime.
RUN mkdir -p /app/data/images /app/data/cutouts

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
