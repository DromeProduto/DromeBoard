/**
 * DASHFLOW - Configuração Centralizada de APIs PHP
 * Configurações e utilitários para conexão com APIs PHP + PostgreSQL
 */

class ApiConfig {
    constructor() {
        // Configurações principais das APIs
        this.config = {
            baseUrl: '',  // URL base (vazio para localhost)
            endpoints: {
                // Autenticação
                auth: {
                    login: 'auth/login.php',
                    logout: 'auth/logout.php',
                    check: 'auth/check-session.php'
                },
                // Dashboard
                dashboard: {
                    metrics: 'api/metrics.php',
                    charts: 'api/charts.php',
                    activities: 'api/activities.php'
                },
                // Resultados
                results: {
                    upload: 'api/resultados.php',
                    data: 'api/resultados.php',
                    export: 'api/resultados.php'
                },
                // Usuários
                users: {
                    list: 'api/users.php',
                    create: 'api/users.php',
                    update: 'api/users.php',
                    delete: 'api/users.php'
                },
                // Unidades
                units: {
                    list: 'api/units.php',
                    create: 'api/units.php',
                    update: 'api/units.php',
                    delete: 'api/units.php'
                },
                // Módulos
                modules: {
                    list: 'api/modules.php',
                    permissions: 'api/modules.php'
                }
            }
        };

        this.isInitialized = false;
        this.userSession = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.makeRequest = this.makeRequest.bind(this);
        this.checkSession = this.checkSession.bind(this);
    }

    /**
     * Inicializa o sistema de APIs
     */
    async init() {
        try {
            console.log('[ApiConfig] Inicializando sistema de APIs...');

            // Verificar sessão do usuário
            await this.checkSession();

            this.isInitialized = true;
            console.log('[ApiConfig] Sistema de APIs inicializado com sucesso');

            // Tornar disponível globalmente
            window.apiConfig = this;

        } catch (error) {
            console.error('[ApiConfig] Erro na inicialização:', error);
            throw error;
        }
    }

    /**
     * Verifica sessão atual do usuário
     */
    async checkSession() {
        try {
            const response = await this.makeRequest('auth.check', {}, 'GET');
            
            if (response.success && response.user) {
                this.userSession = response.user;
                console.log('[ApiConfig] Sessão válida para:', response.user.email);
                return response.user;
            } else {
                this.userSession = null;
                console.log('[ApiConfig] Nenhuma sessão ativa');
                return null;
            }

        } catch (error) {
            console.error('[ApiConfig] Erro ao verificar sessão:', error);
            this.userSession = null;
            return null;
        }
    }

