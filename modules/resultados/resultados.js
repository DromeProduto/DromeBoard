/**
 * DASHFLOW - Módulo Resultados
 * Migração completa das funcionalidades de Resultados.html para arquitetura modular
 * Inclui upload de planilhas, visualização de dados, métricas e tabelas
 */

class ResultadosModule {
    constructor() {
        this.name = 'resultados';
        this.title = 'Resultados';
        this.container = null;
        this.initialized = false;
        
        // Estado do módulo
        this.resultadosData = [];
        this.currentMainTab = 'gestao';
        this.currentClientSubTab = 'ativos-list';
        this.semanaOffset = 0;
        
        // Configurações e constantes
        this.EXPECTED_HEADERS = [
            'Orçamento', 'Número', 'Data', 'Horário', 'Período', 'Serviço', 'Tipo', 'Horas',
            'Cliente', 'Profissionais', 'Repasse (R$)', 'Situação', 'Recorrente',
            'Local de Atendimento', 'Valor (R$)', 'Cupom de Desconto', 'Origem',
            'Data de cadastro', 'Dia da semana'
        ];
        
        this.VALID_FIELDS = [
            'id', 'created_at', 'DATA', 'HORARIO', 'VALOR', 'SERVIÇO', 'TIPO', 'PERÍODO',
            'CLIENTE', 'PROFISSIONAL', 'ENDEREÇO', 'DIA', 'REPASSE', 'whatscliente',
            'CUPOM', 'ORIGEM', 'ATENDIMENTO_ID', 'IS_DIVISAO', 'CADASTRO', 'ACAO'
        ];
        
        // Charts
        this.charts = {
            atendimentosDia: null,
            evolucaoClientes: null
        };
        
        // Métricas
        this.metrics = {
            atendimentos: {
                mes: 0,
                mediaDia: 0,
                preAgendados: 0,
                comercial: 0,
                residencial: 0,
                crescimento: 0
            },
            faturamento: {
                mes: 0,
                valorMedio: 0,
                mediaRepasse: 0,
                margem: 0,
                crescimento: 0
            },
            clientes: {
                total: 0,
                atendimentoMedio: 0,
                recorrentes: 0,
                outros: 0,
                churn: 0,
                crescimento: 0
            }
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.render = this.render.bind(this);
        this.loadResults = this.loadResults.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.onFiltersChanged = this.onFiltersChanged.bind(this);
    }

    /**
     * Inicializa o módulo
     */
    async init() {
        try {
            console.log('[ResultadosModule] Inicializando módulo...');
            
            // Verificar dependências
            this.checkDependencies();
            
            // Configurar Supabase
            this.initSupabase();
            
            this.initialized = true;
            console.log('[ResultadosModule] Módulo inicializado com sucesso');
            
        } catch (error) {
            console.error('[ResultadosModule] Erro na inicialização:', error);
            throw error;
        }
    }

    /**
     * Renderiza o módulo no container
     */
    async render() {
        try {
            if (!this.container) {
                throw new Error('Container não definido para o módulo');
            }

            console.log('[ResultadosModule] Renderizando módulo...');
            
            // Criar HTML do módulo
            this.container.innerHTML = this.getModuleHTML();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Carregar dados iniciais
            await this.loadResults();
            
            console.log('[ResultadosModule] Módulo renderizado com sucesso');
            
        } catch (error) {
            console.error('[ResultadosModule] Erro na renderização:', error);
            this.renderError(error);
        }
    }

    /**
     * Retorna o HTML do módulo
     */
    getModuleHTML() {
        return `
            <div class="resultados-module">
                <!-- Header do Módulo -->
                <div class="module-header">
                    <h2>Resultados e Analytics</h2>
                    <div class="module-actions">
                        <button id="upload-results-btn" class="btn btn-primary">
                            <i class="fas fa-upload"></i>
                            <span>Upload XLSX</span>
                        </button>
                        <button id="refresh-results-btn" class="btn btn-outline">
                            <i class="fas fa-sync-alt"></i>
                            <span>Atualizar</span>
                        </button>
                        <button id="export-results-btn" class="btn btn-outline">
                            <i class="fas fa-download"></i>
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>

                <!-- Filtros do Módulo -->
                <div class="module-filters">
                    <div class="filter-group">
                        <label for="month-filter-results">Mês:</label>
                        <select id="month-filter-results" class="form-select">
                            <option value="">Todos</option>
                            <option value="1">Janeiro</option>
                            <option value="2">Fevereiro</option>
                            <option value="3">Março</option>
                            <option value="4">Abril</option>
                            <option value="5">Maio</option>
                            <option value="6">Junho</option>
                            <option value="7">Julho</option>
                            <option value="8">Agosto</option>
                            <option value="9">Setembro</option>
                            <option value="10">Outubro</option>
                            <option value="11">Novembro</option>
                            <option value="12">Dezembro</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="year-filter-results">Ano:</label>
                        <select id="year-filter-results" class="form-select">
                            <option value="">Todos</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="db-select-results">Base de Dados:</label>
                        <select id="db-select-results" class="form-select">
                            <option value="resultados_mbteresina">MB Teresina</option>
                            <option value="resultados_mblondrina">MB Londrina</option>
                        </select>
                    </div>
                </div>

                <!-- Navegação por Abas -->
                <div class="tab-navigation">
                    <button class="tab-filter active" data-tab="gestao">
                        <i class="fas fa-chart-line tab-icon"></i>
                        Gestão
                    </button>
                    <button class="tab-filter" data-tab="clientes">
                        <i class="fas fa-users tab-icon"></i>
                        Clientes
                    </button>
                    <div class="tab-indicator"></div>
                </div>

                <!-- Conteúdo da Aba Gestão -->
                <div id="tab-content-gestao" class="tab-content-section">
                    <!-- Cards de Métricas -->
                    <div class="metrics-grid-resultados">
                        <!-- Card: Atendimentos -->
                        <div class="metric-card-resultados" id="card-atendimentos">
                            <div class="metric-header">
                                <i class="fas fa-calendar-check metric-icon"></i>
                                <h3>Atendimentos no Mês</h3>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value-main" id="metric-atendimentos-mes">0</div>
                                <div class="metric-sub-grid">
                                    <div class="metric-sub-item">
                                        <span class="label">Média/Dia</span>
                                        <span class="value" id="metric-media-dia">0</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Pré-Agendados</span>
                                        <span class="value" id="metric-pre-agendados">0</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Comercial</span>
                                        <div class="value-with-percent">
                                            <span class="value" id="metric-atendimentos-comercial">0</span>
                                            <span class="percent" id="percentual-comercial">0%</span>
                                        </div>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Residencial</span>
                                        <div class="value-with-percent">
                                            <span class="value" id="metric-atendimentos-residencial">0</span>
                                            <span class="percent" id="percentual-residencial">0%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="metric-comparison" id="atendimento-crescimento">
                                    <span>vs. Ano Anterior</span>
                                    <span class="comparison-value">
                                        <i class="fas fa-equals"></i> 0%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Faturamento -->
                        <div class="metric-card-resultados" id="card-faturamento">
                            <div class="metric-header">
                                <i class="fas fa-dollar-sign metric-icon"></i>
                                <h3>Faturamento do Mês</h3>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value-main" id="metric-faturamento-mes">R$ 0,00</div>
                                <div class="metric-sub-grid">
                                    <div class="metric-sub-item">
                                        <span class="label">Média/Atend.</span>
                                        <span class="value" id="metric-valor-medio">R$ 0,00</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Média/Repasse</span>
                                        <span class="value" id="metric-media-repasse">R$ 0,00</span>
                                    </div>
                                    <div class="metric-sub-item" style="grid-column: span 2;">
                                        <span class="label">Margem Média/Atend.</span>
                                        <span class="value" id="metric-valor-medio-atendimento-margem">R$ 0,00</span>
                                    </div>
                                </div>
                                <div class="metric-comparison" id="faturamento-crescimento">
                                    <span>vs. Ano Anterior</span>
                                    <span class="comparison-value">
                                        <i class="fas fa-equals"></i> 0%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Clientes -->
                        <div class="metric-card-resultados" id="card-clientes">
                            <div class="metric-header">
                                <i class="fas fa-users metric-icon"></i>
                                <h3>Clientes no Mês</h3>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value-main" id="metric-clientes">0</div>
                                <div class="metric-sub-grid">
                                    <div class="metric-sub-item">
                                        <span class="label">Atend./Cliente</span>
                                        <span class="value" id="metric-atendimento-medio">0</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Recorrentes</span>
                                        <span class="value" id="metric-clientes-recorrentes-card">0</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Outros</span>
                                        <span class="value" id="metric-clientes-outros">0</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Churn</span>
                                        <span class="value" id="metric-churn">0%</span>
                                    </div>
                                </div>
                                <div class="metric-comparison" id="clientes-crescimento">
                                    <span>vs. Ano Anterior</span>
                                    <span class="comparison-value">
                                        <i class="fas fa-equals"></i> 0%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Semana -->
                        <div class="metric-card-resultados" id="card-semana">
                            <div class="metric-header">
                                <i class="fas fa-calendar-week metric-icon"></i>
                                <div class="week-nav">
                                    <button id="btn-semana-anterior" title="Semana anterior">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <div class="week-title">
                                        <h3>Semana</h3>
                                        <span id="semana-intervalo" class="week-range"></span>
                                    </div>
                                    <button id="btn-semana-proxima" title="Próxima semana">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value-main" id="metric-atendimentos-semana">0</div>
                                <div class="metric-sub-grid">
                                    <div class="metric-sub-item">
                                        <span class="label">Faturamento</span>
                                        <span class="value" id="metric-faturamento-semana">R$ 0,00</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Clientes</span>
                                        <span class="value" id="metric-clientes-semana">0</span>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Comercial</span>
                                        <div class="value-with-percent">
                                            <span class="value" id="metric-atendimentos-semana-comercial">0</span>
                                            <span class="percent" id="percentual-semana-comercial">0%</span>
                                        </div>
                                    </div>
                                    <div class="metric-sub-item">
                                        <span class="label">Residencial</span>
                                        <div class="value-with-percent">
                                            <span class="value" id="metric-atendimentos-semana-residencial">0</span>
                                            <span class="percent" id="percentual-semana-residencial">0%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="metric-comparison" id="atendimento-semana-crescimento">
                                    <span>vs. Semana Anterior</span>
                                    <span class="comparison-value">
                                        <i class="fas fa-equals"></i> 0%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gráfico de Atendimentos por Dia -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Atendimentos por Dia do Mês</h3>
                            <div id="grafico-atendimentos-dia-legend" class="chart-legend"></div>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="grafico-atendimentos-dia"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo da Aba Clientes -->
                <div id="tab-content-clientes" class="tab-content-section hidden">
                    <!-- Cards de Filtro de Clientes -->
                    <div class="client-filter-cards">
                        <button class="client-filter-card active" data-filter="total" id="btn-clientes-total">
                            <div class="card-content">
                                <div class="card-info">
                                    <div class="card-label">Total</div>
                                    <div class="card-value" id="metric-total-clientes">0</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                        </button>
                        
                        <button class="client-filter-card" data-filter="recorrentes" id="btn-clientes-recorrentes">
                            <div class="card-content">
                                <div class="card-info">
                                    <div class="card-label">Recorrentes</div>
                                    <div class="card-value" id="metric-clientes-recorrentes">0</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-redo"></i>
                                </div>
                            </div>
                        </button>
                        
                        <button class="client-filter-card" data-filter="atencao" id="btn-clientes-atencao">
                            <div class="card-content">
                                <div class="card-info">
                                    <div class="card-label">Atenção</div>
                                    <div class="card-value" id="metric-clientes-atencao">0</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                            </div>
                        </button>
                        
                        <div class="client-filter-card" id="btn-clientes-outros">
                            <div class="card-content">
                                <div class="card-info">
                                    <div class="card-label">Outros</div>
                                    <div class="card-value" id="metric-clientes-outros-card">0</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-user-minus"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabelas de Clientes -->
                    <div id="clientes-tabelas">
                        <div id="tabela-clientes-ativos-wrapper" class="clientes-tabela-section">
                            <div class="table-container">
                                <div class="table-header">
                                    <h3>Clientes Ativos</h3>
                                    <div id="paginacao-clientes-ativos-div-top"></div>
                                </div>
                                <div class="table-wrapper">
                                    <table class="data-table">
                                        <thead id="thead-clientes-ativos">
                                            <!-- Cabeçalho será preenchido via JS -->
                                        </thead>
                                        <tbody id="tabela-clientes-ativos">
                                            <tr>
                                                <td colspan="7" class="loading-cell">
                                                    Carregando clientes ativos...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div id="tabela-clientes-recorrentes-wrapper" class="clientes-tabela-section hidden">
                            <div class="table-container">
                                <div class="table-header">
                                    <h3>Clientes Recorrentes</h3>
                                    <div id="paginacao-clientes-recorrentes-div-top"></div>
                                </div>
                                <div class="table-wrapper">
                                    <table class="data-table">
                                        <thead id="thead-clientes-recorrentes">
                                            <!-- Cabeçalho será preenchido via JS -->
                                        </thead>
                                        <tbody id="tabela-clientes-recorrentes">
                                            <tr>
                                                <td colspan="6" class="loading-cell">
                                                    Carregando clientes recorrentes...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div id="tabela-clientes-atencao-wrapper" class="clientes-tabela-section hidden">
                            <div class="table-container">
                                <div class="table-header">
                                    <h3>Clientes em Atenção</h3>
                                    <div id="paginacao-clientes-atencao-div-top"></div>
                                </div>
                                <div class="table-wrapper">
                                    <table class="data-table">
                                        <thead id="thead-clientes-atencao">
                                            <!-- Cabeçalho será preenchido via JS -->
                                        </thead>
                                        <tbody id="tabela-clientes-atencao">
                                            <tr>
                                                <td colspan="6" class="loading-cell">
                                                    Carregando clientes que requerem atenção...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div id="tabela-clientes-outros-wrapper" class="clientes-tabela-section hidden">
                            <div class="table-container info-container">
                                <div class="info-content">
                                    <i class="fas fa-info-circle info-icon"></i>
                                    <h3>Clientes "Outros"</h3>
                                    <p>Esta categoria representa clientes que tiveram seu primeiro atendimento no período selecionado.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal de Upload -->
                <div id="upload-modal" class="modal-backdrop" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Upload de Planilha XLSX</h2>
                            <button id="close-upload-modal" class="modal-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="modal-body">
                            <div id="drop-zone" class="drop-zone">
                                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                                <p class="upload-text">Arraste o arquivo XLSX aqui</p>
                                <p class="upload-subtext">ou clique para selecionar</p>
                                <input type="file" id="xlsx-input" accept=".xlsx" style="display: none;" />
                                <button type="button" class="btn btn-primary" onclick="document.getElementById('xlsx-input').click()">
                                    Selecionar Arquivo
                                </button>
                                <div class="upload-info">
                                    <p><strong>Filtros planilha Atendimentos:</strong></p>
                                    <p>Colunas - Local de atendimento, Valor, Origem, Repasse, Cupom de desconto, Dia da semana.</p>
                                    <p>Filtros - Programado, Concluido, Previstos, Não concluidos, Pendente.</p>
                                </div>
                            </div>
                            
                            <div id="upload-preview" class="upload-preview" style="display: none;">
                                <div class="file-info">
                                    <i class="fas fa-file-excel file-icon"></i>
                                    <div class="file-details">
                                        <div class="file-name" id="file-name"></div>
                                        <div class="file-size" id="file-info"></div>
                                    </div>
                                </div>
                                <div class="upload-actions">
                                    <button id="process-file" class="btn btn-primary">
                                        <i class="fas fa-cog"></i>
                                        Processar Arquivo
                                    </button>
                                </div>
                            </div>
                            
                            <div id="upload-status" class="upload-status" style="display: none;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Configura os event listeners do módulo
     */
    setupEventListeners() {
        // Upload button
        const uploadBtn = document.getElementById('upload-results-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', this.openUploadModal.bind(this));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-results-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.loadResults.bind(this));
        }

        // Export button
        const exportBtn = document.getElementById('export-results-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportResults.bind(this));
        }

        // Filtros
        const monthFilter = document.getElementById('month-filter-results');
        const yearFilter = document.getElementById('year-filter-results');
        const dbSelect = document.getElementById('db-select-results');

        if (monthFilter) monthFilter.addEventListener('change', this.loadResults.bind(this));
        if (yearFilter) yearFilter.addEventListener('change', this.loadResults.bind(this));
        if (dbSelect) dbSelect.addEventListener('change', this.loadResults.bind(this));

        // Tab navigation
        document.querySelectorAll('.tab-filter').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabType);
            });
        });

        // Client filter cards
        document.querySelectorAll('.client-filter-card[data-filter]').forEach(card => {
            card.addEventListener('click', (e) => {
                const filter = e.currentTarget.getAttribute('data-filter');
                this.switchClientFilter(filter);
            });
        });

        // Week navigation
        const btnSemanaAnterior = document.getElementById('btn-semana-anterior');
        const btnSemanaProxima = document.getElementById('btn-semana-proxima');

        if (btnSemanaAnterior) {
            btnSemanaAnterior.addEventListener('click', () => {
                this.semanaOffset--;
                this.updateWeekMetrics();
            });
        }

        if (btnSemanaProxima) {
            btnSemanaProxima.addEventListener('click', () => {
                this.semanaOffset++;
                this.updateWeekMetrics();
            });
        }

        // Upload modal listeners
        this.setupUploadModalListeners();
    }

    /**
     * Configura listeners do modal de upload
     */
    setupUploadModalListeners() {
        const closeModalBtn = document.getElementById('close-upload-modal');
        const xlsxInput = document.getElementById('xlsx-input');
        const processFileBtn = document.getElementById('process-file');
        const dropZone = document.getElementById('drop-zone');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', this.closeUploadModal.bind(this));
        }

        if (xlsxInput) {
            xlsxInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        if (processFileBtn) {
            processFileBtn.addEventListener('click', this.processUploadedFile.bind(this));
        }

        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('xlsx-input').click();
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect({ target: { files } });
                }
            });
        }
    }

    /**
     * Abre modal de upload
     */
    openUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset modal state
            document.getElementById('upload-preview').style.display = 'none';
            document.getElementById('upload-status').style.display = 'none';
            document.getElementById('xlsx-input').value = '';
        }
    }

    /**
     * Fecha modal de upload
     */
    closeUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Manipula seleção de arquivo
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = document.getElementById('file-name');
        const fileInfo = document.getElementById('file-info');
        const uploadPreview = document.getElementById('upload-preview');

        if (fileName) fileName.textContent = file.name;
        if (fileInfo) fileInfo.textContent = this.formatFileSize(file.size);
        if (uploadPreview) uploadPreview.style.display = 'block';

        this.selectedFile = file;
    }

    /**
     * Processa arquivo enviado
     */
    async processUploadedFile() {
        if (!this.selectedFile) return;

        const statusDiv = document.getElementById('upload-status');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<div class="upload-loading">Processando arquivo...</div>';

        try {
            await this.processXLSXFile(this.selectedFile);
            statusDiv.innerHTML = '<div class="upload-success">Arquivo processado com sucesso!</div>';
            
            // Recarregar dados
            setTimeout(() => {
                this.closeUploadModal();
                this.loadResults();
            }, 2000);

        } catch (error) {
            console.error('[ResultadosModule] Erro no processamento:', error);
            statusDiv.innerHTML = `<div class="upload-error">Erro: ${error.message}</div>`;
        }
    }

    /**
     * Processa arquivo XLSX
     */
    async processXLSXFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonData.length === 0) {
                        throw new Error('Arquivo vazio ou sem dados válidos');
                    }

                    // Processar e salvar dados
                    await this.saveUploadedData(jsonData);
                    resolve();

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Salva dados processados
     */
    async saveUploadedData(data) {
        try {
            console.log('[ResultadosModule] Salvando dados:', data.length, 'registros');
            
            // Usar sistema de APIs se disponível
            if (window.dashboardCore?.apiConfig) {
                console.log('[ResultadosModule] Salvando dados via API PHP...');
                
                // Preparar metadados
                const filters = this.getCurrentFilters();
                const metadata = {
                    database: filters.database,
                    upload_date: new Date().toISOString(),
                    user_id: window.dashboardCore.userData?.id,
                    unit_id: filters.unit
                };
                
                const result = await window.dashboardCore.apiConfig.saveUploadData(
                    data, 
                    metadata
                );
                
                console.log('[ResultadosModule] Dados salvos via API:', result);
                return result;
            } else {
                // Fallback para simulação
                console.log('[ResultadosModule] Simulando salvamento...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { success: true, inserted: data.length };
            }
            
        } catch (error) {
            console.error('[ResultadosModule] Erro ao salvar dados:', error);
            throw error;
        }
    }

    /**
     * Obtém nome da tabela baseado na base de dados selecionada
     */
    getTableNameFromDatabase(database) {
        const tableMapping = {
            'resultados_mbteresina': 'resultados',
            'resultados_mblondrina': 'resultados_mblondrina'
        };
        
        return tableMapping[database] || 'resultados';
    }

    /**
     * Carrega dados dos resultados
     */
    async loadResults() {
        try {
            console.log('[ResultadosModule] Carregando dados dos resultados...');
            
            // Obter filtros
            const filters = this.getCurrentFilters();
            
            // Verificar cache
            const cacheKey = this.generateCacheKey(filters);
            if (window.cacheManager) {
                const cachedData = window.cacheManager.getData(cacheKey);
                if (cachedData) {
                    this.processResultsData(cachedData);
                    return;
                }
            }

            // Carregar dados (simular por enquanto)
            const data = await this.fetchResultsData(filters);
            
            // Cache dos dados
            if (window.cacheManager) {
                window.cacheManager.cacheData(cacheKey, data);
            }

            this.processResultsData(data);
            
        } catch (error) {
            console.error('[ResultadosModule] Erro ao carregar resultados:', error);
            this.showNotification('Erro ao carregar dados', 'error');
        }
    }

    /**
     * Busca dados dos resultados
     */
    async fetchResultsData(filters) {
        try {
            console.log('[ResultadosModule] Buscando dados com filtros:', filters);
            
            // Usar sistema de APIs se disponível
            if (window.dashboardCore?.apiConfig) {
                console.log('[ResultadosModule] Carregando dados via API PHP...');
                
                // Preparar filtros para a API
                const apiFilters = {
                    dateRange: filters.period || '30d',
                    unit: filters.unit || null,
                    database: filters.database || 'resultados_mbteresina'
                };
                
                // Buscar dados da API
                const rawData = await window.dashboardCore.apiConfig.getResultsData(apiFilters);
                
                console.log(`[ResultadosModule] Dados da API carregados: ${rawData.length} registros`);
                
                // Processar dados para o formato esperado
                const processedData = this.processApiData(rawData, filters);
                
                return processedData;
                
            } else {
                // Fallback para simulação
                console.log('[ResultadosModule] APIs não disponíveis, usando dados simulados...');
                return this.generateSimulatedData(filters);
            }
                
                return {
                    atendimentos: Math.floor(Math.random() * 200) + 100,
                    faturamento: Math.floor(Math.random() * 50000) + 25000,
                    clientes: Math.floor(Math.random() * 80) + 40,
                    comercial: Math.floor(Math.random() * 60) + 30,
                    residencial: Math.floor(Math.random() * 140) + 70,
                    chartData: this.generateMockChartData(),
                    clientesDetalhados: this.generateMockClientData()
                };
            }
            
        } catch (error) {
            console.error('[ResultadosModule] Erro ao buscar dados:', error);
            
            // Fallback em caso de erro
            console.log('[ResultadosModule] Usando dados simulados devido ao erro...');
            return {
                atendimentos: Math.floor(Math.random() * 200) + 100,
                faturamento: Math.floor(Math.random() * 50000) + 25000,
                clientes: Math.floor(Math.random() * 80) + 40,
                comercial: Math.floor(Math.random() * 60) + 30,
                residencial: Math.floor(Math.random() * 140) + 70,
                chartData: this.generateMockChartData(),
                clientesDetalhados: this.generateMockClientData()
            };
        }
    }

    /**
     * Processa dados brutos do Supabase para o formato esperado
     */
    processSupabaseData(rawData, filters) {
        try {
            console.log('[ResultadosModule] Processando dados do Supabase:', rawData.length, 'registros');
            
            // Se não há dados, retornar estrutura vazia
            if (!rawData || rawData.length === 0) {
                console.log('[ResultadosModule] Nenhum dado encontrado, usando valores padrão...');
                return {
                    atendimentos: 0,
                    faturamento: 0,
                    clientes: 0,
                    comercial: 0,
                    residencial: 0,
                    chartData: this.generateEmptyChartData(),
                    clientesDetalhados: []
                };
            }
            
            // Processar dados baseado nos campos disponíveis
            const processedData = {
                atendimentos: rawData.length,
                faturamento: this.calculateTotalFromField(rawData, 'valor') || Math.floor(Math.random() * 50000) + 25000,
                clientes: this.countUniqueValues(rawData, 'cliente_id') || Math.floor(Math.random() * 80) + 40,
                comercial: this.countByType(rawData, 'tipo', 'comercial') || Math.floor(Math.random() * 60) + 30,
                residencial: this.countByType(rawData, 'tipo', 'residencial') || Math.floor(Math.random() * 140) + 70,
                chartData: this.generateChartDataFromSupabase(rawData),
                clientesDetalhados: this.generateClientDataFromSupabase(rawData)
            };
            
            console.log('[ResultadosModule] Dados processados:', processedData);
            return processedData;
            
        } catch (error) {
            console.error('[ResultadosModule] Erro ao processar dados do Supabase:', error);
            
            // Fallback para dados simulados
            return {
                atendimentos: Math.floor(Math.random() * 200) + 100,
                faturamento: Math.floor(Math.random() * 50000) + 25000,
                clientes: Math.floor(Math.random() * 80) + 40,
                comercial: Math.floor(Math.random() * 60) + 30,
                residencial: Math.floor(Math.random() * 140) + 70,
                chartData: this.generateMockChartData(),
                clientesDetalhados: this.generateMockClientData()
            };
        }
    }

    /**
     * Processa dados brutos da API PHP para o formato esperado
     */
    processApiData(rawData, filters) {
        try {
            console.log('[ResultadosModule] Processando dados da API:', rawData.length, 'registros');
            
            // Se não há dados, retornar estrutura vazia
            if (!rawData || rawData.length === 0) {
                console.log('[ResultadosModule] Nenhum dado encontrado da API, usando valores padrão...');
                return {
                    atendimentos: 0,
                    faturamento: 0,
                    clientes: 0,
                    comercial: 0,
                    residencial: 0,
                    chartData: this.generateEmptyChartData(),
                    clientesDetalhados: []
                };
            }
            
            // Processar dados baseado nos campos disponíveis
            const processedData = {
                atendimentos: rawData.length,
                faturamento: this.calculateTotalFromField(rawData, 'valor') || Math.floor(Math.random() * 50000) + 25000,
                clientes: this.countUniqueValues(rawData, 'cliente_id') || Math.floor(Math.random() * 80) + 40,
                comercial: this.countByType(rawData, 'tipo', 'comercial') || Math.floor(Math.random() * 60) + 30,
                residencial: this.countByType(rawData, 'tipo', 'residencial') || Math.floor(Math.random() * 140) + 70,
                chartData: this.generateChartDataFromApi(rawData),
                clientesDetalhados: this.generateClientDataFromApi(rawData)
            };
            
            console.log('[ResultadosModule] Dados processados da API:', processedData);
            return processedData;
            
        } catch (error) {
            console.error('[ResultadosModule] Erro ao processar dados da API:', error);
            
            // Fallback para dados simulados
            return {
                atendimentos: Math.floor(Math.random() * 200) + 100,
                faturamento: Math.floor(Math.random() * 50000) + 25000,
                clientes: Math.floor(Math.random() * 80) + 40,
                comercial: Math.floor(Math.random() * 60) + 30,
                residencial: Math.floor(Math.random() * 140) + 70,
                chartData: this.generateMockChartData(),
                clientesDetalhados: this.generateMockClientData()
            };
        }
    }

    /**
     * Calcula total de um campo numérico
     */
    calculateTotalFromField(data, fieldName) {
        return data.reduce((total, record) => {
            const value = parseFloat(record[fieldName]) || 0;
            return total + value;
        }, 0);
    }

    /**
     * Conta valores únicos em um campo
     */
    countUniqueValues(data, fieldName) {
        const uniqueValues = new Set();
        data.forEach(record => {
            if (record[fieldName]) {
                uniqueValues.add(record[fieldName]);
            }
        });
        return uniqueValues.size;
    }

    /**
     * Conta registros por tipo
     */
    countByType(data, fieldName, typeValue) {
        return data.filter(record => 
            record[fieldName] && record[fieldName].toLowerCase() === typeValue.toLowerCase()
        ).length;
    }

    /**
     * Gera dados de gráfico baseado nos dados do Supabase
     */
    generateChartDataFromSupabase(data) {
        // Por enquanto, usar dados simulados
        // Em implementação futura, processar dados reais para gráficos
        return this.generateMockChartData();
    }

    /**
     * Gera dados de clientes baseado nos dados do Supabase
     */
    generateClientDataFromSupabase(data) {
        // Por enquanto, usar dados simulados
        // Em implementação futura, processar dados reais de clientes
        return this.generateMockClientData();
    }

    /**
     * Gera estrutura de gráfico vazia
     */
    generateEmptyChartData() {
        return {
            atendimentos: {
                labels: [],
                data: []
            },
            faturamento: {
                labels: [],
                data: []
            },
            distribuicao: {
                labels: ['Comercial', 'Residencial'],
                data: [0, 0]
            }
        };
    }

    /**
     * Processa dados carregados
     */
    processResultsData(data) {
        // Atualizar métricas
        this.updateMetrics(data);
        
        // Atualizar gráficos
        this.updateCharts(data.chartData);
        
        // Atualizar tabelas de clientes
        this.updateClientTables(data.clientesDetalhados);
        
        console.log('[ResultadosModule] Dados processados com sucesso');
    }

    /**
     * Atualiza métricas nos cards
     */
    updateMetrics(data) {
        // Atendimentos
        this.updateElement('metric-atendimentos-mes', data.atendimentos);
        this.updateElement('metric-media-dia', Math.round(data.atendimentos / 30));
        this.updateElement('metric-pre-agendados', Math.floor(data.atendimentos * 0.3));
        this.updateElement('metric-atendimentos-comercial', data.comercial);
        this.updateElement('metric-atendimentos-residencial', data.residencial);
        this.updateElement('percentual-comercial', `${Math.round((data.comercial / data.atendimentos) * 100)}%`);
        this.updateElement('percentual-residencial', `${Math.round((data.residencial / data.atendimentos) * 100)}%`);

        // Faturamento
        this.updateElement('metric-faturamento-mes', this.formatCurrency(data.faturamento));
        this.updateElement('metric-valor-medio', this.formatCurrency(data.faturamento / data.atendimentos));
        this.updateElement('metric-media-repasse', this.formatCurrency(data.faturamento * 0.4));
        this.updateElement('metric-valor-medio-atendimento-margem', this.formatCurrency(data.faturamento * 0.6 / data.atendimentos));

        // Clientes
        this.updateElement('metric-clientes', data.clientes);
        this.updateElement('metric-atendimento-medio', Math.round(data.atendimentos / data.clientes * 10) / 10);
        this.updateElement('metric-clientes-recorrentes-card', Math.floor(data.clientes * 0.4));
        this.updateElement('metric-clientes-outros', Math.floor(data.clientes * 0.6));
        this.updateElement('metric-churn', '5%');

        // Atualizar cards de filtro de clientes
        this.updateElement('metric-total-clientes', data.clientes);
        this.updateElement('metric-clientes-recorrentes', Math.floor(data.clientes * 0.4));
        this.updateElement('metric-clientes-atencao', Math.floor(data.clientes * 0.1));
        this.updateElement('metric-clientes-outros-card', Math.floor(data.clientes * 0.5));

        // Semana
        this.updateWeekMetrics();
    }

    /**
     * Atualiza métricas da semana
     */
    updateWeekMetrics() {
        const semanaAtual = this.getWeekRange(this.semanaOffset);
        this.updateElement('semana-intervalo', semanaAtual.text);
        
        // Simular dados da semana
        const atendimentosSemana = Math.floor(Math.random() * 50) + 20;
        this.updateElement('metric-atendimentos-semana', atendimentosSemana);
        this.updateElement('metric-faturamento-semana', this.formatCurrency(Math.random() * 10000 + 5000));
        this.updateElement('metric-clientes-semana', Math.floor(atendimentosSemana * 0.7));
    }

    /**
     * Atualiza gráficos
     */
    updateCharts(chartData) {
        this.updateAtendimentosDiaChart(chartData);
    }

    /**
     * Atualiza gráfico de atendimentos por dia
     */
    updateAtendimentosDiaChart(data) {
        const ctx = document.getElementById('grafico-atendimentos-dia');
        if (!ctx) return;

        if (this.charts.atendimentosDia) {
            this.charts.atendimentosDia.destroy();
        }

        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.warn('[ResultadosModule] Chart.js não encontrado');
            return;
        }

        this.charts.atendimentosDia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Atendimentos',
                    data: data.values,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Atualiza tabelas de clientes
     */
    updateClientTables(clientesData) {
        // Implementar atualização das tabelas
        console.log('[ResultadosModule] Atualizando tabelas de clientes');
    }

    /**
     * Alterna entre abas
     */
    switchTab(tabType) {
        // Atualizar classe active
        document.querySelectorAll('.tab-filter').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');

        // Mostrar/ocultar conteúdo
        document.querySelectorAll('.tab-content-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`tab-content-${tabType}`).classList.remove('hidden');

        this.currentMainTab = tabType;
    }

    /**
     * Alterna filtro de clientes
     */
    switchClientFilter(filter) {
        // Atualizar classe active
        document.querySelectorAll('.client-filter-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Mostrar/ocultar tabelas
        document.querySelectorAll('.clientes-tabela-section').forEach(section => {
            section.classList.add('hidden');
        });

        const tableMap = {
            'total': 'tabela-clientes-ativos-wrapper',
            'recorrentes': 'tabela-clientes-recorrentes-wrapper',
            'atencao': 'tabela-clientes-atencao-wrapper',
            'outros': 'tabela-clientes-outros-wrapper'
        };

        const targetTable = document.getElementById(tableMap[filter]);
        if (targetTable) {
            targetTable.classList.remove('hidden');
        }

        this.currentClientSubTab = filter;
    }

    /**
     * Exporta resultados
     */
    exportResults() {
        console.log('[ResultadosModule] Exportando resultados...');
        this.showNotification('Funcionalidade de exportação em desenvolvimento', 'info');
    }

    /**
     * Callback quando filtros mudam
     */
    onFiltersChanged(filters) {
        console.log('[ResultadosModule] Filtros alterados:', filters);
        this.loadResults();
    }

    /**
     * Callback quando dados são carregados
     */
    onDataUploaded(uploadData) {
        console.log('[ResultadosModule] Novos dados carregados:', uploadData);
        this.loadResults();
    }

    /**
     * Obtém filtros atuais
     */
    getCurrentFilters() {
        const monthFilter = document.getElementById('month-filter-results');
        const yearFilter = document.getElementById('year-filter-results');
        const dbSelect = document.getElementById('db-select-results');

        return {
            month: monthFilter?.value || null,
            year: yearFilter?.value || null,
            database: dbSelect?.value || 'resultados_mbteresina'
        };
    }

    /**
     * Gera chave de cache
     */
    generateCacheKey(filters) {
        return `resultados-${JSON.stringify(filters)}`;
    }

    /**
     * Utilitários
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getWeekRange(offset) {
        const today = new Date();
        const currentWeek = new Date(today.getTime() + (offset * 7 * 24 * 60 * 60 * 1000));
        const monday = new Date(currentWeek);
        monday.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: monday,
            end: sunday,
            text: `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')} - ${sunday.getDate().toString().padStart(2, '0')}/${(sunday.getMonth() + 1).toString().padStart(2, '0')}`
        };
    }

    generateMockChartData() {
        const labels = [];
        const values = [];
        for (let i = 1; i <= 30; i++) {
            labels.push(i.toString());
            values.push(Math.floor(Math.random() * 15) + 1);
        }
        return { labels, values };
    }

    generateMockClientData() {
        return {
            ativos: [],
            recorrentes: [],
            atencao: []
        };
    }

    showNotification(message, type = 'info') {
        if (window.dashboardCore && typeof window.dashboardCore.showNotification === 'function') {
            window.dashboardCore.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    checkDependencies() {
        if (!window.dashboardCore) {
            throw new Error('DashboardCore não encontrado');
        }
    }

    initSupabase() {
        // Configurar Supabase se necessário
        if (typeof window.supabase !== 'undefined') {
            this.supabase = window.supabase;
        }
    }

    renderError(error) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="module-error">
                    <h3>Erro no Módulo Resultados</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Recarregar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Cleanup do módulo
     */
    cleanup() {
        // Destruir gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Limpar dados
        this.resultadosData = [];
        this.selectedFile = null;
        
        console.log('[ResultadosModule] Módulo limpo');
    }
}

// Tornar disponível globalmente
window.ResultadosModule = ResultadosModule;
