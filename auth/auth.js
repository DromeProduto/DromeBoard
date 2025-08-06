// DromeBoard - Sistema de Autenticação
// Gerencia o login e validação de usuários

class DromeAuth {
    constructor() {
        this.apiUrl = '../api/login.php';
        this.redirectUrl = '../core/dashboard.html';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLoginForm();
        });
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const submitButton = loginForm.querySelector('button[type="submit"]');

        if (!loginForm) {
            console.error('Formulário de login não encontrado');
            return;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e.target, errorMessage, successMessage, submitButton);
        });
    }

    async handleLogin(form, errorMessage, successMessage, submitButton) {
        // Ocultar mensagens anteriores
        this.hideMessages(errorMessage, successMessage);

        // Desabilitar botão e mostrar loading
        this.setLoadingState(submitButton, true);

        try {
            const formData = this.getFormData(form);
            this.validateFormData(formData);

            console.log('Iniciando login para:', formData.email);
            
            const result = await this.submitLogin(formData);
            console.log('Resposta do servidor:', result);

            if (result.success) {
                this.handleLoginSuccess(result, successMessage);
            } else {
                this.handleLoginError(result, errorMessage);
            }

        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.showError(errorMessage, error.message || 'Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            this.setLoadingState(submitButton, false);
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

    handleLoginSuccess(result, successMessage) {
        // Salvar dados da sessão no localStorage
        localStorage.setItem('userSession', JSON.stringify(result.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Mostrar mensagem de sucesso
        this.showSuccess(successMessage, result.message || 'Login realizado com sucesso!');
        
        // Redirecionar após um breve delay
        setTimeout(() => {
            window.location.href = result.redirect || this.redirectUrl;
        }, 1000);
    }

    handleLoginError(result, errorMessage) {
        const message = result.message || 'Erro ao realizar login. Verifique suas credenciais.';
        this.showError(errorMessage, message);
    }

    hideMessages(errorMessage, successMessage) {
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
    }

    showError(errorMessage, message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

    showSuccess(successMessage, message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
        }
    }

    setLoadingState(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Entrando...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Entrar';
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
