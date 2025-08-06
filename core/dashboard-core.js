/**
 * DASHFLOW - Sistema Core do Dashboard
 * Responsável pelas funções principais do shell: sidebar, header e navegação
 * Mantém todas as funcionalidades existentes enquanto prepara para arquitetura modular
 */

class DashboardCore {
    constructor() {
        this.currentModule = null;
        this.moduleCache = new Map();
        this.isInitialized = false;
        this.userData = null;
        this.filters = {
            dateRange: null,
            unit: null,
            user: null
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
    }

    /**
     * Inicializa o sistema core do dashboard
     */
    async init() {
        try {
            console.log('[DashboardCore] Inicializando sistema core...');
            
            // Verificar dependências
            this.checkDependencies();
            
            // Inicializar sistema de APIs
            await this.initApiConfig();
            
            // Inicializar cache manager
            if (window.CacheManager) {
                this.cacheManager = new window.CacheManager();
                await this.cacheManager.init();
            }
            
            // Inicializar module loader
            if (window.ModuleLoader) {
                this.moduleLoader = new window.ModuleLoader();
                await this.moduleLoader.init();
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Inicializar sidebar
            this.initializeSidebar();
            
            // Carregar dados do usuário
            await this.loadUserData();
            
            // Carregar módulo padrão
            await this.loadDefaultModule();
            
            this.isInitialized = true;
            console.log('[DashboardCore] Sistema inicializado com sucesso');
            
            // Emitir evento de inicialização
            this.emit('core:initialized');
            
        } catch (error) {
            console.error('[DashboardCore] Erro na inicialização:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Verifica se o usuário está autenticado
     */
    async checkAuthentication() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                this.redirectToLogin();
                return;
            }

            // Verificar validade do token com o servidor
            const response = await fetch('auth/verify-token.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const data = await response.json();
            if (!data.valid) {
                this.redirectToLogin();
                return;
            }

            this.userData = data.user;
            console.log('[DashboardCore] Usuário autenticado:', this.userData.name);
            
        } catch (error) {
            console.error('[DashboardCore] Erro na verificação de autenticação:', error);
            this.redirectToLogin();
        }
    }

    /**
     * Redireciona para a página de login
     */
    redirectToLogin() {
        console.log('[DashboardCore] Redirecionando para login...');
        window.location.href = 'login.html';
    }

    /**
     * Configura os event listeners principais
     */
    setupEventListeners() {
        // Navigation listeners
        document.addEventListener('click', (event) => {
            const navItem = event.target.closest('[data-module]');
            if (navItem) {
                event.preventDefault();
                const moduleName = navItem.getAttribute('data-module');
                this.handleNavigation(moduleName);
            }
        });

        // Logout listener
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Filter listeners
        this.setupFilterListeners();

        // Upload listeners
        this.setupUploadListeners();
    }

    /**
     * Configura os listeners dos filtros
     */
    setupFilterListeners() {
        // Date range filter
        const dateRangeFilter = document.getElementById('date-range-filter');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (event) => {
                this.filters.dateRange = event.target.value;
                this.notifyFiltersChanged();
            });
        }

        // Unit filter
        const unitFilter = document.getElementById('unit-filter');
        if (unitFilter) {
            unitFilter.addEventListener('change', (event) => {
                this.filters.unit = event.target.value;
                this.notifyFiltersChanged();
            });
        }

        // User filter
        const userFilter = document.getElementById('user-filter');
        if (userFilter) {
            userFilter.addEventListener('change', (event) => {
                this.filters.user = event.target.value;
                this.notifyFiltersChanged();
            });
        }
    }

    /**
     * Configura os listeners de upload
     */
    setupUploadListeners() {
        const uploadBtn = document.getElementById('upload-btn');
        const uploadInput = document.getElementById('upload-input');

        if (uploadBtn && uploadInput) {
            uploadBtn.addEventListener('click', () => {
                uploadInput.click();
            });

            uploadInput.addEventListener('change', this.handleFileUpload.bind(this));
        }
    }

    /**
     * Inicializa os componentes do header
     */
    initializeHeader() {
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.userData) {
            userNameElement.textContent = this.userData.name;
        }

        // Configurar data atual
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            const now = new Date();
            const dateString = now.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            currentDateElement.textContent = dateString;
        }

