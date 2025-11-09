"""
Compatibilidade: internal/db.py
Importa do arquivo original na raiz se existir, senão cria implementação básica
"""
import sys
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Tentar importar do arquivo original (se existir um internal/db.py na raiz)
# Como não existe, vamos criar uma implementação básica
try:
    from sqlalchemy import create_engine, MetaData, types
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import scoped_session, sessionmaker
    from sqlalchemy.pool import QueuePool, NullPool
    from contextlib import contextmanager
    from typing import Generator, Any, Optional
    from sqlalchemy.sql.type_api import _T
    
    # Importar configurações do env
    from open_webui.env import (
        DATABASE_URL,
        DATABASE_SCHEMA,
        DATABASE_POOL_SIZE,
        DATABASE_POOL_MAX_OVERFLOW,
        DATABASE_POOL_TIMEOUT,
        DATABASE_POOL_RECYCLE,
    )
    
    # JSONField
    class JSONField(types.TypeDecorator):
        impl = types.Text
        cache_ok = True
        
        def process_bind_param(self, value: Optional[_T], dialect) -> Any:
            if value is not None:
                import json
                return json.dumps(value)
            return value
        
        def process_result_value(self, value: Optional[_T], dialect) -> Any:
            if value is not None:
                import json
                return json.loads(value)
            return value
    
    # Criar engine
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    if "sqlite" in SQLALCHEMY_DATABASE_URL:
        # Para SQLite, garantir que o diretório do arquivo existe
        import os
        db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
        if db_path:
            db_dir = os.path.dirname(db_path)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
        
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )
    else:
        if DATABASE_POOL_SIZE > 0:
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                pool_size=DATABASE_POOL_SIZE,
                max_overflow=DATABASE_POOL_MAX_OVERFLOW,
                pool_timeout=DATABASE_POOL_TIMEOUT,
                pool_recycle=DATABASE_POOL_RECYCLE,
                pool_pre_ping=True,
                poolclass=QueuePool,
            )
        else:
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, poolclass=NullPool
            )
    
    # Criar SessionLocal
    SessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
    )
    
    # Criar Base
    metadata_obj = MetaData(schema=DATABASE_SCHEMA)
    Base = declarative_base(metadata=metadata_obj)
    Session = scoped_session(SessionLocal)
    
    # Criar get_db
    def get_session():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    get_db = contextmanager(get_session)
    
except ImportError as e:
    # Se não conseguir importar, criar placeholders
    Base = None
    get_db = None
    JSONField = None
    engine = None
    SessionLocal = None
    Session = None
    print(f"Warning: Could not initialize database: {e}")

__all__ = ['Base', 'get_db', 'JSONField', 'engine', 'SessionLocal', 'Session']

