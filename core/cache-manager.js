/**
 * DASHFLOW - Cache Manager
 * Sistema de gerenciamento de cache para otimização de performance
 * Controla cache de dados, modules e assets
 */

class CacheManager {
    constructor() {
        this.caches = {
            data: new Map(),
            modules: new Map(),
            assets: new Map(),
            api: new Map()
        };
        
        this.config = {
            maxSize: {
                data: 100,      // Máximo 100 entradas de dados
                modules: 10,    // Máximo 10 módulos em cache
                assets: 50,     // Máximo 50 assets em cache
                api: 200        // Máximo 200 respostas de API
            },
            ttl: {
                data: 5 * 60 * 1000,      // 5 minutos
                modules: 60 * 60 * 1000,   // 1 hora
                assets: 24 * 60 * 60 * 1000, // 24 horas
                api: 2 * 60 * 1000         // 2 minutos
            }
        };
        
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        
        // Inicializar limpeza automática
        this.startCleanupInterval();
        
        console.log('[CacheManager] Sistema de cache inicializado');
    }

    /**
     * Armazena um item no cache
     */
    set(cacheType, key, value, customTtl = null) {
        try {
            if (!this.caches[cacheType]) {
                throw new Error(`Tipo de cache inválido: ${cacheType}`);
            }

            const cache = this.caches[cacheType];
            const ttl = customTtl || this.config.ttl[cacheType];
            const expiresAt = Date.now() + ttl;

            // Verificar limite de tamanho
            if (cache.size >= this.config.maxSize[cacheType]) {
                this.evictOldest(cacheType);
            }

            const cacheItem = {
                value: value,
                createdAt: Date.now(),
                expiresAt: expiresAt,
                accessCount: 0,
                lastAccessed: Date.now()
            };

            cache.set(key, cacheItem);
            
            console.log(`[CacheManager] Item armazenado em ${cacheType}: ${key}`);
            return true;
            
        } catch (error) {
            console.error('[CacheManager] Erro ao armazenar no cache:', error);
            return false;
        }
    }

    /**
     * Recupera um item do cache
     */
    get(cacheType, key) {
        try {
            if (!this.caches[cacheType]) {
                console.warn(`[CacheManager] Tipo de cache inválido: ${cacheType}`);
                return null;
            }

            const cache = this.caches[cacheType];
            const cacheItem = cache.get(key);

            if (!cacheItem) {
                this.stats.misses++;
                return null;
            }

            // Verificar expiração
            if (Date.now() > cacheItem.expiresAt) {
                cache.delete(key);
                this.stats.misses++;
                this.stats.evictions++;
                console.log(`[CacheManager] Item expirado removido de ${cacheType}: ${key}`);
                return null;
            }

            // Atualizar estatísticas de acesso
            cacheItem.accessCount++;
            cacheItem.lastAccessed = Date.now();
            this.stats.hits++;

            console.log(`[CacheManager] Cache hit em ${cacheType}: ${key}`);
            return cacheItem.value;
            
        } catch (error) {
            console.error('[CacheManager] Erro ao recuperar do cache:', error);
            return null;
        }
    }

    /**
     * Verifica se um item existe no cache e não expirou
     */
    has(cacheType, key) {
        const value = this.get(cacheType, key);
        return value !== null;
    }

    /**
     * Remove um item específico do cache
     */
    delete(cacheType, key) {
        try {
            if (!this.caches[cacheType]) {
                return false;
            }

            const deleted = this.caches[cacheType].delete(key);
            if (deleted) {
                console.log(`[CacheManager] Item removido de ${cacheType}: ${key}`);
            }
            return deleted;
            
        } catch (error) {
            console.error('[CacheManager] Erro ao remover do cache:', error);
            return false;
        }
    }

