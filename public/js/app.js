let currentUser = null;
let allTasks = [];
let allCategories = [];

async function checkAuth() {
  try {
    const response = await fetch('/api/users/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showUserInfo();
      return true;
    } else {
      window.location.href = '/views/login.html';
      return false;
    }
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    window.location.href = '/views/login.html';
    return false;
  }
}

function showUserInfo() {
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  
  if (currentUser && userInfo && userName) {
    userName.textContent = `Hola, ${currentUser.name}`;
    userInfo.style.display = 'flex';
  }
}

function handleLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          window.location.href = '/views/login.html';
        } else {
          console.error('Error al cerrar sesión');
        }
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }
}

let currentFilter = localStorage.getItem('filter') || 'all'; // estado: all, active, completed
let currentCategoryFilter = localStorage.getItem('categoryFilter') || 'all'; // categoría

const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
let taskToDeleteId = null;

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTitleInput = document.getElementById('edit-title');
const editDescriptionInput = document.getElementById('edit-description');
const editStartDateInput = document.getElementById('edit-start-date');
const editEndDateInput = document.getElementById('edit-end-date');
const confirmEditBtn = document.getElementById('confirm-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
let taskToEditId = null;

const clearModal = document.getElementById('clear-modal');
const confirmClearBtn = document.getElementById('confirm-clear-btn');
const cancelClearBtn = document.getElementById('cancel-clear-btn');

// --- Helpers ---
function esc(str) {
  if (str === null || str === undefined) str = '';
  return str.replace(/[&<>"]?/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
}

function taskItemHtml(task) {
  const now = new Date();
  const isExpired = !task.completed && task.endDate && new Date(task.endDate) < now;
  return `<li data-id="${task.id}" class="${task.completed ? 'completed' : isExpired ? 'expired' : ''} fade-in">
    <input type="checkbox" class="toggle" ${task.completed ? 'checked' : ''} />
    <div>
      <div class="title">${esc(task.title)}</div>
      ${task.description ? `<small>${esc(task.description)}</small>` : ''}
      <small style="display:block; font-weight:bold; color:var(--primary)">Categoría: ${esc(task.category)}</small>
      ${task.startDate ? `<small>Inicio: ${new Date(task.startDate).toLocaleString()}</small>` : ''}
      ${task.endDate ? `<small>Fin: ${new Date(task.endDate).toLocaleString()}</small>` : ''}
      ${isExpired ? `<small class="expired-label">⚠ Caducada</small>` : ''}
    </div>
    <div class="actions">
      <button class="edit secondary" title="Editar">✏️</button>
      <button class="delete danger" title="Eliminar">✕</button>
    </div>
  </li>`;
}

function applyFilter(tasks) {
  let filtered = tasks;
  
  if (currentFilter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }
  // Filtrar por categoría (si no es "all")
  if (currentCategoryFilter && currentCategoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === currentCategoryFilter);
  }
  return filtered;

  const now = new Date();
  if (currentFilter === 'active') return tasks.filter(t => !t.completed && (!t.endDate || new Date(t.endDate) >= now));
  if (currentFilter === 'completed') return tasks.filter(t => t.completed);
  if (currentFilter === 'expired') return tasks.filter(t => !t.completed && t.endDate && new Date(t.endDate) < now);
  return tasks;
}




function updateCounters() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const expired = allTasks.filter(t => !t.completed && t.endDate && new Date(t.endDate) < new Date()).length;
  const pending = total - completed - expired;
  document.getElementById('count-total').textContent = total;
  document.getElementById('count-completed').textContent = completed;
  document.getElementById('count-pending').textContent = pending;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(()=> t.style.display = "none", 3000);
}

    // --- API ---
async function fetchTasks() {
  const res = await fetch('/api/tasks', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error cargando tareas');
  return res.json();
}

async function addTask(title, description, category, startDate, endDate) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, description, category, startDate, endDate })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error creando tarea');
  }

  const newTask = await res.json();
  allTasks.push(newTask);
  renderList();
}

async function toggleTask(id, completed) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ completed })
  });
  const task = allTasks.find(t=>t.id==id);
  if (task) task.completed = completed;
  renderList();
}
async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { 
    method: 'DELETE',
    credentials: 'include'
  });
  allTasks = allTasks.filter(t=>t.id!=id);
  renderList();
}
async function clearCompleted() {
  clearModal.style.display = 'flex';
}