    /**
     * Faz requisição para API PHP
     */
    async makeRequest(endpoint, data = {}, method = 'POST') {
        try {
            // Resolver endpoint
            const url = this.resolveEndpoint(endpoint);
            
            // Configurar opções da requisição
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Para incluir cookies de sessão
            };

            // Adicionar body se não for GET
            if (method !== 'GET' && Object.keys(data).length > 0) {
                options.body = JSON.stringify(data);
            }

            // Fazer requisição
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            console.log(`[ApiConfig] ${method} ${endpoint}:`, result);
            return result;

        } catch (error) {
            console.error(`[ApiConfig] Erro em ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Resolve endpoint para URL completa
     */
    resolveEndpoint(endpoint) {
        const parts = endpoint.split('.');
        let config = this.config.endpoints;
        
        for (const part of parts) {
            if (config[part]) {
                config = config[part];
            } else {
                throw new Error(`Endpoint '${endpoint}' não encontrado`);
            }
        }

        return this.config.baseUrl + config;
    }

    /**
     * Obtém dados de métricas
     */
    async getMetrics(filters = {}) {
        try {
            const data = await this.makeRequest('dashboard.metrics', {
                action: 'get_metrics',
                filters: filters
            });

            return data.metrics || {};

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter métricas:', error);
            // Fallback com dados simulados
            return {
                totalUploads: Math.floor(Math.random() * 500) + 100,
                totalRecords: Math.floor(Math.random() * 25000) + 5000,
                successRate: Math.round((Math.random() * 15 + 85) * 100) / 100,
                avgProcessingTime: Math.round((Math.random() * 7 + 1) * 100) / 100
            };
        }
    }

    /**
     * Obtém dados de gráficos
     */
    async getChartData(chartType, filters = {}) {
        try {
            const data = await this.makeRequest('dashboard.charts', {
                action: 'get_chart_data',
                chart_type: chartType,
                filters: filters
            });

            return data.chart_data || this.getSimulatedChartData(chartType);

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter dados de gráfico:', error);
            return this.getSimulatedChartData(chartType);
        }
    }

    /**
     * Obtém atividades recentes
     */
    async getRecentActivities(limit = 10) {
        try {
            const data = await this.makeRequest('dashboard.activities', {
                action: 'get_recent_activities',
                limit: limit
            });

            return data.activities || [];

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter atividades:', error);
            // Fallback com atividades simuladas
            return this.getSimulatedActivities(limit);
        }
    }

    /**
     * Salva dados de upload
     */
    async saveUploadData(data, metadata = {}) {
        try {
            const result = await this.makeRequest('results.upload', {
                action: 'save_upload',
                data: data,
                metadata: metadata
            });

            console.log(`[ApiConfig] Upload salvo: ${data.length} registros`);
            return result;

        } catch (error) {
            console.error('[ApiConfig] Erro ao salvar upload:', error);
            throw error;
        }
    }

    /**
     * Obtém dados de resultados com filtros
     */
    async getResultsData(filters = {}) {
        try {
            const data = await this.makeRequest('results.data', {
                action: 'get_results',
                filters: filters
            });

            return data.results || [];

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter dados de resultados:', error);
            return [];
        }
    }

    /**
     * Obtém lista de usuários
     */
    async getUsers(filters = {}) {
        try {
            const data = await this.makeRequest('users.list', {
                action: 'list_users',
                filters: filters
            });

            return data.users || [];

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter usuários:', error);
            return [];
        }
    }

    /**
     * Obtém lista de unidades
     */
    async getUnits(filters = {}) {
        try {
            const data = await this.makeRequest('units.list', {
                action: 'list_units',
                filters: filters
            });

            return data.units || [];

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter unidades:', error);
            return [];
        }
    }

    /**
     * Obtém lista de módulos
     */
    async getModules(unitId = null) {
        try {
            const data = await this.makeRequest('modules.list', {
                action: 'list_modules',
                unit_id: unitId
            });

            return data.modules || [];

        } catch (error) {
            console.error('[ApiConfig] Erro ao obter módulos:', error);
            return [];
        }
    }

    /**
     * Faz logout do usuário
     */
    async signOut() {
        try {
            const result = await this.makeRequest('auth.logout', {});
            
            if (result.success) {
                this.userSession = null;
                console.log('[ApiConfig] Logout realizado com sucesso');
                return true;
            }

            return false;

        } catch (error) {
            console.error('[ApiConfig] Erro no logout:', error);
            throw error;
        }
    }

    /**
     * Obtém informações de usuário atual
     */
    getCurrentUser() {
        return this.userSession;
    }

    /**
     * Gera dados simulados de gráfico
     */
    getSimulatedChartData(chartType) {
        switch (chartType) {
            case 'line':
                return {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Uploads',
                        data: Array.from({length: 6}, () => Math.floor(Math.random() * 100) + 20),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)'
                    }]
                };
                
            case 'bar':
                return {
                    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
                    datasets: [{
                        label: 'Atividades',
                        data: Array.from({length: 7}, () => Math.floor(Math.random() * 50) + 10),
                        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997']
                    }]
                };
                
            case 'doughnut':
                return {
                    labels: ['Sucesso', 'Erro', 'Pendente'],
                    datasets: [{
                        data: [70, 20, 10],
                        backgroundColor: ['#28a745', '#dc3545', '#ffc107']
                    }]
                };
                
            default:
                throw new Error(`Tipo de gráfico '${chartType}' não suportado`);
        }
    }

    /**
     * Gera atividades simuladas
     */
    getSimulatedActivities(limit) {
        return Array.from({length: limit}, (_, i) => ({
            id: i + 1,
            type: ['upload', 'process', 'export'][Math.floor(Math.random() * 3)],
            description: [
                'Upload de planilha realizado',
                'Dados processados com sucesso',
                'Relatório exportado',
                'Backup criado',
                'Usuário logado'
            ][Math.floor(Math.random() * 5)],
            user: 'Usuário ' + (Math.floor(Math.random() * 5) + 1),
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: ['success', 'warning', 'error'][Math.floor(Math.random() * 3)]
        }));
    }

    /**
     * Obtém configurações do sistema
     */
    getConfiguration() {
        return {
            isInitialized: this.isInitialized,
            hasSession: !!this.userSession,
            baseUrl: this.config.baseUrl,
            currentUser: this.userSession
        };
    }
}

// Tornar disponível globalmente
window.ApiConfig = ApiConfig;
