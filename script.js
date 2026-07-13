document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const filters = document.getElementById('filters');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const themeToggle = document.getElementById('theme-toggle');

    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';

    // Initialize App
    init();

    function init() {
        // Theme initialization
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        renderTodos();
        updateItemsLeft();

        // Event Listeners
        todoForm.addEventListener('submit', handleAddTodo);
        todoList.addEventListener('click', handleTodoAction);
        todoList.addEventListener('dblclick', handleEditStart);
        todoList.addEventListener('focusout', handleEditEnd);
        todoList.addEventListener('keydown', handleEditKeydown);
        filters.addEventListener('click', handleFilterChange);
        clearCompletedBtn.addEventListener('click', handleClearCompleted);
        themeToggle.addEventListener('click', toggleTheme);
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
        updateItemsLeft();
    }

    function renderTodos() {
        todoList.innerHTML = '';
        
        let filteredTodos = todos;
        if (currentFilter === 'active') {
            filteredTodos = todos.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(t => t.completed);
        }

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;

            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Toggle completion">
                <span class="todo-text" title="Double click to edit">${escapeHTML(todo.text)}</span>
                <input type="text" class="todo-edit-input" value="${escapeHTML(todo.text)}" aria-label="Edit task">
                <button class="btn-action btn-delete" aria-label="Delete todo"><i class="fas fa-trash-alt"></i></button>
            `;
            todoList.appendChild(li);
        });
    }

    function handleAddTodo(e) {
        e.preventDefault();
        const text = todoInput.value.trim();
        
        if (text) {
            const newTodo = {
                id: Date.now().toString(),
                text: text,
                completed: false
            };
            todos.unshift(newTodo); // Add to the beginning
            saveTodos();
            todoInput.value = '';
            
            // Re-render based on filter (if completed filter is active, change to all to show new item)
            if (currentFilter === 'completed') {
                document.querySelector('[data-filter="all"]').click();
            } else {
                renderTodos();
            }
        }
    }

    function handleTodoAction(e) {
        const item = e.target.closest('.todo-item');
        if (!item) return;

        const id = item.dataset.id;

        if (e.target.classList.contains('todo-checkbox')) {
            toggleTodo(id);
        } else if (e.target.closest('.btn-delete')) {
            deleteTodo(id);
        }
    }

    function toggleTodo(id) {
        todos = todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos();
        renderTodos();
    }

    function deleteTodo(id) {
        const item = document.querySelector(`[data-id="${id}"]`);
        // Add fade out animation
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px) scale(0.95)';
        
        setTimeout(() => {
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
            renderTodos();
        }, 250); // wait for animation
    }

    function handleEditStart(e) {
        const item = e.target.closest('.todo-item');
        if (!item || !e.target.classList.contains('todo-text')) return;
        
        // Don't allow editing completed tasks
        const id = item.dataset.id;
        const todo = todos.find(t => t.id === id);
        if (todo && todo.completed) return;

        item.classList.add('editing');
        const input = item.querySelector('.todo-edit-input');
        input.focus();
        // Move cursor to end
        input.setSelectionRange(input.value.length, input.value.length);
    }

    function handleEditEnd(e) {
        const item = e.target.closest('.todo-item');
        if (!item || !item.classList.contains('editing')) return;

        const id = item.dataset.id;
        const input = item.querySelector('.todo-edit-input');
        const newText = input.value.trim();

        if (newText) {
            todos = todos.map(todo => 
                todo.id === id ? { ...todo, text: newText } : todo
            );
            saveTodos();
        } else {
            // Delete if empty string
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
        }
        
        item.classList.remove('editing');
        renderTodos();
    }

    function handleEditKeydown(e) {
        if (e.key === 'Enter') {
            e.target.blur(); // Triggers focusout which handles the save
        } else if (e.key === 'Escape') {
            const item = e.target.closest('.todo-item');
            if (item) {
                // Revert to original value
                const id = item.dataset.id;
                const todo = todos.find(t => t.id === id);
                if (todo) {
                    e.target.value = todo.text;
                }
                item.classList.remove('editing');
            }
        }
    }

    function handleFilterChange(e) {
        if (!e.target.classList.contains('filter-btn')) return;

        // Update active class
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        currentFilter = e.target.dataset.filter;
        renderTodos();
    }

    function handleClearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
    }

    function updateItemsLeft() {
        const activeCount = todos.filter(t => !t.completed).length;
        itemsLeft.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} left`;
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // Utility for basic XSS prevention
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