function renderList() {
  const list = document.getElementById('tasks');
  const filtered = applyFilter(allTasks);
  list.innerHTML = filtered.map(taskItemHtml).join('');
  document.getElementById('empty-state').style.display = filtered.length ? 'none' : 'block';
  updateCounters();
}

// --- Restricción: no permitir fechas en el pasado ---
function setDateMinToday() {
  const now = new Date();
  now.setSeconds(0, 0); 
  const localISO = now.toLocaleString('sv-SE').replace(' ', 'T'); 

  document.getElementById('start-date').min = localISO;
  document.getElementById('end-date').min = localISO;
  editStartDateInput.min = localISO;
  editEndDateInput.min = localISO;
}

// --- Listeners ---
document.getElementById('task-form').addEventListener('submit', async e => {
  e.preventDefault();
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const catEl = document.getElementById('category');
  const startEl = document.getElementById('start-date');
  const endEl = document.getElementById('end-date');
  
  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  const category = catEl.value.trim();
  const startDate = startEl.value ? new Date(startEl.value).toISOString() : null;
  const endDate = endEl.value ? new Date(endEl.value).toISOString() : null;

  if (!title || !category) {
    showToast('Título y categoría son obligatorios');
    return;
  }

  try {
    await addTask(title, description, category, startDate, endDate);
    e.target.reset();
    setDateMinToday();
    titleEl.focus();
  } catch (err) {
    showToast(err.message || 'Error al crear la tarea');
  }
});


document.getElementById('tasks').addEventListener('change', e => {
  if (e.target.classList.contains('toggle')) {
    const li = e.target.closest('li');
    toggleTask(li.dataset.id, e.target.checked);
  }
});
document.getElementById('tasks').addEventListener('click', async e => {
  const target = e.target;
  const taskElement = target.closest('li');
  if (!taskElement) return;

  const taskId = parseInt(taskElement.dataset.id);

  if (target.matches('.delete')) {
    taskToDeleteId = taskId;
    confirmModal.style.display = 'flex';
  } else if (target.matches('.toggle')) {
    toggleTask(taskId, target.checked);
  }

  if (e.target.classList.contains('edit')) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    taskToEditId = taskId;
    editTitleInput.value = task.title;
    editDescriptionInput.value = task.description || '';
    editStartDateInput.value = task.startDate ? new Date(task.startDate).toISOString().slice(0,16) : '';
    editEndDateInput.value = task.endDate ? new Date(task.endDate).toISOString().slice(0,16) : '';
    editModal.style.display = 'flex';
    editTitleInput.focus();
  }
});

document.querySelectorAll('.filters button[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    localStorage.setItem('filter', currentFilter);
    document.querySelectorAll('.filters button[data-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
  });
});

document.getElementById('clear-completed').addEventListener('click', () => clearCompleted());

