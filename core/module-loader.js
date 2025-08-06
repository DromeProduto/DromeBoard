/**
 * DASHFLOW - Module Loader
 * Sistema de carregamento dinâmico de módulos
 * Gerencia cache, lazy loading e lifecycle dos módulos
 */

class ModuleLoader {
    constructor() {
        this.modules = new Map();
        this.moduleCache = new Map();
        this.loadingPromises = new Map();
        this.moduleContainer = null;
        this.currentModule = null;
        
        // Registro de módulos disponíveis
        this.availableModules = {
            'dashboard-home': {
                name: 'dashboard-home',
                title: 'Dashboard',
                path: 'dashboard/modules/dashboard-home.js',
                cssPath: 'dashboard/modules/dashboard-home.css',
                icon: 'fas fa-chart-line',
                description: 'Visão geral do dashboard com métricas principais'
            },
            'resultados': {
                name: 'resultados',
                title: 'Resultados',
                path: 'dashboard/modules/resultados.js',
                cssPath: 'dashboard/modules/resultados.css',
                icon: 'fas fa-chart-bar',
                description: 'Analytics e resultados com upload de planilhas'
            }
        };
        
        this.init();
    }

    /**
     * Inicializa o module loader
     */
    init() {
        this.moduleContainer = document.getElementById('module-container');
        if (!this.moduleContainer) {
            console.error('[ModuleLoader] Container de módulos não encontrado');
            return;
        }
        
        console.log('[ModuleLoader] Sistema inicializado');
    }

    /**
     * Carrega um módulo dinamicamente
     */
    async loadModule(moduleName) {
        try {
            console.log(`[ModuleLoader] Carregando módulo: ${moduleName}`);
            
            // Verificar se o módulo já está sendo carregado
            if (this.loadingPromises.has(moduleName)) {
                return await this.loadingPromises.get(moduleName);
            }
            
            // Criar promise de carregamento
            const loadingPromise = this._loadModuleInternal(moduleName);
            this.loadingPromises.set(moduleName, loadingPromise);
            
            try {
                const result = await loadingPromise;
                return result;
            } finally {
                this.loadingPromises.delete(moduleName);
            }
            
        } catch (error) {
            console.error(`[ModuleLoader] Erro ao carregar módulo ${moduleName}:`, error);
            this.showError(`Erro ao carregar módulo ${moduleName}`, error);
            throw error;
        }
    }

