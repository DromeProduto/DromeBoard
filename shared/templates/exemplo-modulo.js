/**
 * Exemplo de Módulo - DromeBoard
 * Demonstra como usar o template base
 */
class ExemploModulo {
    constructor() {
        this.dados = [];
        this.init();
    }

    init() {
        // Aguarda o template base estar pronto
        if (window.baseTemplate) {
            this.setupModule();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupModule(), 100);
            });
        }
    }

    setupModule() {
        console.log('📱 Exemplo Módulo iniciado');

        // Atualiza informações da página
        this.updatePageInfo();
        
        // Adiciona ações da página
        this.addPageActions();
        
        // Carrega estatísticas
        this.loadStats();
        
        // Carrega conteúdo principal
        this.loadMainContent();
        
        // Setup de eventos específicos
        this.setupEventListeners();
    }

    updatePageInfo() {
        window.baseTemplate.updatePageHeader(
            'Exemplo de Módulo',
            'Demonstração de como usar o template base do DromeBoard'
        );
    }

    addPageActions() {
        const actions = `
            <button class="drome-btn drome-btn-primary" id="btn-novo">
                <i class="fas fa-plus drome-mr-2"></i>
                Novo Item
            </button>
            <button class="drome-btn drome-btn-secondary" id="btn-exportar">
                <i class="fas fa-download drome-mr-2"></i>
                Exportar
            </button>
            <button class="drome-btn drome-btn-outline" id="btn-filtros">
                <i class="fas fa-filter drome-mr-2"></i>
                Filtros
            </button>
        `;
        
        window.baseTemplate.addPageAction(actions);
    }

    loadStats() {
        // Simula carregamento de estatísticas
        const stats = [
            { value: '248', label: 'Total de Itens', color: 'primary' },
            { value: '89%', label: 'Taxa de Sucesso', color: 'success' },
            { value: '12', label: 'Pendentes', color: 'warning' },
            { value: '3', label: 'Erros', color: 'danger' }
        ];

        window.baseTemplate.showPageStats(stats);
    }

    loadMainContent() {
        const content = `
            <!-- Filtros -->
            <div class="drome-card">
                <div class="drome-card-header">
                    <h3 class="drome-card-title">
                        <i class="fas fa-search drome-mr-2"></i>
                        Filtros de Busca
                    </h3>
                </div>
                <div class="drome-card-body">
                    <div class="drome-grid drome-grid-cols-1 drome-md-grid-cols-3 drome-gap-4">
                        <div>
                            <label class="drome-form-label">Nome</label>
                            <input type="text" class="drome-form-control" id="filter-name" placeholder="Digite o nome...">
                        </div>
                        <div>
                            <label class="drome-form-label">Status</label>
                            <select class="drome-form-control" id="filter-status">
                                <option value="">Todos</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                        <div class="drome-flex drome-items-end">
                            <button class="drome-btn drome-btn-primary drome-w-full" id="btn-aplicar-filtros">
                                <i class="fas fa-search drome-mr-2"></i>
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Dados -->
            <div class="drome-card">
                <div class="drome-card-header">
                    <h3 class="drome-card-title">
                        <i class="fas fa-list drome-mr-2"></i>
                        Lista de Dados
                    </h3>
                    <div class="drome-card-actions">
                        <button class="drome-btn drome-btn-ghost drome-btn-sm" id="btn-atualizar">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="drome-card-body drome-p-0">
                    <div id="dados-container">
                        <!-- Dados serão carregados aqui -->
                        <div class="drome-p-8 drome-text-center drome-text-gray-500">
                            <div class="drome-animate-pulse drome-mb-4">
                                <i class="fas fa-spinner fa-spin drome-text-2xl"></i>
                            </div>
                            Carregando dados...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Grid de Cards (exemplo alternativo) -->
            <div class="drome-card">
                <div class="drome-card-header">
                    <h3 class="drome-card-title">
                        <i class="fas fa-th-large drome-mr-2"></i>
                        Visualização em Cards
                    </h3>
                </div>
                <div class="drome-card-body">
                    <div id="cards-container" class="drome-grid drome-grid-cols-1 drome-md-grid-cols-2 drome-lg-grid-cols-3 drome-gap-4">
                        <!-- Cards serão carregados aqui -->
                    </div>
                </div>
            </div>
        `;

        window.baseTemplate.updateMainContent(content);

        // Carrega dados após inserir o conteúdo
        setTimeout(() => {
            this.loadData();
            this.loadCards();
        }, 500);
    }

    setupEventListeners() {
        // Botão Novo Item
        document.getElementById('btn-novo')?.addEventListener('click', () => {
            this.showModal('create');
        });

        // Botão Exportar
        document.getElementById('btn-exportar')?.addEventListener('click', () => {
            this.exportData();
        });

        // Botão Filtros
        document.getElementById('btn-filtros')?.addEventListener('click', () => {
            this.toggleFilters();
        });

        // Aplicar Filtros
        document.getElementById('btn-aplicar-filtros')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Atualizar
        document.getElementById('btn-atualizar')?.addEventListener('click', () => {
            this.refreshData();
        });
    }

    loadData() {
        // Simula dados da API
        this.dados = [
            { id: 1, nome: 'Item 1', status: 'ativo', data: '2025-01-01', valor: 'R$ 1.500,00' },
            { id: 2, nome: 'Item 2', status: 'pendente', data: '2025-01-02', valor: 'R$ 2.300,00' },
            { id: 3, nome: 'Item 3', status: 'ativo', data: '2025-01-03', valor: 'R$ 890,00' },
            { id: 4, nome: 'Item 4', status: 'inativo', data: '2025-01-04', valor: 'R$ 3.200,00' },
            { id: 5, nome: 'Item 5', status: 'ativo', data: '2025-01-05', valor: 'R$ 1.750,00' }
        ];

        this.renderTable();
    }

    renderTable() {
        const container = document.getElementById('dados-container');
        if (!container) return;

        const tableHtml = `
            <div class="drome-overflow-x-auto">
                <table class="drome-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Valor</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.dados.map(item => `
                            <tr>
                                <td>${item.id}</td>
                                <td class="drome-font-medium">${item.nome}</td>
                                <td>
                                    <span class="drome-badge drome-badge-${this.getStatusColor(item.status)}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td>${item.data}</td>
                                <td class="drome-font-medium">${item.valor}</td>
                                <td>
                                    <div class="drome-flex drome-gap-2">
                                        <button class="drome-btn drome-btn-ghost drome-btn-sm" 
                                                onclick="exemploModulo.editItem(${item.id})" 
                                                title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="drome-btn drome-btn-ghost drome-btn-sm drome-text-red-600" 
                                                onclick="exemploModulo.deleteItem(${item.id})" 
                                                title="Excluir">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHtml;
    }

    loadCards() {
        const container = document.getElementById('cards-container');
        if (!container) return;

        const cardsHtml = this.dados.slice(0, 3).map(item => `
            <div class="drome-card drome-card-hover">
                <div class="drome-card-body">
                    <div class="drome-flex drome-items-center drome-justify-between drome-mb-3">
                        <h4 class="drome-font-semibold">${item.nome}</h4>
                        <span class="drome-badge drome-badge-${this.getStatusColor(item.status)}">
                            ${item.status}
                        </span>
                    </div>
                    <div class="drome-space-y-2 drome-text-sm">
                        <div class="drome-flex drome-justify-between">
                            <span class="drome-text-gray-600">Data:</span>
                            <span>${item.data}</span>
                        </div>
                        <div class="drome-flex drome-justify-between">
                            <span class="drome-text-gray-600">Valor:</span>
                            <span class="drome-font-medium">${item.valor}</span>
                        </div>
                    </div>
                    <div class="drome-flex drome-gap-2 drome-mt-4">
                        <button class="drome-btn drome-btn-primary drome-btn-sm drome-flex-1" 
                                onclick="exemploModulo.editItem(${item.id})">
                            Editar
                        </button>
                        <button class="drome-btn drome-btn-outline drome-btn-sm" 
                                onclick="exemploModulo.viewDetails(${item.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = cardsHtml;
    }

    getStatusColor(status) {
        const colors = {
            'ativo': 'success',
            'inativo': 'secondary',
            'pendente': 'warning'
        };
        return colors[status] || 'secondary';
    }

    showModal(action, itemId = null) {
        const isEdit = action === 'edit';
        const item = isEdit ? this.dados.find(d => d.id === itemId) : null;

        const modal = window.dromeDesignSystem.modal.create({
            title: isEdit ? 'Editar Item' : 'Novo Item',
            content: `
                <form id="item-form" class="drome-space-y-4">
                    <div>
                        <label class="drome-form-label">Nome</label>
                        <input type="text" id="item-name" class="drome-form-control" 
                               value="${item?.nome || ''}" required>
                    </div>
                    <div>
                        <label class="drome-form-label">Status</label>
                        <select id="item-status" class="drome-form-control" required>
                            <option value="ativo" ${item?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                            <option value="inativo" ${item?.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                            <option value="pendente" ${item?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                        </select>
                    </div>
                    <div>
                        <label class="drome-form-label">Data</label>
                        <input type="date" id="item-date" class="drome-form-control" 
                               value="${item?.data || ''}" required>
                    </div>
                    <div>
                        <label class="drome-form-label">Valor</label>
                        <input type="text" id="item-value" class="drome-form-control" 
                               value="${item?.valor || ''}" placeholder="R$ 0,00" required>
                    </div>
                </form>
            `,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'secondary',
                    action: (modal) => window.dromeDesignSystem.modal.close(modal)
                },
                {
                    text: isEdit ? 'Salvar' : 'Criar',
                    class: 'primary',
                    action: () => this.saveItem(isEdit, itemId)
                }
            ]
        });
    }

    saveItem(isEdit, itemId) {
        const form = document.getElementById('item-form');
        if (!form.checkValidity()) {
            window.dromeDesignSystem.notifications.warning('Preencha todos os campos obrigatórios');
            return;
        }

        const data = {
            nome: document.getElementById('item-name').value,
            status: document.getElementById('item-status').value,
            data: document.getElementById('item-date').value,
            valor: document.getElementById('item-value').value
        };

        if (isEdit) {
            const index = this.dados.findIndex(d => d.id === itemId);
            this.dados[index] = { ...this.dados[index], ...data };
            window.dromeDesignSystem.notifications.success('Item atualizado com sucesso!');
        } else {
            const newId = Math.max(...this.dados.map(d => d.id)) + 1;
            this.dados.push({ id: newId, ...data });
            window.dromeDesignSystem.notifications.success('Item criado com sucesso!');
        }

        this.renderTable();
        this.loadCards();
        
        // Fecha o modal
        const modals = document.querySelectorAll('.drome-modal');
        modals.forEach(modal => window.dromeDesignSystem.modal.close(modal));
    }

    editItem(id) {
        this.showModal('edit', id);
    }

    deleteItem(id) {
        const item = this.dados.find(d => d.id === id);
        
        const modal = window.dromeDesignSystem.modal.create({
            title: 'Confirmar Exclusão',
            content: `Tem certeza que deseja excluir o item "${item.nome}"?`,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'secondary',
                    action: (modal) => window.dromeDesignSystem.modal.close(modal)
                },
                {
                    text: 'Excluir',
                    class: 'danger',
                    action: () => {
                        this.dados = this.dados.filter(d => d.id !== id);
                        this.renderTable();
                        this.loadCards();
                        window.dromeDesignSystem.notifications.success('Item excluído com sucesso!');
                        
                        // Fecha o modal
                        const modals = document.querySelectorAll('.drome-modal');
                        modals.forEach(modal => window.dromeDesignSystem.modal.close(modal));
                    }
                }
            ]
        });
    }

    viewDetails(id) {
        const item = this.dados.find(d => d.id === id);
        
        const modal = window.dromeDesignSystem.modal.create({
            title: `Detalhes: ${item.nome}`,
            content: `
                <div class="drome-space-y-4">
                    <div class="drome-grid drome-grid-cols-2 drome-gap-4">
                        <div>
                            <label class="drome-text-sm drome-font-medium drome-text-gray-600">ID</label>
                            <p class="drome-text-lg">${item.id}</p>
                        </div>
                        <div>
                            <label class="drome-text-sm drome-font-medium drome-text-gray-600">Status</label>
                            <p><span class="drome-badge drome-badge-${this.getStatusColor(item.status)}">${item.status}</span></p>
                        </div>
                        <div>
                            <label class="drome-text-sm drome-font-medium drome-text-gray-600">Data</label>
                            <p class="drome-text-lg">${item.data}</p>
                        </div>
                        <div>
                            <label class="drome-text-sm drome-font-medium drome-text-gray-600">Valor</label>
                            <p class="drome-text-lg drome-font-bold drome-text-primary">${item.valor}</p>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Fechar',
                    class: 'primary',
                    action: (modal) => window.dromeDesignSystem.modal.close(modal)
                }
            ]
        });
    }

    exportData() {
        window.dromeDesignSystem.notifications.info('Exportando dados...', 'Aguarde');
        
        // Simula exportação
        setTimeout(() => {
            window.dromeDesignSystem.notifications.success('Dados exportados com sucesso!');
        }, 2000);
    }

    toggleFilters() {
        const filtersCard = document.querySelector('.drome-card');
        const isHidden = filtersCard.style.display === 'none';
        filtersCard.style.display = isHidden ? 'block' : 'none';
        
        window.dromeDesignSystem.notifications.info(
            isHidden ? 'Filtros exibidos' : 'Filtros ocultados'
        );
    }

    applyFilters() {
        const name = document.getElementById('filter-name').value.toLowerCase();
        const status = document.getElementById('filter-status').value;
        
        let filteredData = this.dados;
        
        if (name) {
            filteredData = filteredData.filter(item => 
                item.nome.toLowerCase().includes(name)
            );
        }
        
        if (status) {
            filteredData = filteredData.filter(item => item.status === status);
        }
        
        // Atualiza temporariamente os dados para mostrar os filtros
        const originalData = [...this.dados];
        this.dados = filteredData;
        this.renderTable();
        
        window.dromeDesignSystem.notifications.success(
            `Filtros aplicados: ${filteredData.length} item(ns) encontrado(s)`
        );
        
        // Restaura dados originais após 5 segundos (demo)
        setTimeout(() => {
            this.dados = originalData;
            this.renderTable();
            window.dromeDesignSystem.notifications.info('Filtros removidos (demo)');
        }, 5000);
    }

    refreshData() {
        window.dromeDesignSystem.notifications.info('Atualizando dados...');
        
        // Simula refresh
        setTimeout(() => {
            this.loadData();
            this.loadCards();
            window.dromeDesignSystem.notifications.success('Dados atualizados!');
        }, 1500);
    }
}

// Inicializa o módulo
window.exemploModulo = new ExemploModulo();
