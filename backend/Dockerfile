FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DATABASE_URL=sqlite:////data/route53.db \
    PORT=8000

EXPOSE 8000

# Seed is idempotent — safe to run on every container start. The SQLite file
# lives on the mounted volume at /data so it survives restarts and redeploys.
CMD ["sh", "-c", "python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
