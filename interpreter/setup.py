"""
Setup script para Open Interpreter com suporte a Ollama
"""
from setuptools import setup, find_packages
from pathlib import Path

# Ler README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

setup(
    name="open-interpreter-ollama",
    version="0.1.0",
    description="Open Interpreter com suporte a Ollama (modo local)",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="ANIMA Project",
    author_email="",
    url="https://github.com/your-repo/open-interpreter-ollama",
    packages=find_packages(),
    install_requires=[
        "rich>=13.0.0",
        "requests>=2.31.0",
        "tokentrim>=0.1.0",
        "websockets>=11.0.0",  # Para servidor WebSocket
        # OpenAI é opcional - não incluir como dependência obrigatória
        # "openai>=0.27.0",  # Opcional
    ],
    extras_require={
        "openai": ["openai>=0.27.0"],  # Dependência opcional para OpenAI
    },
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "interpreter=interpreter.cli:main",
            "interpreter-server=interpreter.server:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)

