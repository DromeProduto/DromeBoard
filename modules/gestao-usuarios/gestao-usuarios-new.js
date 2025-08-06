// DromeBoard - Gestão de Usuários v2.0
// Módulo completo para gerenciamento de usuários com Design System

class DromeUserManagement {
    constructor() {
        this.designSystem = null;
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentUser = null;
        this.apiUrl = '../../api/users.php';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Verificar autenticação
            this.checkAuthentication();
            
            // Inicializar Design System
            this.designSystem = new DromeDesignSystem();
            
            // Configurar interface
            this.setupNavigation();
            this.setupEventListeners();
            this.setupModal();
            this.setupFilters();
            
            // Carregar dados
            this.loadUsers();
        });
    }

    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userSession = localStorage.getItem('userSession');
        
        if (!isLoggedIn || !userSession) {
            window.location.href = '../../auth/login.html';
            return;
        }

        // Atualizar informações do usuário na interface
        const userData = JSON.parse(userSession);
        this.updateUserInfo(userData);
    }

    updateUserInfo(userData) {
        const userNameEl = document.getElementById('user-name');
        const userInitialEl = document.querySelector('#user-menu-btn .drome-rounded-full');
        
        if (userNameEl && userData.name) {
            userNameEl.textContent = userData.name;
        }
        
        if (userInitialEl && userData.name) {
            userInitialEl.textContent = userData.name.charAt(0).toUpperCase();
        }
    }

    setupNavigation() {
        // User menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('drome-hidden');
            });
            
            document.addEventListener('click', () => {
                userDropdown.classList.add('drome-hidden');
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.designSystem.theme.toggle();
                
                const icon = themeToggle.querySelector('i');
                if (document.documentElement.classList.contains('dark')) {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            });
        }

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('drome-hidden');
            });
        }
    }

    setupEventListeners() {
        // New user button
        const newUserBtn = document.getElementById('new-user-btn');
        if (newUserBtn) {
            newUserBtn.addEventListener('click', () => {
                this.openUserModal();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportUsers();
            });
        }

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterUsers();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                this.toggleSelectAll();
            });
        }

        // Pagination
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderUsers();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderUsers();
                }
            });
        }
    }

    setupModal() {
        const modal = document.getElementById('user-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const userForm = document.getElementById('user-form');
        
        // Close modal handlers
        [closeModalBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.closeUserModal();
                });
            }
        });

        // Close modal on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeUserModal();
                }
            });
        }

        // Form submission
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUserSubmit();
            });
        }
    }

    setupFilters() {
        const statusFilter = document.getElementById('status-filter');
        const roleFilter = document.getElementById('role-filter');
        
        [statusFilter, roleFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterUsers();
                });
            }
        });
    }

    async loadUsers() {
        try {
            this.showLoadingState(true);
            
            const response = await fetch(`${this.apiUrl}?action=list`);
            const result = await response.json();
            
            if (result.success) {
                this.users = result.data || [];
                this.filteredUsers = [...this.users];
                this.renderUsers();
            } else {
                throw new Error(result.message || 'Erro ao carregar usuários');
            }
            
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            this.showError('Erro ao carregar usuários: ' + error.message);
            this.showEmptyState();
        } finally {
            this.showLoadingState(false);
        }
    }

    filterUsers() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;
        const roleFilter = document.getElementById('role-filter').value;
        
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.role.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || user.status === statusFilter;
            const matchesRole = !roleFilter || user.role === roleFilter;
            
            return matchesSearch && matchesStatus && matchesRole;
        });
        
        this.currentPage = 1;
        this.renderUsers();
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        const emptyState = document.getElementById('empty-state');
        const pagination = document.getElementById('pagination');
        
        if (!tbody) return;
        
        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
        
        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('drome-hidden');
            pagination.classList.add('drome-hidden');
            return;
        }
        
        emptyState.classList.add('drome-hidden');
        pagination.classList.remove('drome-hidden');
        
        tbody.innerHTML = paginatedUsers.map(user => `
            <tr class="hover:drome-bg-gray-50 dark:hover:drome-bg-gray-800 drome-transition-colors">
                <td class="drome-px-6 drome-py-4 drome-whitespace-nowrap">
                    <input type="checkbox" class="drome-checkbox user-checkbox" data-user-id="${user.id}">
                </td>
                <td class="drome-px-6 drome-py-4 drome-whitespace-nowrap">
                    <div class="drome-flex drome-items-center">
                        <div class="drome-w-10 drome-h-10 drome-bg-primary drome-rounded-full drome-flex drome-items-center drome-justify-center drome-text-white drome-font-medium drome-mr-4">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="drome-text-sm drome-font-medium drome-text-gray-900 dark:drome-text-white">
                                ${user.name}
                            </div>
                            <div class="drome-text-sm drome-text-gray-500 dark:drome-text-gray-400">
                                ${user.email}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="drome-px-6 drome-py-4 drome-whitespace-nowrap">
                    <span class="drome-inline-flex drome-items-center drome-px-2.5 drome-py-0.5 drome-rounded-full drome-text-xs drome-font-medium ${this.getRoleBadgeClass(user.role)}">
                        ${this.getRoleLabel(user.role)}
                    </span>
                </td>
                <td class="drome-px-6 drome-py-4 drome-whitespace-nowrap">
                    <span class="drome-inline-flex drome-items-center drome-px-2.5 drome-py-0.5 drome-rounded-full drome-text-xs drome-font-medium ${this.getStatusBadgeClass(user.status)}">
                        <span class="drome-w-1.5 drome-h-1.5 drome-mr-1.5 drome-rounded-full ${this.getStatusDotClass(user.status)}"></span>
                        ${this.getStatusLabel(user.status)}
                    </span>
                </td>
                <td class="drome-px-6 drome-py-4 drome-whitespace-nowrap drome-text-sm drome-text-gray-500 dark:drome-text-gray-400">
                    ${this.formatDate(user.last_login)}
                </td>
                <td class="drome-px-6 drome-py-4 drome-whitespace-nowrap drome-text-sm drome-font-medium">
                    <div class="drome-flex drome-space-x-2">
                        <button class="drome-text-primary hover:drome-text-secondary drome-transition-colors" onclick="userManagement.editUser(${user.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="drome-text-red-600 hover:drome-text-red-800 drome-transition-colors" onclick="userManagement.deleteUser(${user.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${user.status === 'ativo' ? 
                            `<button class="drome-text-yellow-600 hover:drome-text-yellow-800 drome-transition-colors" onclick="userManagement.toggleUserStatus(${user.id}, 'inativo')" title="Desativar">
                                <i class="fas fa-pause"></i>
                            </button>` :
                            `<button class="drome-text-green-600 hover:drome-text-green-800 drome-transition-colors" onclick="userManagement.toggleUserStatus(${user.id}, 'ativo')" title="Ativar">
                                <i class="fas fa-play"></i>
                            </button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.updatePagination();
    }

    updatePagination() {
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalItems = document.getElementById('total-items');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers.length);
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        
        if (showingStart) showingStart.textContent = startIndex;
        if (showingEnd) showingEnd.textContent = endIndex;
        if (totalItems) totalItems.textContent = this.filteredUsers.length;
        
        if (prevPageBtn) {
            prevPageBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = this.currentPage >= totalPages;
        }
    }

    openUserModal(userId = null) {
        const modal = document.getElementById('user-modal');
        const modalTitle = document.getElementById('modal-title');
        const userForm = document.getElementById('user-form');
        const passwordSection = document.getElementById('password-section');
        
        // Reset form
        userForm.reset();
        this.currentUser = null;
        
        if (userId) {
            // Edit mode
            const user = this.users.find(u => u.id === userId);
            if (user) {
                this.currentUser = user;
                modalTitle.textContent = 'Editar Usuário';
                
                // Fill form
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-phone').value = user.phone || '';
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-status').value = user.status;
                
                // Make password optional for editing
                document.getElementById('user-password').required = false;
                document.getElementById('user-password-confirm').required = false;
            }
        } else {
            // Create mode
            modalTitle.textContent = 'Novo Usuário';
            document.getElementById('user-password').required = true;
            document.getElementById('user-password-confirm').required = true;
        }
        
        modal.classList.remove('drome-hidden');
    }

    closeUserModal() {
        const modal = document.getElementById('user-modal');
        modal.classList.add('drome-hidden');
        this.currentUser = null;
    }

    async handleUserSubmit() {
        const form = document.getElementById('user-form');
        const formData = new FormData(form);
        const saveBtn = document.getElementById('save-btn');
        
        try {
            // Validate passwords
            const password = formData.get('password');
            const passwordConfirm = formData.get('password_confirm');
            
            if (password && password !== passwordConfirm) {
                throw new Error('As senhas não coincidem');
            }
            
            this.setLoadingState(saveBtn, true);
            
            // Prepare data
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                role: formData.get('role'),
                status: formData.get('status')
            };
            
            if (password) {
                userData.password = password;
            }
            
            const isEdit = this.currentUser !== null;
            const url = isEdit ? `${this.apiUrl}?action=update&id=${this.currentUser.id}` : `${this.apiUrl}?action=create`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
                this.closeUserModal();
                this.loadUsers();
            } else {
                throw new Error(result.message || 'Erro ao salvar usuário');
            }
            
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            this.showError('Erro ao salvar usuário: ' + error.message);
        } finally {
            this.setLoadingState(saveBtn, false);
        }
    }

    editUser(userId) {
        this.openUserModal(userId);
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const confirmed = await this.designSystem.modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        
        if (!confirmed) return;
        
        try {
            const response = await fetch(`${this.apiUrl}?action=delete&id=${userId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Usuário excluído com sucesso!');
                this.loadUsers();
            } else {
                throw new Error(result.message || 'Erro ao excluir usuário');
            }
            
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            this.showError('Erro ao excluir usuário: ' + error.message);
        }
    }

    async toggleUserStatus(userId, newStatus) {
        try {
            const response = await fetch(`${this.apiUrl}?action=update_status&id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
                this.loadUsers();
            } else {
                throw new Error(result.message || 'Erro ao atualizar status');
            }
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            this.showError('Erro ao atualizar status: ' + error.message);
        }
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all');
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    exportUsers() {
        // Simulate export functionality
        this.showSuccess('Exportação iniciada! O arquivo será baixado em breve.');
        
        // In a real implementation, you would:
        // 1. Send request to backend to generate export file
        // 2. Download the file
        // 3. Show completion notification
    }

    // Utility methods
    getRoleBadgeClass(role) {
        const classes = {
            'admin': 'drome-bg-red-100 drome-text-red-800 dark:drome-bg-red-900/20 dark:drome-text-red-400',
            'manager': 'drome-bg-blue-100 drome-text-blue-800 dark:drome-bg-blue-900/20 dark:drome-text-blue-400',
            'user': 'drome-bg-gray-100 drome-text-gray-800 dark:drome-bg-gray-900/20 dark:drome-text-gray-400'
        };
        return classes[role] || classes['user'];
    }

    getRoleLabel(role) {
        const labels = {
            'admin': 'Administrador',
            'manager': 'Gerente',
            'user': 'Usuário'
        };
        return labels[role] || role;
    }

    getStatusBadgeClass(status) {
        const classes = {
            'ativo': 'drome-bg-green-100 drome-text-green-800 dark:drome-bg-green-900/20 dark:drome-text-green-400',
            'inativo': 'drome-bg-red-100 drome-text-red-800 dark:drome-bg-red-900/20 dark:drome-text-red-400',
            'pendente': 'drome-bg-yellow-100 drome-text-yellow-800 dark:drome-bg-yellow-900/20 dark:drome-text-yellow-400'
        };
        return classes[status] || classes['pendente'];
    }

    getStatusDotClass(status) {
        const classes = {
            'ativo': 'drome-bg-green-400',
            'inativo': 'drome-bg-red-400',
            'pendente': 'drome-bg-yellow-400'
        };
        return classes[status] || classes['pendente'];
    }

    getStatusLabel(status) {
        const labels = {
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'pendente': 'Pendente'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'Nunca';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoadingState(show) {
        const loadingState = document.getElementById('loading-state');
        const table = document.querySelector('table');
        
        if (loadingState) {
            loadingState.classList.toggle('drome-hidden', !show);
        }
        
        if (table) {
            table.classList.toggle('drome-hidden', show);
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const table = document.querySelector('table');
        const pagination = document.getElementById('pagination');
        
        if (emptyState) emptyState.classList.remove('drome-hidden');
        if (table) table.classList.add('drome-hidden');
        if (pagination) pagination.classList.add('drome-hidden');
    }

    setLoadingState(button, isLoading) {
        if (!button) return;

        const btnText = button.querySelector('.drome-btn-text');
        const loadingIcon = button.querySelector('.drome-loading-icon');

        if (isLoading) {
            button.disabled = true;
            button.classList.add('drome-opacity-75');
            if (btnText) btnText.classList.add('drome-hidden');
            if (loadingIcon) loadingIcon.classList.remove('drome-hidden');
        } else {
            button.disabled = false;
            button.classList.remove('drome-opacity-75');
            if (btnText) btnText.classList.remove('drome-hidden');
            if (loadingIcon) loadingIcon.classList.add('drome-hidden');
        }
    }

    handleLogout() {
        this.designSystem.modal.confirm({
            title: 'Confirmar Logout',
            message: 'Tem certeza que deseja sair do sistema?',
            confirmText: 'Sair',
            cancelText: 'Cancelar',
            onConfirm: () => {
                localStorage.removeItem('userSession');
                localStorage.removeItem('isLoggedIn');
                window.location.href = '../../auth/login.html';
            }
        });
    }

    showError(message) {
        this.designSystem.notifications.show({
            type: 'error',
            title: 'Erro',
            message: message,
            duration: 5000
        });
    }

    showSuccess(message) {
        this.designSystem.notifications.show({
            type: 'success',
            title: 'Sucesso',
            message: message,
            duration: 3000
        });
    }
}

// Inicializar o módulo e tornar disponível globalmente
const userManagement = new DromeUserManagement();