    /**
     * Limpa um tipo específico de cache
     */
    clear(cacheType) {
        try {
            if (cacheType && this.caches[cacheType]) {
                const size = this.caches[cacheType].size;
                this.caches[cacheType].clear();
                console.log(`[CacheManager] Cache ${cacheType} limpo (${size} itens removidos)`);
                return true;
            } else if (!cacheType) {
                // Limpar todos os caches
                let totalRemoved = 0;
                Object.keys(this.caches).forEach(type => {
                    totalRemoved += this.caches[type].size;
                    this.caches[type].clear();
                });
                console.log(`[CacheManager] Todos os caches limpos (${totalRemoved} itens removidos)`);
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('[CacheManager] Erro ao limpar cache:', error);
            return false;
        }
    }

    /**
     * Remove o item mais antigo de um cache
     */
    evictOldest(cacheType) {
        try {
            const cache = this.caches[cacheType];
            if (cache.size === 0) return;

            // Encontrar o item mais antigo (menor lastAccessed)
            let oldestKey = null;
            let oldestTime = Date.now();

            for (const [key, item] of cache.entries()) {
                if (item.lastAccessed < oldestTime) {
                    oldestTime = item.lastAccessed;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                cache.delete(oldestKey);
                this.stats.evictions++;
                console.log(`[CacheManager] Item mais antigo removido de ${cacheType}: ${oldestKey}`);
            }
            
        } catch (error) {
            console.error('[CacheManager] Erro na remoção do item mais antigo:', error);
        }
    }

    /**
     * Limpa itens expirados de todos os caches
     */
    cleanupExpired() {
        let totalRemoved = 0;
        const now = Date.now();

        Object.keys(this.caches).forEach(cacheType => {
            const cache = this.caches[cacheType];
            const keysToRemove = [];

            for (const [key, item] of cache.entries()) {
                if (now > item.expiresAt) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                cache.delete(key);
                totalRemoved++;
            });
        });

        if (totalRemoved > 0) {
            this.stats.evictions += totalRemoved;
            console.log(`[CacheManager] Limpeza automática: ${totalRemoved} itens expirados removidos`);
        }

        return totalRemoved;
    }

    /**
     * Inicia interval de limpeza automática
     */
    startCleanupInterval() {
        // Limpeza a cada 5 minutos
        setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }

    /**
     * Cache específico para respostas de API
     */
    async cacheApiCall(url, options = {}, customTtl = null) {
        const cacheKey = this.generateApiCacheKey(url, options);
        
        // Verificar cache primeiro
        const cachedResponse = this.get('api', cacheKey);
        if (cachedResponse) {
            console.log(`[CacheManager] API response cache hit: ${url}`);
            return cachedResponse;
        }

        try {
            // Fazer chamada da API
            const response = await fetch(url, options);
            const data = await response.json();

            // Armazenar no cache apenas se a resposta for bem-sucedida
            if (response.ok) {
                this.set('api', cacheKey, {
                    data: data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                }, customTtl);
            }

            return {
                data: data,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            };

        } catch (error) {
            console.error('[CacheManager] Erro na chamada da API:', error);
            throw error;
        }
    }

    /**
     * Gera chave de cache para API
     */
    generateApiCacheKey(url, options) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        const params = new URL(url, window.location.origin).searchParams.toString();
        
        return `${method}:${url}:${params}:${body}`;
    }

    /**
     * Cache específico para dados do dashboard
     */
    cacheData(key, data, ttl = null) {
        return this.set('data', key, data, ttl);
    }

    /**
     * Recupera dados do cache
     */
    getData(key) {
        return this.get('data', key);
    }

    /**
     * Cache específico para módulos
     */
    cacheModule(moduleName, moduleData, ttl = null) {
        return this.set('modules', moduleName, moduleData, ttl);
    }

    /**
     * Recupera módulo do cache
     */
    getModule(moduleName) {
        return this.get('modules', moduleName);
    }

    /**
     * Obtém estatísticas do cache
     */
    getStats() {
        const cacheStats = {};
        
        Object.keys(this.caches).forEach(type => {
            cacheStats[type] = {
                size: this.caches[type].size,
                maxSize: this.config.maxSize[type],
                utilization: (this.caches[type].size / this.config.maxSize[type] * 100).toFixed(1) + '%'
            };
        });

        return {
            global: {
                hits: this.stats.hits,
                misses: this.stats.misses,
                evictions: this.stats.evictions,
                hitRate: this.stats.hits + this.stats.misses > 0 
                    ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1) + '%'
                    : '0%'
            },
            caches: cacheStats
        };
    }

    /**
     * Obtém informações detalhadas de um cache
     */
    getCacheInfo(cacheType) {
        if (!this.caches[cacheType]) {
            return null;
        }

        const cache = this.caches[cacheType];
        const items = [];

        for (const [key, item] of cache.entries()) {
            items.push({
                key: key,
                size: JSON.stringify(item.value).length,
                createdAt: new Date(item.createdAt).toISOString(),
                expiresAt: new Date(item.expiresAt).toISOString(),
                accessCount: item.accessCount,
                lastAccessed: new Date(item.lastAccessed).toISOString(),
                isExpired: Date.now() > item.expiresAt
            });
        }

        return {
            type: cacheType,
            size: cache.size,
            maxSize: this.config.maxSize[cacheType],
            ttl: this.config.ttl[cacheType],
            items: items.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
        };
    }

    /**
     * Pré-aquece o cache com dados essenciais
     */
    async warmup() {
        try {
            console.log('[CacheManager] Iniciando pré-aquecimento do cache...');
            
            // Cache de dados básicos que são sempre necessários
            const warmupTasks = [
                this.cacheApiCall('api/units.php'),
                this.cacheApiCall('api/users.php')
            ];

            await Promise.allSettled(warmupTasks);
            console.log('[CacheManager] Pré-aquecimento concluído');
            
        } catch (error) {
            console.error('[CacheManager] Erro no pré-aquecimento:', error);
        }
    }
}

// Tornar disponível globalmente
window.CacheManager = CacheManager;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (!window.cacheManager) {
        window.cacheManager = new CacheManager();
        // Iniciar pré-aquecimento após 1 segundo
        setTimeout(() => {
            window.cacheManager.warmup();
        }, 1000);
    }
});
