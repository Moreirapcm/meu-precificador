"""Configuração do Gunicorn para produção."""
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
workers = 2
timeout = 120


def on_starting(server):
    """Inicializa o banco de dados ao iniciar o servidor."""
    from app import init_db
    init_db()
