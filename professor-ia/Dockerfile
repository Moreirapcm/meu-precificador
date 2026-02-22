FROM python:3.12-slim

WORKDIR /app

# Instalar fontes para a lousa e curl para healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends fonts-dejavu-core curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar backend e frontend
COPY app.py .
COPY gunicorn.conf.py .
COPY templates/ templates/
COPY static/ static/

# Criar volume para o banco de dados
VOLUME /app/data

ENV DB_PATH=/app/data/professor_ia.db
ENV PORT=5000

EXPOSE 5000

# Inicializar o banco e rodar com gunicorn
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
