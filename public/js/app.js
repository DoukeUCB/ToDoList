let currentUser = null;

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

let allTasks = [];
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
function esc(str='') {
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
const categoryFiltersContainer = document.createElement('div');
  categoryFiltersContainer.classList.add('filters');
  categoryFiltersContainer.style.marginBottom = '16px';
  categoryFiltersContainer.innerHTML = `
    <strong>Filtrar por categoría: </strong>
    <button class="secondary" data-category="all">Todas</button>
    <button class="secondary" data-category="casa">Casa</button>
    <button class="secondary" data-category="universidad">Universidad</button>
    <button class="secondary" data-category="trabajo">Trabajo</button>`;
// --- Insertar filtros justo antes de la lista de tareas ---
document.getElementById('tasks').parentNode.insertBefore(categoryFiltersContainer, document.getElementById('tasks'));

categoryFiltersContainer.querySelectorAll('button[data-category]').forEach(btn => {
  btn.addEventListener('click', () => {
    currentCategoryFilter = btn.dataset.category; // cambia filtro actual
    localStorage.setItem('categoryFilter', currentCategoryFilter); // GUARDAR categoría
    categoryFiltersContainer.querySelectorAll('button').forEach(b => b.classList.remove('active-filter'));
    btn.classList.add('active-filter'); // resalta botón activo
    renderList(); // vuelve a renderizar la lista filtrada
  });
});




    // --- API ---
async function fetchTasks() {
  const res = await fetch('/api/tasks', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error cargando tareas');
  return res.json();
}

async function addTask(title, description, startDate, endDate) {
  const res = await fetch('/api/tasks', {
    method: 'POST'
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, description, startDate, endDate, category })
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
  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  const category = catEl.value.trim();

  if (!title || !category) {
    showToast('Título y categoría son obligatorios');
    return;
  }

  try {
    await addTask(title, description, category);
  const startEl = document.getElementById('start-date');
  const endEl = document.getElementById('end-date');
  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  const startDate = startEl.value ? new Date(startEl.value).toISOString() : null;
  const endDate = endEl.value ? new Date(endEl.value).toISOString() : null;
  if (!title) return;
  try {
    await addTask(title, description, startDate, endDate);
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

  // Categoría
  categoryFiltersContainer.querySelectorAll('button[data-category]').forEach(b => b.classList.remove('active-filter'));
  categoryFiltersContainer.querySelector(`button[data-category="${currentCategoryFilter}"]`)?.classList.add('active-filter');
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
    
    // Cargar tareas y aplicar filtros
    try {
        allTasks = await fetchTasks();
        renderList();
        updateCounters();
        setFilterActive(currentFilter);
    } catch (err) {
        console.error('Error cargando tareas:', err);
        showToast('Error cargando tareas');
    }
}

initApp();
