/**
 * DromeBoard Design System - Utilitários JavaScript
 * Baseado nos elementos oficiais extraídos da pasta "Elementos Oficial"
 */

class DromeDesignSystem {
  constructor() {
    this.init();
  }

  /**
   * Inicializa o sistema de design
   */
  init() {
    this.initTheme();
    this.initToggles();
    this.initTabs();
    this.initCalendar();
    this.initAnimations();
  }

  /**
   * Sistema de tema escuro/claro
   */
  initTheme() {
    // Verifica preferência salva ou sistema
    const savedTheme = localStorage.getItem('drome-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplica tema inicial
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }

    // Event listeners para botões de toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-theme-toggle]') || e.target.closest('[data-theme-toggle]')) {
        this.toggleTheme();
      }
    });

    // Escuta mudanças na preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('drome-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Define o tema
   * @param {string} theme - 'light' ou 'dark'
   */
  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('drome-theme', theme);
    
    // Dispara evento customizado
    document.dispatchEvent(new CustomEvent('dromeThemeChange', { 
      detail: { theme } 
    }));
  }

  /**
   * Alterna entre tema claro e escuro
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Obtém o tema atual
   * @returns {string} Tema atual ('light' ou 'dark')
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  /**
   * Inicializa toggles (switches)
   */
  initToggles() {
    document.addEventListener('change', (e) => {
      if (e.target.matches('.drome-toggle input')) {
        const toggle = e.target;
        const slider = toggle.nextElementSibling;
        const dot = slider.querySelector('::before') || slider;
        
        if (toggle.checked) {
          slider.style.backgroundColor = 'var(--primary)';
        } else {
          slider.style.backgroundColor = 'var(--gray-300)';
        }
        
        // Dispara evento customizado
        toggle.dispatchEvent(new CustomEvent('dromeToggleChange', {
          detail: { checked: toggle.checked }
        }));
      }
    });
  }

  /**
   * Sistema de tabs
   */
  initTabs() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-tab]')) {
        e.preventDefault();
        this.activateTab(e.target);
      }
    });
  }

  /**
   * Ativa uma tab específica
   * @param {Element} tabElement - Elemento da tab a ser ativada
   */
  activateTab(tabElement) {
    const tabContainer = tabElement.closest('[data-tabs]');
    if (!tabContainer) return;

    // Remove classe ativa de todas as tabs
    const allTabs = tabContainer.querySelectorAll('[data-tab]');
    allTabs.forEach(tab => {
      tab.classList.remove('drome-tab-active');
    });

    // Adiciona classe ativa na tab clicada
    tabElement.classList.add('drome-tab-active');

    // Esconde todos os painéis de conteúdo
    const tabId = tabElement.getAttribute('data-tab');
    const contentContainer = document.querySelector(`[data-tab-content="${tabContainer.getAttribute('data-tabs')}"]`);
    
    if (contentContainer) {
      const allPanels = contentContainer.querySelectorAll('[data-tab-panel]');
      allPanels.forEach(panel => {
        panel.style.display = 'none';
      });

      // Mostra o painel correspondente
      const targetPanel = contentContainer.querySelector(`[data-tab-panel="${tabId}"]`);
      if (targetPanel) {
        targetPanel.style.display = 'block';
      }
    }

    // Dispara evento customizado
    tabElement.dispatchEvent(new CustomEvent('dromeTabChange', {
      detail: { tabId }
    }));
  }

  /**
   * Sistema de calendário básico
   */
  initCalendar() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.drome-calendar-day:not(.calendar-day-disabled)')) {
        this.selectCalendarDay(e.target);
      }
      
      if (e.target.matches('.drome-calendar-nav-btn') || e.target.closest('.drome-calendar-nav-btn')) {
        const direction = e.target.getAttribute('data-direction') || 
                         e.target.closest('.drome-calendar-nav-btn').getAttribute('data-direction');
        if (direction) {
          this.navigateCalendar(e.target.closest('.drome-calendar'), direction);
        }
      }
    });
  }

  /**
   * Seleciona um dia no calendário
   * @param {Element} dayElement - Elemento do dia a ser selecionado
   */
  selectCalendarDay(dayElement) {
    const calendar = dayElement.closest('.drome-calendar');
    if (!calendar) return;

    // Remove seleção anterior
    const previousSelected = calendar.querySelector('.drome-calendar-day-selected');
    if (previousSelected) {
      previousSelected.classList.remove('drome-calendar-day-selected');
    }

    // Adiciona seleção ao novo dia
    dayElement.classList.add('drome-calendar-day-selected');

    // Dispara evento customizado
    dayElement.dispatchEvent(new CustomEvent('dromeCalendarDaySelect', {
      detail: { 
        day: dayElement.textContent.trim(),
        element: dayElement 
      }
    }));
  }

  /**
   * Navega no calendário (próximo/anterior)
   * @param {Element} calendar - Elemento do calendário
   * @param {string} direction - 'next' ou 'prev'
   */
  navigateCalendar(calendar, direction) {
    // Esta é uma implementação básica - em produção você integraria com uma biblioteca de datas
    const monthElement = calendar.querySelector('.drome-calendar-month');
    if (monthElement) {
      // Dispara evento customizado para navegação
      calendar.dispatchEvent(new CustomEvent('dromeCalendarNavigate', {
        detail: { direction }
      }));
    }
  }

  /**
   * Inicializa animações e efeitos
   */
  initAnimations() {
    // Observador para animações de entrada
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('drome-animate-fade-in');
        }
      });
    }, observerOptions);

    // Observa elementos com classe de animação
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Utilitários para formulários
   */
  static formUtils = {
    /**
     * Valida um formulário com classes Drome
     * @param {Element} form - Elemento do formulário
     * @returns {Object} Resultado da validação
     */
    validate(form) {
      const inputs = form.querySelectorAll('.drome-input, .drome-select');
      const errors = [];
      
      inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
          errors.push({
            field: input.name || input.id,
            message: 'Este campo é obrigatório'
          });
          input.classList.add('drome-input-error');
        } else {
          input.classList.remove('drome-input-error');
        }
      });

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    /**
     * Limpa um formulário
     * @param {Element} form - Elemento do formulário
     */
    reset(form) {
      form.reset();
      const inputs = form.querySelectorAll('.drome-input, .drome-select');
      inputs.forEach(input => {
        input.classList.remove('drome-input-error');
      });
    }
  };

  /**
   * Utilitários para notificações/toasts
   */
  static notifications = {
    /**
     * Exibe uma notificação
     * @param {Object} options - Opções da notificação
     */
    show(options = {}) {
      const {
        message = '',
        title = '',
        type = 'info',
        duration = 5000,
        position = 'top-right'
      } = options;

      const notification = document.createElement('div');
      notification.className = `drome-notification drome-notification-${type} drome-notification-${position}`;
      
      notification.innerHTML = `
        <div class="drome-notification-content">
          <div class="drome-notification-body">
            ${title ? `<div class="drome-notification-title">${title}</div>` : ''}
            <div class="drome-notification-message">${message}</div>
          </div>
          <button class="drome-notification-close" onclick="this.parentElement.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      // Adiciona estilos se não existirem
      if (!document.querySelector('#drome-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'drome-notification-styles';
        styles.textContent = `
          .drome-notification {
            position: fixed;
            z-index: 1000;
            max-width: 400px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-lg);
            animation: drome-slide-in-up 0.3s ease-out;
          }
          .drome-notification-top-right {
            top: 20px;
            right: 20px;
          }
          .drome-notification-top-left {
            top: 20px;
            left: 20px;
          }
          .drome-notification-bottom-right {
            bottom: 20px;
            right: 20px;
          }
          .drome-notification-bottom-left {
            bottom: 20px;
            left: 20px;
          }
          .drome-notification-content {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: var(--spacing-4);
          }
          .drome-notification-body {
            flex: 1;
          }
          .drome-notification-title {
            font-weight: var(--font-weight-semibold);
            margin-bottom: var(--spacing-1);
          }
          .drome-notification-message {
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
          }
          .drome-notification-success { border-left: 4px solid var(--success); }
          .drome-notification-warning { border-left: 4px solid var(--warning); }
          .drome-notification-danger { border-left: 4px solid var(--danger); }
          .drome-notification-info { border-left: 4px solid var(--primary); }
          .drome-notification-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: var(--spacing-1);
            border-radius: var(--border-radius-sm);
            margin-left: var(--spacing-3);
            flex-shrink: 0;
          }
          .drome-notification-close:hover {
            background-color: var(--bg-tertiary);
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(notification);

      if (duration > 0) {
        setTimeout(() => {
          if (notification.parentElement) {
            notification.style.animation = 'drome-fade-out 0.3s ease-out';
            setTimeout(() => {
              notification.remove();
            }, 300);
          }
        }, duration);
      }

      return notification;
    },

    /**
     * Métodos de conveniência para diferentes tipos
     */
    success(message, title = '') {
      return this.show({ message, title, type: 'success' });
    },

    error(message, title = '') {
      return this.show({ message, title, type: 'danger' });
    },

    warning(message, title = '') {
      return this.show({ message, title, type: 'warning' });
    },

    info(message, title = '') {
      return this.show({ message, title, type: 'info' });
    }
  };

  // Manter compatibilidade com a API antiga
  static notification = {
    show(message, type = 'info', duration = 5000) {
      return DromeDesignSystem.notifications.show({ message, type, duration });
    }
  };

  /**
   * Sistema de botões
   */
  static button = {
    /**
     * Cria um botão Drome
     * @param {string} text - Texto do botão
     * @param {Object} options - Opções do botão
     */
    create(text, options = {}) {
      const {
        type = 'primary',
        size = 'md',
        disabled = false,
        loading = false,
        icon = '',
        onClick = null,
        className = ''
      } = options;

      const button = document.createElement('button');
      button.className = `drome-btn drome-btn-${type} drome-btn-${size} ${className}`.trim();
      
      if (disabled) button.disabled = true;
      if (loading) button.classList.add('drome-btn-loading');
      
      button.innerHTML = `
        ${loading ? '<span class="drome-spinner drome-mr-2"></span>' : ''}
        ${icon ? `<i class="${icon} ${text ? 'drome-mr-2' : ''}"></i>` : ''}
        <span class="drome-btn-text">${text}</span>
      `;
      
      if (onClick) button.addEventListener('click', onClick);
      
      return button;
    },

    /**
     * Define estado de loading do botão
     * @param {Element} button - Elemento do botão
     * @param {boolean} loading - Estado de loading
     */
    setLoading(button, loading) {
      const spinner = button.querySelector('.drome-spinner');
      const text = button.querySelector('.drome-btn-text');
      
      if (loading) {
        button.classList.add('drome-btn-loading');
        button.disabled = true;
        if (!spinner) {
          const spinnerEl = document.createElement('span');
          spinnerEl.className = 'drome-spinner drome-mr-2';
          button.insertBefore(spinnerEl, text);
        }
      } else {
        button.classList.remove('drome-btn-loading');
        button.disabled = false;
        if (spinner) spinner.remove();
      }
    }
  };

  /**
   * Sistema de cards
   */
  static card = {
    /**
     * Cria um card Drome
     * @param {Object} options - Opções do card
     */
    create(options = {}) {
      const {
        header = '',
        body = '',
        footer = '',
        className = '',
        actions = []
      } = options;

      const card = document.createElement('div');
      card.className = `drome-card ${className}`.trim();
      
      let headerHtml = '';
      if (header) {
        if (typeof header === 'string') {
          headerHtml = `<div class="drome-card-header">${header}</div>`;
        } else {
          headerHtml = `
            <div class="drome-card-header">
              <div class="drome-card-title">${header.title || ''}</div>
              ${header.actions ? `<div class="drome-card-actions">${header.actions}</div>` : ''}
            </div>
          `;
        }
      }

      let footerHtml = '';
      if (footer || actions.length > 0) {
        const actionsHtml = actions.map(action => {
          return `<button class="drome-btn drome-btn-${action.type || 'secondary'} drome-btn-sm" onclick="${action.onClick || ''}">${action.text}</button>`;
        }).join(' ');
        
        footerHtml = `
          <div class="drome-card-footer">
            ${footer}
            ${actionsHtml ? `<div class="drome-card-footer-actions">${actionsHtml}</div>` : ''}
          </div>
        `;
      }
      
      card.innerHTML = `
        ${headerHtml}
        ${body ? `<div class="drome-card-body">${body}</div>` : ''}
        ${footerHtml}
      `;
      
      return card;
    },

    /**
     * Cria um container
     * @param {Object} options - Opções do container
     */
    createContainer(options = {}) {
      const {
        content = '',
        className = '',
        padding = true
      } = options;

      const container = document.createElement('div');
      container.className = `drome-container ${padding ? 'drome-p-6' : ''} ${className}`.trim();
      container.innerHTML = content;
      
      return container;
    }
  };

  /**
   * Sistema de navegação
   */
  static navigation = {
    /**
     * Cria um item de navegação
     * @param {Object} options - Opções do item
     */
    createItem(options = {}) {
      const {
        label = '',
        icon = '',
        active = false,
        badge = '',
        onClick = null,
        href = '#'
      } = options;

      const item = document.createElement('a');
      item.className = `drome-nav-item ${active ? 'drome-nav-active' : ''}`;
      item.href = href;
      
      item.innerHTML = `
        <div class="drome-nav-item-content">
          ${icon ? `<i class="${icon} drome-nav-icon"></i>` : ''}
          <span class="drome-nav-label">${label}</span>
          ${badge ? `<span class="drome-badge drome-badge-sm drome-ml-auto">${badge}</span>` : ''}
        </div>
      `;
      
      if (onClick) {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          onClick(e);
        });
      }
      
      return item;
    },

    /**
     * Cria uma sidebar
     * @param {Object} options - Opções da sidebar
     */
    createSidebar(options = {}) {
      const {
        items = [],
        header = '',
        footer = '',
        collapsed = false,
        className = ''
      } = options;

      const sidebar = document.createElement('div');
      sidebar.className = `drome-sidebar ${collapsed ? 'drome-sidebar-collapsed' : ''} ${className}`.trim();
      
      const itemsHtml = items.map(item => {
        return this.createItem(item).outerHTML;
      }).join('');

      sidebar.innerHTML = `
        ${header ? `<div class="drome-sidebar-header">${header}</div>` : ''}
        <nav class="drome-sidebar-nav">
          ${itemsHtml}
        </nav>
        ${footer ? `<div class="drome-sidebar-footer">${footer}</div>` : ''}
      `;

      return sidebar;
    },

    /**
     * Toggle do sidebar
     * @param {Element} sidebar - Elemento do sidebar
     */
    toggleSidebar(sidebar) {
      sidebar.classList.toggle('drome-sidebar-collapsed');
      
      // Dispara evento customizado
      sidebar.dispatchEvent(new CustomEvent('dromeSidebarToggle', {
        detail: { collapsed: sidebar.classList.contains('drome-sidebar-collapsed') }
      }));
    },

    /**
     * Cria breadcrumbs
     * @param {Array} items - Array de itens do breadcrumb
     */
    createBreadcrumbs(items = []) {
      const breadcrumb = document.createElement('nav');
      breadcrumb.className = 'drome-breadcrumb';
      
      const itemsHtml = items.map((item, index) => {
        const isLast = index === items.length - 1;
        return `
          <span class="drome-breadcrumb-item ${isLast ? 'drome-breadcrumb-active' : ''}">
            ${!isLast && item.href ? `<a href="${item.href}">${item.label}</a>` : item.label}
            ${!isLast ? '<i class="fas fa-chevron-right drome-breadcrumb-separator"></i>' : ''}
          </span>
        `;
      }).join('');

      breadcrumb.innerHTML = itemsHtml;
      return breadcrumb;
    }
  };

  /**
   * Utilitários para modais
   */
  static modal = {
    /**
     * Cria um modal
     * @param {Object} options - Opções do modal
     */
    create(options = {}) {
      const {
        title = '',
        content = '',
        buttons = [],
        closable = true,
        backdrop = true,
        size = 'md',
        className = ''
      } = options;

      const modal = document.createElement('div');
      modal.className = `drome-modal ${className}`.trim();
      
      const buttonsHtml = buttons.map(btn => {
        return `<button class="drome-btn drome-btn-${btn.class || 'secondary'}" data-modal-action="${btn.action || 'close'}">${btn.text}</button>`;
      }).join(' ');

      modal.innerHTML = `
        <div class="drome-modal-backdrop ${backdrop ? 'drome-modal-backdrop-closable' : ''}"></div>
        <div class="drome-modal-container drome-modal-${size}">
          <div class="drome-modal-content">
            ${title ? `
              <div class="drome-modal-header">
                <h3 class="drome-modal-title">${title}</h3>
                ${closable ? '<button class="drome-modal-close">×</button>' : ''}
              </div>
            ` : ''}
            <div class="drome-modal-body">
              ${content}
            </div>
            ${buttonsHtml ? `
              <div class="drome-modal-footer">
                ${buttonsHtml}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Adiciona estilos se não existirem
      if (!document.querySelector('#drome-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'drome-modal-styles';
        styles.textContent = `
          .drome-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: drome-fade-in 0.3s ease-out;
          }
          .drome-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
          }
          .drome-modal-container {
            position: relative;
            max-height: 90vh;
            overflow-y: auto;
            animation: drome-slide-up 0.3s ease-out;
          }
          .drome-modal-sm { max-width: 400px; }
          .drome-modal-md { max-width: 600px; }
          .drome-modal-lg { max-width: 800px; }
          .drome-modal-content {
            background: var(--bg-primary);
            border-radius: var(--border-radius-xl);
            box-shadow: var(--shadow-xl);
            margin: var(--spacing-4);
          }
          .drome-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-6);
            border-bottom: 1px solid var(--border-color);
          }
          .drome-modal-title {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
          }
          .drome-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: var(--spacing-1);
            border-radius: var(--border-radius-sm);
          }
          .drome-modal-close:hover {
            background-color: var(--bg-tertiary);
          }
          .drome-modal-body {
            padding: var(--spacing-6);
          }
          .drome-modal-footer {
            display: flex;
            gap: var(--spacing-3);
            justify-content: flex-end;
            padding: var(--spacing-6);
            border-top: 1px solid var(--border-color);
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(modal);

      // Event listeners para botões
      buttons.forEach((btn, index) => {
        const buttonEl = modal.querySelectorAll('[data-modal-action]')[index];
        if (buttonEl && btn.action) {
          buttonEl.addEventListener('click', () => {
            if (typeof btn.action === 'function') {
              btn.action();
            } else if (btn.action === 'close') {
              this.close(modal);
            }
          });
        }
      });

      // Event listeners
      if (closable) {
        modal.querySelector('.drome-modal-close')?.addEventListener('click', () => {
          this.close(modal);
        });
      }

      if (backdrop) {
        modal.querySelector('.drome-modal-backdrop-closable')?.addEventListener('click', () => {
          this.close(modal);
        });
      }

      // ESC key
      const escHandler = (e) => {
        if (e.key === 'Escape' && closable) {
          this.close(modal);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      return modal;
    },

    /**
     * Abre um modal (método legado para compatibilidade)
     * @param {string} content - Conteúdo HTML do modal
     * @param {Object} options - Opções do modal
     */
    open(content, options = {}) {
      return this.create({
        content,
        ...options
      });
    },

    /**
     * Fecha um modal
     * @param {Element} modal - Elemento do modal
     */
    close(modal) {
      if (modal && modal.parentElement) {
        modal.style.animation = 'drome-fade-out 0.3s ease-out';
        setTimeout(() => {
          modal.remove();
        }, 300);
      }
    }
  };

  /**
   * Utilitários gerais para componentes
   */
  static utils = {
    /**
     * Gera um ID único
     * @returns {string} ID único
     */
    generateId() {
      return 'drome-' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce para otimizar performance
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função com debounce
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle para limitar execução
     * @param {Function} func - Função a ser executada
     * @param {number} limit - Limite de tempo em ms
     * @returns {Function} Função com throttle
     */
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Converte string para kebab-case
     * @param {string} str - String a ser convertida
     * @returns {string} String em kebab-case
     */
    toKebabCase(str) {
      return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    },

    /**
     * Remove elementos por seletor
     * @param {string} selector - Seletor CSS
     */
    removeElements(selector) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    }
  };

  /**
   * Sistema de componentes avançados
   */
  static components = {
    /**
     * Cria um dropdown
     * @param {Object} options - Opções do dropdown
     */
    createDropdown(options = {}) {
      const {
        trigger = '',
        items = [],
        className = '',
        position = 'bottom-start'
      } = options;

      const dropdown = document.createElement('div');
      dropdown.className = `drome-dropdown ${className}`.trim();
      
      const itemsHtml = items.map(item => {
        if (item.divider) {
          return '<div class="drome-dropdown-divider"></div>';
        }
        return `
          <a href="${item.href || '#'}" class="drome-dropdown-item" ${item.onClick ? `onclick="${item.onClick}"` : ''}>
            ${item.icon ? `<i class="${item.icon}"></i>` : ''}
            ${item.label}
          </a>
        `;
      }).join('');

      dropdown.innerHTML = `
        <div class="drome-dropdown-trigger">${trigger}</div>
        <div class="drome-dropdown-menu drome-dropdown-${position}">
          ${itemsHtml}
        </div>
      `;

      return dropdown;
    },

    /**
     * Cria um tooltip
     * @param {Element} element - Elemento que terá o tooltip
     * @param {Object} options - Opções do tooltip
     */
    createTooltip(element, options = {}) {
      const {
        content = '',
        position = 'top',
        delay = 300
      } = options;

      let tooltip;
      let timeoutId;

      const showTooltip = () => {
        tooltip = document.createElement('div');
        tooltip.className = `drome-tooltip drome-tooltip-${position}`;
        tooltip.textContent = content;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
          case 'top':
            top = rect.top - tooltipRect.height - 8;
            left = rect.left + (rect.width - tooltipRect.width) / 2;
            break;
          case 'bottom':
            top = rect.bottom + 8;
            left = rect.left + (rect.width - tooltipRect.width) / 2;
            break;
          case 'left':
            top = rect.top + (rect.height - tooltipRect.height) / 2;
            left = rect.left - tooltipRect.width - 8;
            break;
          case 'right':
            top = rect.top + (rect.height - tooltipRect.height) / 2;
            left = rect.right + 8;
            break;
        }
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        tooltip.style.opacity = '1';
      };

      const hideTooltip = () => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      };

      element.addEventListener('mouseenter', () => {
        timeoutId = setTimeout(showTooltip, delay);
      });

      element.addEventListener('mouseleave', () => {
        clearTimeout(timeoutId);
        hideTooltip();
      });

      return { showTooltip, hideTooltip };
    },

    /**
     * Cria um accordion
     * @param {Object} options - Opções do accordion
     */
    createAccordion(options = {}) {
      const {
        items = [],
        multiple = false,
        className = ''
      } = options;

      const accordion = document.createElement('div');
      accordion.className = `drome-accordion ${className}`.trim();
      
      const itemsHtml = items.map((item, index) => {
        return `
          <div class="drome-accordion-item" data-accordion-item="${index}">
            <div class="drome-accordion-header" data-accordion-trigger="${index}">
              <span>${item.title}</span>
              <i class="fas fa-chevron-down drome-accordion-icon"></i>
            </div>
            <div class="drome-accordion-content" data-accordion-content="${index}">
              <div class="drome-accordion-body">
                ${item.content}
              </div>
            </div>
          </div>
        `;
      }).join('');

      accordion.innerHTML = itemsHtml;

      // Event listeners
      accordion.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-accordion-trigger]');
        if (trigger) {
          const index = trigger.getAttribute('data-accordion-trigger');
          const item = accordion.querySelector(`[data-accordion-item="${index}"]`);
          const content = accordion.querySelector(`[data-accordion-content="${index}"]`);
          const icon = trigger.querySelector('.drome-accordion-icon');
          
          const isOpen = item.classList.contains('drome-accordion-open');
          
          if (!multiple) {
            // Fecha todos os outros itens
            accordion.querySelectorAll('.drome-accordion-item').forEach(otherItem => {
              if (otherItem !== item) {
                otherItem.classList.remove('drome-accordion-open');
                const otherIcon = otherItem.querySelector('.drome-accordion-icon');
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
              }
            });
          }
          
          if (isOpen) {
            item.classList.remove('drome-accordion-open');
            icon.style.transform = 'rotate(0deg)';
          } else {
            item.classList.add('drome-accordion-open');
            icon.style.transform = 'rotate(180deg)';
          }
        }
      });

      return accordion;
    }
  };
}

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dromeDesignSystem = new DromeDesignSystem();
  });
} else {
  window.dromeDesignSystem = new DromeDesignSystem();
}

// Adiciona CSS para componentes dinâmicos
if (!document.querySelector('#drome-component-styles')) {
  const styles = document.createElement('style');
  styles.id = 'drome-component-styles';
  styles.textContent = `
    /* Estilos para componentes dinâmicos */
    @keyframes drome-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    /* Spinner para botões */
    .drome-spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: drome-spin 1s linear infinite;
      display: inline-block;
    }
    
    /* Estados de loading para botões */
    .drome-btn-loading {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    /* Navegação sidebar */
    .drome-sidebar {
      width: 280px;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      transition: width 0.3s ease;
    }
    
    .drome-sidebar-collapsed {
      width: 64px;
    }
    
    .drome-sidebar-header,
    .drome-sidebar-footer {
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--border-color);
    }
    
    .drome-sidebar-footer {
      border-bottom: none;
      border-top: 1px solid var(--border-color);
    }
    
    .drome-sidebar-nav {
      padding: var(--spacing-2) 0;
    }
    
    .drome-nav-item {
      display: block;
      padding: var(--spacing-3) var(--spacing-4);
      color: var(--text-primary);
      text-decoration: none;
      transition: var(--transition-colors);
      border-left: 3px solid transparent;
    }
    
    .drome-nav-item:hover {
      background-color: var(--bg-secondary);
      color: var(--primary);
    }
    
    .drome-nav-active {
      background-color: rgba(99, 102, 241, 0.1);
      border-left-color: var(--primary);
      color: var(--primary);
    }
    
    .drome-nav-item-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
    }
    
    .drome-nav-icon {
      width: 1.25rem;
      flex-shrink: 0;
    }
    
    .drome-nav-label {
      flex: 1;
    }
    
    .drome-sidebar-collapsed .drome-nav-label {
      display: none;
    }
    
    /* Breadcrumbs */
    .drome-breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
    
    .drome-breadcrumb-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
    }
    
    .drome-breadcrumb-item a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition-colors);
    }
    
    .drome-breadcrumb-item a:hover {
      color: var(--primary);
    }
    
    .drome-breadcrumb-active {
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }
    
    .drome-breadcrumb-separator {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }
    
    /* Card actions */
    .drome-card-actions {
      display: flex;
      gap: var(--spacing-2);
    }
    
    .drome-card-footer-actions {
      display: flex;
      gap: var(--spacing-2);
      margin-top: var(--spacing-3);
    }
    
    /* Badge pequeno */
    .drome-badge-sm {
      font-size: var(--font-size-xs);
      padding: var(--spacing-1) var(--spacing-2);
    }
    
    /* Dropdown */
    .drome-dropdown {
      position: relative;
      display: inline-block;
    }
    
    .drome-dropdown-trigger {
      cursor: pointer;
    }
    
    .drome-dropdown-menu {
      position: absolute;
      min-width: 200px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }
    
    .drome-dropdown:hover .drome-dropdown-menu {
      opacity: 1;
      visibility: visible;
    }
    
    .drome-dropdown-bottom-start {
      top: 100%;
      left: 0;
      margin-top: 4px;
    }
    
    .drome-dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-3);
      color: var(--text-primary);
      text-decoration: none;
      transition: var(--transition-colors);
    }
    
    .drome-dropdown-item:hover {
      background-color: var(--bg-secondary);
    }
    
    .drome-dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: var(--spacing-1) 0;
    }
    
    /* Tooltip */
    .drome-tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: var(--spacing-2) var(--spacing-3);
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-sm);
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
      max-width: 200px;
      word-wrap: break-word;
    }
    
    /* Accordion */
    .drome-accordion {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
    }
    
    .drome-accordion-item {
      border-bottom: 1px solid var(--border-color);
    }
    
    .drome-accordion-item:last-child {
      border-bottom: none;
    }
    
    .drome-accordion-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4);
      background: var(--bg-primary);
      cursor: pointer;
      transition: var(--transition-colors);
    }
    
    .drome-accordion-header:hover {
      background: var(--bg-secondary);
    }
    
    .drome-accordion-icon {
      transition: transform 0.3s ease;
    }
    
    .drome-accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    
    .drome-accordion-open .drome-accordion-content {
      max-height: 500px;
    }
    
    .drome-accordion-body {
      padding: var(--spacing-4);
      background: var(--bg-secondary);
    }
  `;
  document.head.appendChild(styles);
}

// Exporta para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DromeDesignSystem;
}
