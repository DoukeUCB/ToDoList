let allTasks = [];
let currentFilter = localStorage.getItem('filter') || 'all';

// Modal de eliminación
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
let taskToDeleteId = null;

// Modal de edición
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTitleInput = document.getElementById('edit-title');
const editDescriptionInput = document.getElementById('edit-description');
const confirmEditBtn = document.getElementById('confirm-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
let taskToEditId = null;

// Modal de limpiar
const clearModal = document.getElementById('clear-modal');
const confirmClearBtn = document.getElementById('confirm-clear-btn');
const cancelClearBtn = document.getElementById('cancel-clear-btn');

// --- Helpers ---
function esc(str='') {
  return str.replace(/[&<>"]?/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
}

function taskItemHtml(task) {
  return `<li data-id="${task.id}" class="${task.completed ? 'completed' : ''} fade-in">
    <input type="checkbox" class="toggle" ${task.completed ? 'checked' : ''} />
    <div>
      <div class="title">${esc(task.title)}</div>
      ${task.description ? `<small>${esc(task.description)}</small>` : ''}
    </div>
    <div class="actions">
      <button class="edit secondary" title="Editar">✏️</button>
      <button class="delete danger" title="Eliminar">✕</button>
    </div>
  </li>`;
}

function applyFilter(tasks) {
  if (currentFilter === 'active') return tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') return tasks.filter(t => t.completed);
  return tasks;
}

function updateCounters() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const pending = total - completed;
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
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Error cargando tareas');
  return res.json();
}
async function addTask(title, description) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
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
    body: JSON.stringify({ completed })
  });
  const task = allTasks.find(t=>t.id==id);
  if (task) task.completed = completed;
  renderList();
}
async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  allTasks = allTasks.filter(t=>t.id!=id);
  renderList();
}
async function clearCompleted() {
  // Mostrar modal de confirmación en lugar del confirm nativo
  clearModal.style.display = 'flex';
}

function renderList() {
  const list = document.getElementById('tasks');
  const filtered = applyFilter(allTasks);
  list.innerHTML = filtered.map(taskItemHtml).join('');
  document.getElementById('empty-state').style.display = filtered.length ? 'none' : 'block';
  updateCounters();
}

document.getElementById('task-form').addEventListener('submit', async e => {
  e.preventDefault();
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  if (!title) return;
  try {
    await addTask(title, description);
    e.target.reset();
    titleEl.focus();
  } catch(err){
    showToast(err.message);
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
    // En lugar de eliminar, muestra el modal
    taskToDeleteId = taskId;
    confirmModal.style.display = 'flex';
  } else if (target.matches('.toggle')) {
    toggleTask(taskId, target.checked);
  }

    if (e.target.classList.contains('edit')) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Mostrar modal de edición en lugar del prompt
    taskToEditId = taskId;
    editTitleInput.value = task.title;
    editDescriptionInput.value = task.description || '';
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

// --- Inicio ---
(async function init(){
  try {
    allTasks = await fetchTasks();
    document.querySelector(`.filters button[data-filter="${currentFilter}"]`)?.classList.add("active");
    renderList();
  } catch(e){
    showToast(e.message);
  }
})();

const filterButtons = document.querySelectorAll(".filters .secondary");

filterButtons.forEach(button => {
  button.addEventListener("click", function () {
    filterButtons.forEach(btn => btn.classList.remove("active-filter"));
    this.classList.add("active-filter");
  });
});

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

// Event listeners para modal de edición
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (taskToEditId !== null) {
        const newTitle = editTitleInput.value.trim();
        const newDescription = editDescriptionInput.value.trim();
        
        if (!newTitle) return;
        
        try {
            await fetch(`/api/tasks/${taskToEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, description: newDescription })
            });

            const task = allTasks.find(t => t.id === taskToEditId);
            if (task) {
                task.title = newTitle;
                task.description = newDescription;
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

// Event listeners para modal de limpiar
confirmClearBtn.addEventListener('click', async () => {
    try {
        const completed = allTasks.filter(t => t.completed);
        await Promise.all(completed.map(t => fetch(`/api/tasks/${t.id}`, { method: 'DELETE' })));
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

// Cerrar modales al hacer clic fuera de ellos
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