        // Carregar opções dos filtros
        this.loadFilterOptions();
    }

    /**
     * Carrega as opções dos filtros
     */
    async loadFilterOptions() {
        try {
            // Carregar unidades
            const unitsResponse = await fetch('api/units.php');
            if (unitsResponse.ok) {
                const units = await unitsResponse.json();
                this.populateUnitFilter(units);
            }

            // Carregar usuários
            const usersResponse = await fetch('api/users.php');
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                this.populateUserFilter(users);
            }

        } catch (error) {
            console.error('[DashboardCore] Erro ao carregar opções dos filtros:', error);
        }
    }

    /**
     * Popula o filtro de unidades
     */
    populateUnitFilter(units) {
        const unitFilter = document.getElementById('unit-filter');
        if (!unitFilter || !Array.isArray(units)) return;

        // Limpar opções existentes (manter "Todas as Unidades")
        const firstOption = unitFilter.querySelector('option');
        unitFilter.innerHTML = '';
        if (firstOption) {
            unitFilter.appendChild(firstOption);
        }

        // Adicionar unidades
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.id;
            option.textContent = unit.name;
            unitFilter.appendChild(option);
        });
    }

    /**
     * Popula o filtro de usuários
     */
    populateUserFilter(users) {
        const userFilter = document.getElementById('user-filter');
        if (!userFilter || !Array.isArray(users)) return;

        // Limpar opções existentes (manter "Todos os Usuários")
        const firstOption = userFilter.querySelector('option');
        userFilter.innerHTML = '';
        if (firstOption) {
            userFilter.appendChild(firstOption);
        }

        // Adicionar usuários
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userFilter.appendChild(option);
        });
    }

    /**
     * Inicializa a sidebar
     */
    initializeSidebar() {
        // Configurar sidebar para iniciar collapsed por padrão
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
            console.log('[DashboardCore] Sidebar configurado como collapsed por padrão');
        }
        
        // Marcar item ativo baseado na URL ou módulo padrão
        this.updateActiveNavItem('dashboard');
    }

    /**
     * Atualiza o item ativo na navegação
     */
    updateActiveNavItem(moduleName) {
        // Remover classe active de todos os itens
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Adicionar classe active ao item atual
        const activeItem = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Manipula a navegação entre módulos
     */
    async handleNavigation(moduleName) {
        try {
            console.log(`[DashboardCore] Navegando para módulo: ${moduleName}`);
            
            // Atualizar navegação
            this.updateActiveNavItem(moduleName);
            
            // Carregar módulo via ModuleLoader
            if (window.ModuleLoader) {
                await window.ModuleLoader.loadModule(moduleName);
                this.currentModule = moduleName;
            } else {
                console.error('[DashboardCore] ModuleLoader não encontrado');
            }
            
        } catch (error) {
            console.error(`[DashboardCore] Erro na navegação para ${moduleName}:`, error);
            this.handleError(`Erro ao carregar módulo ${moduleName}`, error);
        }
    }

    /**
     * Carrega o módulo padrão
     */
    async loadDefaultModule() {
        await this.handleNavigation('dashboard');
    }

    /**
     * Notifica mudanças nos filtros para o módulo atual
     */
    notifyFiltersChanged() {
        if (this.currentModule && window.ModuleLoader) {
            const moduleInstance = window.ModuleLoader.getModuleInstance(this.currentModule);
            if (moduleInstance && typeof moduleInstance.onFiltersChanged === 'function') {
                moduleInstance.onFiltersChanged(this.filters);
            }
        }
        
        console.log('[DashboardCore] Filtros atualizados:', this.filters);
    }

    /**
     * Manipula o upload de arquivos
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            console.log('[DashboardCore] Iniciando upload:', file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', this.userData.id);

            const response = await fetch('api/upload.php', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification('Arquivo enviado com sucesso!', 'success');
                
                // Notificar módulo atual sobre novo upload
                if (this.currentModule && window.ModuleLoader) {
                    const moduleInstance = window.ModuleLoader.getModuleInstance(this.currentModule);
                    if (moduleInstance && typeof moduleInstance.onDataUploaded === 'function') {
                        moduleInstance.onDataUploaded(result.data);
                    }
                }
            } else {
                throw new Error(result.message || 'Erro no upload');
            }

        } catch (error) {
            console.error('[DashboardCore] Erro no upload:', error);
            this.showNotification('Erro ao enviar arquivo: ' + error.message, 'error');
        } finally {
            // Limpar input
            event.target.value = '';
        }
    }

    /**
     * Manipula o logout
     */
    async handleLogout() {
        try {
            console.log('[DashboardCore] Realizando logout...');
            
            // Chamar API de logout
            await fetch('auth/logout.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            // Limpar dados locais
            localStorage.removeItem('auth_token');
            this.userData = null;
            
            // Redirecionar para login
            this.redirectToLogin();
            
        } catch (error) {
            console.error('[DashboardCore] Erro no logout:', error);
            // Mesmo com erro, redirecionar para login
            this.redirectToLogin();
        }
    }

    /**
     * Exibe notificação para o usuário
     */
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        console.log(`[DashboardCore] Notificação (${type}): ${message}`);
    }

    /**
     * Manipula erros do sistema
     */
    handleError(message, error) {
        console.error('[DashboardCore] Erro:', message, error);
        this.showNotification(message, 'error');
    }

    /**
     * Obtém os filtros atuais
     */
    getCurrentFilters() {
        return { ...this.filters };
    }

    /**
     * Obtém dados do usuário atual
     */
    getCurrentUser() {
        return this.userData;
    }

    /**
     * Inicializa o sistema de APIs
     */
    async initApiConfig() {
        try {
            console.log('[DashboardCore] Inicializando sistema de APIs...');
            
            if (!window.ApiConfig) {
                throw new Error('ApiConfig não encontrado');
            }
            
            this.apiConfig = new window.ApiConfig();
            await this.apiConfig.init();
            
            console.log('[DashboardCore] Sistema de APIs inicializado com sucesso');
            
        } catch (error) {
            console.error('[DashboardCore] Erro ao inicializar APIs:', error);
            // Não bloquear inicialização se APIs falharem
            this.apiConfig = null;
        }
    }

    /**
     * Carrega dados do usuário
     */
    async loadUserData() {
        try {
            console.log('[DashboardCore] Carregando dados do usuário...');
            
            // Tentar obter da sessão PHP primeiro
            if (this.apiConfig) {
                const user = this.apiConfig.getCurrentUser();
                if (user) {
                    this.userData = user;
                    console.log('[DashboardCore] Dados do usuário carregados da sessão PHP');
                    return;
                }
            }
            
            // Fallback para localStorage
            const storedSession = localStorage.getItem('userSession');
            if (storedSession) {
                this.userData = JSON.parse(storedSession);
                console.log('[DashboardCore] Dados do usuário carregados do localStorage');
            } else {
                console.log('[DashboardCore] Nenhum dado de usuário encontrado');
            }
            
        } catch (error) {
            console.error('[DashboardCore] Erro ao carregar dados do usuário:', error);
            this.userData = null;
        }
    }

    /**
     * Verifica se o sistema está inicializado
     */
    isReady() {
        return this.isInitialized;
    }
}

// Tornar disponível globalmente
window.DashboardCore = DashboardCore;

// Auto-inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.dashboardCore) {
        window.dashboardCore = new DashboardCore();
        await window.dashboardCore.init();
    }
});
