FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY cron/reload_catalog.conf /etc/cron.d/reload_catalog


RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

RUN chmod 0644 /etc/cron.d/reload_catalog \
 && crontab /etc/cron.d/reload_catalog \
 && mkdir -p /var/log

# Data (price.xlsx + images) is mounted as a volume at runtime.
RUN mkdir -p /app/data/images

EXPOSE 8000

CMD ["sh", "-c", "/usr/sbin/cron; uvicorn app.main:app --host 0.0.0.0 --port 8000"]