    /**
     * Carregamento interno do módulo
     */
    async _loadModuleInternal(moduleName) {
        const config = this.moduleConfig[moduleName];
        if (!config) {
            throw new Error(`Módulo '${moduleName}' não encontrado na configuração`);
        }

        // Verificar cache
        if (this.moduleCache.has(moduleName)) {
            console.log(`[ModuleLoader] Módulo ${moduleName} recuperado do cache`);
            return await this.activateModule(moduleName);
        }

        // Mostrar loading
        this.showLoading();

        try {
            // Carregar CSS do módulo
            if (config.css) {
                await this.loadCSS(config.css, `module-css-${moduleName}`);
            }

            // Carregar JavaScript do módulo
            await this.loadScript(config.path);

            // Verificar se a classe do módulo foi carregada
            if (!window[config.className]) {
                throw new Error(`Classe '${config.className}' não encontrada após carregar ${config.path}`);
            }

            // Criar instância do módulo
            const moduleInstance = new window[config.className]();
            
            // Configurar módulo
            moduleInstance.name = moduleName;
            moduleInstance.title = config.title;
            moduleInstance.container = this.moduleContainer;

            // Adicionar ao cache
            this.moduleCache.set(moduleName, {
                instance: moduleInstance,
                config: config,
                loadedAt: Date.now()
            });

            console.log(`[ModuleLoader] Módulo ${moduleName} carregado com sucesso`);

            // Ativar módulo
            return await this.activateModule(moduleName);

        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    /**
     * Ativa um módulo já carregado
     */
    async activateModule(moduleName) {
        try {
            const moduleData = this.moduleCache.get(moduleName);
            if (!moduleData) {
                throw new Error(`Módulo ${moduleName} não está no cache`);
            }

            // Desativar módulo atual
            if (this.currentModule && this.currentModule !== moduleName) {
                await this.deactivateCurrentModule();
            }

            // Ativar novo módulo
            const { instance } = moduleData;
            
            // Limpar container
            this.moduleContainer.innerHTML = '';
            
            // Inicializar módulo se necessário
            if (typeof instance.init === 'function' && !instance.initialized) {
                await instance.init();
                instance.initialized = true;
            }

            // Renderizar módulo
            if (typeof instance.render === 'function') {
                await instance.render();
            }

            // Notificar ativação
            if (typeof instance.onActivate === 'function') {
                await instance.onActivate();
            }

            this.currentModule = moduleName;
            this.hideLoading();
            
            console.log(`[ModuleLoader] Módulo ${moduleName} ativado`);
            
            return instance;

        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    /**
     * Desativa o módulo atual
     */
    async deactivateCurrentModule() {
        if (!this.currentModule) return;

        try {
            const moduleData = this.moduleCache.get(this.currentModule);
            if (moduleData && typeof moduleData.instance.onDeactivate === 'function') {
                await moduleData.instance.onDeactivate();
            }
            
            console.log(`[ModuleLoader] Módulo ${this.currentModule} desativado`);
            
        } catch (error) {
            console.error(`[ModuleLoader] Erro ao desativar módulo ${this.currentModule}:`, error);
        }
    }

    /**
     * Carrega um arquivo CSS dinamicamente
     */
    async loadCSS(href, id) {
        return new Promise((resolve, reject) => {
            // Verificar se já foi carregado
            if (document.getElementById(id)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            
            link.onload = () => {
                console.log(`[ModuleLoader] CSS carregado: ${href}`);
                resolve();
            };
            
            link.onerror = () => {
                console.error(`[ModuleLoader] Erro ao carregar CSS: ${href}`);
                reject(new Error(`Falha ao carregar CSS: ${href}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Carrega um arquivo JavaScript dinamicamente
     */
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar se já foi carregado
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.type = 'text/javascript';
            
            script.onload = () => {
                console.log(`[ModuleLoader] Script carregado: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`[ModuleLoader] Erro ao carregar script: ${src}`);
                reject(new Error(`Falha ao carregar script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Mostra indicador de loading
     */
    showLoading() {
        if (!this.moduleContainer) return;
        
        this.moduleContainer.innerHTML = `
            <div class="module-loading">
                <div class="loading-spinner"></div>
                <p>Carregando módulo...</p>
            </div>
        `;
    }

    /**
     * Esconde indicador de loading
     */
    hideLoading() {
        const loadingElement = this.moduleContainer?.querySelector('.module-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    /**
     * Mostra erro de carregamento
     */
    showError(message, error) {
        if (!this.moduleContainer) return;
        
        this.moduleContainer.innerHTML = `
            <div class="module-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao Carregar Módulo</h3>
                <p>${message}</p>
                <details>
                    <summary>Detalhes do erro</summary>
                    <pre>${error.stack || error.message}</pre>
                </details>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
    }

    /**
     * Obtém instância de um módulo carregado
     */
    getModuleInstance(moduleName) {
        const moduleData = this.moduleCache.get(moduleName);
        return moduleData ? moduleData.instance : null;
    }

    /**
     * Obtém o módulo atualmente ativo
     */
    getCurrentModule() {
        return this.currentModule;
    }

    /**
     * Lista todos os módulos disponíveis
     */
    getAvailableModules() {
        return Object.keys(this.moduleConfig);
    }

    /**
     * Verifica se um módulo está carregado
     */
    isModuleLoaded(moduleName) {
        return this.moduleCache.has(moduleName);
    }

    /**
     * Remove um módulo do cache
     */
    unloadModule(moduleName) {
        if (this.moduleCache.has(moduleName)) {
            const moduleData = this.moduleCache.get(moduleName);
            
            // Chamar cleanup se disponível
            if (typeof moduleData.instance.cleanup === 'function') {
                moduleData.instance.cleanup();
            }
            
            this.moduleCache.delete(moduleName);
            console.log(`[ModuleLoader] Módulo ${moduleName} removido do cache`);
        }
    }

    /**
     * Limpa o cache de módulos
     */
    clearCache() {
        this.moduleCache.forEach((moduleData, moduleName) => {
            if (typeof moduleData.instance.cleanup === 'function') {
                moduleData.instance.cleanup();
            }
        });
        
        this.moduleCache.clear();
        this.currentModule = null;
        console.log('[ModuleLoader] Cache de módulos limpo');
    }

    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        return {
            totalModules: this.moduleCache.size,
            currentModule: this.currentModule,
            loadedModules: Array.from(this.moduleCache.keys()),
            memoryUsage: this.moduleCache.size * 1024 // Estimativa simples
        };
    }
}

// Tornar disponível globalmente
window.ModuleLoader = ModuleLoader;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (!window.moduleLoader) {
        window.moduleLoader = new ModuleLoader();
    }
});
