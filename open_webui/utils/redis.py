import inspect
from urllib.parse import urlparse

import logging

import redis

from open_webui.env import REDIS_SENTINEL_MAX_RETRY_COUNT

log = logging.getLogger(__name__)


_CONNECTION_CACHE = {}


class SentinelRedisProxy:
    def __init__(self, sentinel, service, *, async_mode: bool = True, **kw):
        self._sentinel = sentinel
        self._service = service
        self._kw = kw
        self._async_mode = async_mode

    def _master(self):
        return self._sentinel.master_for(self._service, **self._kw)

    def __getattr__(self, item):
        master = self._master()
        orig_attr = getattr(master, item)

        if not callable(orig_attr):
            return orig_attr

        FACTORY_METHODS = {"pipeline", "pubsub", "monitor", "client", "transaction"}
        if item in FACTORY_METHODS:
            return orig_attr

        if self._async_mode:

            async def _wrapped(*args, **kwargs):
                for i in range(REDIS_SENTINEL_MAX_RETRY_COUNT):
                    try:
                        method = getattr(self._master(), item)
                        result = method(*args, **kwargs)
                        if inspect.iscoroutine(result):
                            return await result
                        return result
                    except (
                        redis.exceptions.ConnectionError,
                        redis.exceptions.ReadOnlyError,
                    ) as e:
                        if i < REDIS_SENTINEL_MAX_RETRY_COUNT - 1:
                            log.debug(
                                "Redis sentinel fail-over (%s). Retry %s/%s",
                                type(e).__name__,
                                i + 1,
                                REDIS_SENTINEL_MAX_RETRY_COUNT,
                            )
                            continue
                        log.error(
                            "Redis operation failed after %s retries: %s",
                            REDIS_SENTINEL_MAX_RETRY_COUNT,
                            e,
                        )
                        raise e from e

            return _wrapped

        else:

            def _wrapped(*args, **kwargs):
                for i in range(REDIS_SENTINEL_MAX_RETRY_COUNT):
                    try:
                        method = getattr(self._master(), item)
                        return method(*args, **kwargs)
                    except (
                        redis.exceptions.ConnectionError,
                        redis.exceptions.ReadOnlyError,
                    ) as e:
                        if i < REDIS_SENTINEL_MAX_RETRY_COUNT - 1:
                            log.debug(
                                "Redis sentinel fail-over (%s). Retry %s/%s",
                                type(e).__name__,
                                i + 1,
                                REDIS_SENTINEL_MAX_RETRY_COUNT,
                            )
                            continue
                        log.error(
                            "Redis operation failed after %s retries: %s",
                            REDIS_SENTINEL_MAX_RETRY_COUNT,
                            e,
                        )
                        raise e from e

            return _wrapped


def parse_redis_service_url(redis_url):
    parsed_url = urlparse(redis_url)
    if parsed_url.scheme != "redis" and parsed_url.scheme != "rediss":
        raise ValueError("Invalid Redis URL scheme. Must be 'redis' or 'rediss'.")

    return {
        "username": parsed_url.username or None,
        "password": parsed_url.password or None,
        "service": parsed_url.hostname or "mymaster",
        "port": parsed_url.port or 6379,
        "db": int(parsed_url.path.lstrip("/") or 0),
    }


def get_redis_connection(
    redis_url,
    redis_sentinels,
    redis_cluster=False,
    async_mode=False,
    decode_responses=True,
):
    # Verificar se redis_url está vazio ou None
    if not redis_url or not redis_url.strip():
        log.debug("Redis URL não configurada. Redis será desabilitado.")
        return None

    # Verificar se redis_url é uma URL válida
    try:
        parsed = urlparse(redis_url)
        if not parsed.scheme or parsed.scheme not in ("redis", "rediss", "unix"):
            log.debug(f"Redis URL inválida (scheme não reconhecido): {redis_url}. Redis será desabilitado.")
            return None
    except Exception as e:
        log.debug(f"Erro ao parsear Redis URL: {e}. Redis será desabilitado.")
        return None

    cache_key = (
        redis_url,
        tuple(redis_sentinels) if redis_sentinels else (),
        async_mode,
        decode_responses,
    )

    if cache_key in _CONNECTION_CACHE:
        return _CONNECTION_CACHE[cache_key]

    connection = None

    try:
        if async_mode:
            import redis.asyncio as redis

            # If using sentinel in async mode
            if redis_sentinels:
                redis_config = parse_redis_service_url(redis_url)
                sentinel = redis.sentinel.Sentinel(
                    redis_sentinels,
                    port=redis_config["port"],
                    db=redis_config["db"],
                    username=redis_config["username"],
                    password=redis_config["password"],
                    decode_responses=decode_responses,
                )
                connection = SentinelRedisProxy(
                    sentinel,
                    redis_config["service"],
                    async_mode=async_mode,
                )
            elif redis_cluster:
                connection = redis.cluster.RedisCluster.from_url(
                    redis_url, decode_responses=decode_responses
                )
            else:
                connection = redis.from_url(redis_url, decode_responses=decode_responses)
        else:
            # If using sentinel in sync mode
            if redis_sentinels:
                redis_config = parse_redis_service_url(redis_url)
                sentinel = redis.sentinel.Sentinel(
                    redis_sentinels,
                    port=redis_config["port"],
                    db=redis_config["db"],
                    username=redis_config["username"],
                    password=redis_config["password"],
                    decode_responses=decode_responses,
                )
                connection = SentinelRedisProxy(
                    sentinel,
                    redis_config["service"],
                    async_mode=async_mode,
                )
            elif redis_cluster:
                connection = redis.cluster.RedisCluster.from_url(
                    redis_url, decode_responses=decode_responses
                )
            else:
                connection = redis.from_url(redis_url, decode_responses=decode_responses)
    except Exception as e:
        log.warning(f"Erro ao conectar ao Redis: {e}. Redis será desabilitado.")
        return None

    if connection:
        _CONNECTION_CACHE[cache_key] = connection

    return connection


def get_sentinels_from_env(redis_sentinel_hosts, redis_sentinel_port):
    if not redis_sentinel_hosts:
        return []

    hosts = redis_sentinel_hosts.split(",")
    sentinels = [(host.strip(), int(redis_sentinel_port)) for host in hosts]
    return sentinels