// --- Tema ---
const themeBtn = document.getElementById('theme-btn');
function applyTheme(theme){
  document.documentElement.classList.toggle('dark', theme==='dark');
  themeBtn.textContent = theme==='dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
applyTheme(savedTheme);
themeBtn.addEventListener('click', ()=> applyTheme(document.documentElement.classList.contains('dark') ? 'light':'dark'));

function setActiveFilters() {
  // Estado
  document.querySelectorAll('.filters button[data-filter]').forEach(b => b.classList.remove('active'));
  document.querySelector(`.filters button[data-filter="${currentFilter}"]`)?.classList.add('active');

  // Categoría - buscar en el contenedor dinámico
  const categoryFilters = document.getElementById('category-filters');
  if (categoryFilters) {
    categoryFilters.querySelectorAll('button[data-category]').forEach(b => b.classList.remove('active-filter'));
    categoryFilters.querySelector(`button[data-category="${currentCategoryFilter}"]`)?.classList.add('active-filter');
  }
}
const filterButtons = document.querySelectorAll(".filters .secondary");

filterButtons.forEach(button => {
  button.addEventListener("click", function () {
    filterButtons.forEach(btn => btn.classList.remove("active-filter"));
    this.classList.add("active-filter");
  });
});

// Event listeners para modal de eliminación
// --- Inicio ---
(async function init(){
  try {
    allTasks = await fetchTasks();
    setActiveFilters();
    renderList();
    setDateMinToday();
  } catch(e){
    showToast(e.message);
  }
})();

// Event listeners para modal de eliminación
confirmDeleteBtn.addEventListener('click', () => {
    if (taskToDeleteId !== null) {
        deleteTask(taskToDeleteId);
        taskToDeleteId = null;
    }
    confirmModal.style.display = 'none';
});

cancelDeleteBtn.addEventListener('click', () => {
    taskToDeleteId = null;
    confirmModal.style.display = 'none';
});

// --- Event listeners para modal de edición ---
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (taskToEditId !== null) {
        const newTitle = editTitleInput.value.trim();
        const newDescription = editDescriptionInput.value.trim();
        const newStartDate = editStartDateInput.value ? new Date(editStartDateInput.value).toISOString() : null;
        const newEndDate = editEndDateInput.value ? new Date(editEndDateInput.value).toISOString() : null;

        if (!newTitle) return;

        try {
            await fetch(`/api/tasks/${taskToEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: newTitle, description: newDescription, startDate: newStartDate, endDate: newEndDate })
            });

            const task = allTasks.find(t => t.id === taskToEditId);
            if (task) {
                task.title = newTitle;
                task.description = newDescription;
                task.startDate = newStartDate;
                task.endDate = newEndDate;
            }

            renderList();
            taskToEditId = null;
            editModal.style.display = 'none';
        } catch (err) {
            showToast('Error al actualizar la tarea');
        }
    }
});

cancelEditBtn.addEventListener('click', () => {
    taskToEditId = null;
    editModal.style.display = 'none';
});

// --- Event listeners para modal de limpiar ---
confirmClearBtn.addEventListener('click', async () => {
    try {
        const completed = allTasks.filter(t => t.completed);
        await Promise.all(completed.map(t => fetch(`/api/tasks/${t.id}`, { 
            method: 'DELETE',
            credentials: 'include'
        })));
        allTasks = allTasks.filter(t => !t.completed);
        renderList();
        showToast('Tareas completadas eliminadas');
    } catch (err) {
        showToast('Error al eliminar tareas completadas');
    }
    clearModal.style.display = 'none';
});

// --- Gestion de categorías ---
async function fetchCategories() {
  const res = await fetch('/api/categories', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error cargando categorías');
  return res.json();
}

async function createCategory(name, color) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, color })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error creando categoría');
  }

  return res.json();
}

async function deleteCategory(id) {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error eliminando categoría');
  }
}

function loadCategoriesIntoSelect() {
  const categorySelect = document.getElementById('category');
  categorySelect.innerHTML = '<option value="">-- Selecciona categoría --</option>';
  
  allCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    option.style.color = category.color;
    categorySelect.appendChild(option);
  });
}

function updateCategoryFilters() {
  const categoryFiltersContainer = document.querySelector('.filters');
  
  // Encontrar el contenedor de filtros de categoría
  let categoryFilters = document.getElementById('category-filters');
  if (!categoryFilters) {
    categoryFilters = document.createElement('div');
    categoryFilters.id = 'category-filters';
    categoryFilters.style.marginTop = '10px';
    categoryFiltersContainer.appendChild(categoryFilters);
  }
  
  categoryFilters.innerHTML = `
    <strong>Filtrar por categoría: </strong>
    <button class="secondary" data-category="all">Todas</button>
  `;
  
  allCategories.forEach(category => {
    const btn = document.createElement('button');
    btn.classList.add('secondary');
    btn.dataset.category = category.name;
    btn.textContent = category.name;
    btn.style.borderColor = category.color;
    categoryFilters.appendChild(btn);
  });
  
  // Agregar event listeners
  categoryFilters.querySelectorAll('button[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategoryFilter = btn.dataset.category;
      localStorage.setItem('categoryFilter', currentCategoryFilter);
      categoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      renderList();
    });
  });
  
  // Establecer filtro activo
  const activeBtn = categoryFilters.querySelector(`button[data-category="${currentCategoryFilter}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active-filter');
  }
}

function renderCategoriesList() {
  const categoriesList = document.getElementById('categories-list');
  if (!categoriesList) return;
  
  categoriesList.innerHTML = '';
  
  // Separar categorías por defecto y personalizadas
  const defaultCategories = allCategories.filter(cat => cat.isDefault);
  const userCategories = allCategories.filter(cat => !cat.isDefault);
  
  // Mostrar categorías por defecto
  if (defaultCategories.length > 0) {
    const defaultSection = document.createElement('div');
    defaultSection.innerHTML = '<h5 style="margin-bottom: 10px; color: var(--text-secondary);">Categorías por defecto</h5>';
    defaultCategories.forEach(category => {
      const item = createCategoryListItem(category, false);
      defaultSection.appendChild(item);
    });
    categoriesList.appendChild(defaultSection);
  }
  
  // Mostrar categorías del usuario
  if (userCategories.length > 0) {
    const userSection = document.createElement('div');
    userSection.innerHTML = '<h5 style="margin-bottom: 10px; color: var(--text-secondary); margin-top: 20px;">Mis categorías personalizadas</h5>';
    userCategories.forEach(category => {
      const item = createCategoryListItem(category, true);
      userSection.appendChild(item);
    });
    categoriesList.appendChild(userSection);
  } else {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'Aún no has creado categorías personalizadas.';
    emptyMsg.style.color = 'var(--text-secondary)';
    emptyMsg.style.fontStyle = 'italic';
    emptyMsg.style.marginTop = '20px';
    categoriesList.appendChild(emptyMsg);
  }
}

function createCategoryListItem(category, canDelete) {
  const item = document.createElement('div');
  item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px;';
  
  const info = document.createElement('div');
  info.style.cssText = 'display: flex; align-items: center; gap: 10px;';
  
  const colorDot = document.createElement('div');
  colorDot.style.cssText = `width: 20px; height: 20px; border-radius: 50%; background-color: ${category.color}; border: 2px solid var(--border);`;
  
  const name = document.createElement('span');
  name.textContent = category.name;
  name.style.fontWeight = 'bold';
  
  info.appendChild(colorDot);
  info.appendChild(name);
  
  const actions = document.createElement('div');
  if (canDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('danger', 'small');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.onclick = () => handleDeleteCategory(category.id);
    actions.appendChild(deleteBtn);
  } else {
    const label = document.createElement('span');
    label.textContent = 'Por defecto';
    label.style.cssText = 'font-size: 12px; color: var(--text-secondary); font-style: italic;';
    actions.appendChild(label);
  }
  
  item.appendChild(info);
  item.appendChild(actions);
  
  return item;
}

async function handleDeleteCategory(categoryId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Las tareas asociadas mantendrán el nombre de la categoría.')) {
    return;
  }
  
  try {
    await deleteCategory(categoryId);
    allCategories = allCategories.filter(cat => cat.id !== categoryId);
    renderCategoriesList();
    loadCategoriesIntoSelect();
    updateCategoryFilters();
    showToast('Categoría eliminada exitosamente');
  } catch (err) {
    showToast(err.message || 'Error al eliminar la categoría');
  }
}

// Event listeners para modal de categorías
document.getElementById('manage-categories-btn').addEventListener('click', () => {
  renderCategoriesList();
  document.getElementById('categories-modal').style.display = 'flex';
});

document.getElementById('close-categories-modal').addEventListener('click', () => {
  document.getElementById('categories-modal').style.display = 'none';
});

document.getElementById('new-category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('new-category-name').value.trim();
  const color = document.getElementById('new-category-color').value;
  
  if (!name) {
    showToast('El nombre de la categoría es requerido');
    return;
  }
  
  try {
    const newCategory = await createCategory(name, color);
    allCategories.push(newCategory);
    
    renderCategoriesList();
    loadCategoriesIntoSelect();
    updateCategoryFilters();
    
    // Limpiar formulario
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-color').value = '#007bff';
    
    showToast('Categoría creada exitosamente');
  } catch (err) {
    showToast(err.message || 'Error al crear la categoría');
  }
});

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('categories-modal')) {
    document.getElementById('categories-modal').style.display = 'none';
  }
});

cancelClearBtn.addEventListener('click', () => {
    clearModal.style.display = 'none';
});

// --- Cerrar modales al hacer clic fuera de ellos ---
window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        taskToDeleteId = null;
        confirmModal.style.display = 'none';
    }
    if (e.target === editModal) {
        taskToEditId = null;
        editModal.style.display = 'none';
    }
    if (e.target === clearModal) {
        clearModal.style.display = 'none';
    }
});

async function initApp() {
    // Verificar autenticación primero
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    
    // Configurar evento de logout
    handleLogout();
    
    // Cargar categorías y tareas
    try {
        allCategories = await fetchCategories();
        loadCategoriesIntoSelect();
        updateCategoryFilters();
        
        allTasks = await fetchTasks();
        renderList();
        updateCounters();
        setActiveFilters();
    } catch (err) {
        console.error('Error cargando datos:', err);
        showToast('Error cargando datos');
    }
}

initApp();
