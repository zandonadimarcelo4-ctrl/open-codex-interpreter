"""
Compatibilidade: internal/db.py
"""
import sys
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar do arquivo original na raiz
try:
    # Tentar importar do arquivo original
    from internal.db import Base, get_db, JSONField, engine, SessionLocal
except ImportError:
    # Se não conseguir, criar placeholders básicos
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker, declarative_base
        from sqlalchemy.orm import Session
        from contextlib import contextmanager
        from typing import Generator
        
        # Criar Base básico
        Base = declarative_base()
        
        # Placeholder para engine e Session
        engine = None
        SessionLocal = None
        
        # Placeholder para get_db
        @contextmanager
        def get_db() -> Generator[Session, None, None]:
            if SessionLocal is None:
                raise RuntimeError("Database not initialized")
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
        
        # Placeholder para JSONField
        from sqlalchemy import types as sqlalchemy_types
        import json
        
        class JSONField(sqlalchemy_types.TypeDecorator):
            impl = sqlalchemy_types.Text
            cache_ok = True
            
            def process_bind_param(self, value, dialect):
                if value is not None:
                    return json.dumps(value)
                return value
            
            def process_result_value(self, value, dialect):
                if value is not None:
                    return json.loads(value)
                return value
        
    except ImportError:
        Base = None
        get_db = None
        JSONField = None
        engine = None
        SessionLocal = None

__all__ = ['Base', 'get_db', 'JSONField', 'engine', 'SessionLocal']

