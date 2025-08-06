// DromeBoard - Sistema de Autenticação v2.0
// Gerencia o login e validação de usuários com Design System

class DromeAuth {
    constructor() {
        this.apiUrl = '../api/login.php';
        this.redirectUrl = '../core/dashboard.html';
        this.designSystem = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Inicializar Design System
            this.designSystem = new DromeDesignSystem();
            
            // Configurar funcionalidades
            this.setupLoginForm();
            this.setupPasswordToggle();
            this.setupThemeToggle();
            this.setupFormValidation();
        });
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const messageContainer = document.getElementById('message-container');
        const submitButton = document.getElementById('login-button');

        if (!loginForm) {
            console.error('Formulário de login não encontrado');
            return;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e.target, messageContainer, submitButton);
        });
    }

    setupPasswordToggle() {
        const toggleButton = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        const passwordIcon = document.getElementById('password-icon');

        if (!toggleButton || !passwordInput || !passwordIcon) return;

        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            passwordIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            this.designSystem.theme.toggle();
            
            // Atualizar ícone do botão
            const icon = themeToggle.querySelector('i');
            if (document.documentElement.classList.contains('dark')) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        });
    }

    setupFormValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmailField(emailInput);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.clearFieldError(passwordInput);
            });
        }
    }

    async handleLogin(form, messageContainer, submitButton) {
        // Limpar mensagens anteriores
        this.clearMessages(messageContainer);

        // Mostrar loading
        this.setLoadingState(submitButton, true);
        this.showLoadingOverlay(true);

        try {
            const formData = this.getFormData(form);
            this.validateFormData(formData);

            console.log('Iniciando login para:', formData.email);
            
            const result = await this.submitLogin(formData);
            console.log('Resposta do servidor:', result);

            if (result.success) {
                this.handleLoginSuccess(result, messageContainer);
            } else {
                this.handleLoginError(result, messageContainer);
            }

        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.showMessage(messageContainer, error.message || 'Erro ao conectar com o servidor. Tente novamente.', 'error');
        } finally {
            this.setLoadingState(submitButton, false);
            this.showLoadingOverlay(false);
        }
    }

    validateEmailField(emailInput) {
        const email = emailInput.value.trim();
        if (email && !this.isValidEmail(email)) {
            this.showFieldError(emailInput, 'Por favor, insira um email válido');
        } else {
            this.clearFieldError(emailInput);
        }
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.classList.add('drome-border-red-500', 'drome-focus:border-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'drome-text-sm drome-text-red-600 drome-mt-1';
        errorDiv.textContent = message;
        errorDiv.id = `${input.id}-error`;
        
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.classList.remove('drome-border-red-500', 'drome-focus:border-red-500');
        
        const errorDiv = document.getElementById(`${input.id}-error`);
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    getFormData(form) {
        return {
            email: form.querySelector('#email').value.trim(),
            password: form.querySelector('#password').value
        };
    }

    validateFormData(data) {
        if (!data.email || !data.password) {
            throw new Error('Email e senha são obrigatórios');
        }

        if (!this.isValidEmail(data.email)) {
            throw new Error('Por favor, insira um email válido');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async submitLogin(credentials) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro no servidor');
        }

        return result;
    }

    handleLoginSuccess(result, messageContainer) {
        // Salvar dados da sessão no localStorage
        localStorage.setItem('userSession', JSON.stringify(result.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Mostrar notificação de sucesso
        this.designSystem.notifications.show({
            type: 'success',
            title: 'Login realizado!',
            message: result.message || 'Redirecionando para o dashboard...',
            duration: 2000
        });
        
        // Redirecionar após um breve delay
        setTimeout(() => {
            window.location.href = result.redirect || this.redirectUrl;
        }, 1500);
    }

    handleLoginError(result, messageContainer) {
        const message = result.message || 'Erro ao realizar login. Verifique suas credenciais.';
        this.showMessage(messageContainer, message, 'error');
        
        // Também mostrar notificação
        this.designSystem.notifications.show({
            type: 'error',
            title: 'Erro no login',
            message: message,
            duration: 4000
        });
    }

    clearMessages(container) {
        if (container) {
            container.innerHTML = '';
        }
    }

    showMessage(container, message, type = 'info') {
        if (!container) return;

        const alertClass = {
            'success': 'drome-bg-green-50 drome-border-green-200 drome-text-green-800',
            'error': 'drome-bg-red-50 drome-border-red-200 drome-text-red-800',
            'warning': 'drome-bg-yellow-50 drome-border-yellow-200 drome-text-yellow-800',
            'info': 'drome-bg-blue-50 drome-border-blue-200 drome-text-blue-800'
        };

        const iconClass = {
            'success': 'fas fa-check-circle drome-text-green-500',
            'error': 'fas fa-exclamation-circle drome-text-red-500',
            'warning': 'fas fa-exclamation-triangle drome-text-yellow-500',
            'info': 'fas fa-info-circle drome-text-blue-500'
        };

        const alert = document.createElement('div');
        alert.className = `drome-border drome-rounded-md drome-p-4 drome-flex drome-items-start drome-space-x-3 ${alertClass[type]}`;
        
        alert.innerHTML = `
            <div class="drome-flex-shrink-0">
                <i class="${iconClass[type]}"></i>
            </div>
            <div class="drome-flex-1 drome-text-sm">
                ${message}
            </div>
        `;

        container.appendChild(alert);
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
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

    // Método para logout (pode ser usado em outras partes do sistema)
    static logout() {
        localStorage.removeItem('userSession');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../auth/login.html';
    }

    // Método para verificar se usuário está logado
    static isAuthenticated() {
        return localStorage.getItem('isLoggedIn') === 'true' && 
               localStorage.getItem('userSession') !== null;
    }

    // Método para obter dados do usuário logado
    static getUserData() {
        const userData = localStorage.getItem('userSession');
        return userData ? JSON.parse(userData) : null;
    }
}

// Inicializar o sistema de autenticação
new DromeAuth();
