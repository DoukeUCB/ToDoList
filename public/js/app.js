let allTasks = [];
let currentFilter = 'all';

async function fetchTasks() {
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Error cargando tareas');
  return res.json();
}

function esc(str='') {
  return str.replace(/[&<>"]?/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
}

function taskItemHtml(task) {
  return `<li data-id="${task.id}" class="${task.completed ? 'completed' : ''}">
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

async function renderTasks() {
  try {
    allTasks = await fetchTasks();
    const list = document.getElementById('tasks');
    const filtered = applyFilter(allTasks);
    list.innerHTML = filtered.map(taskItemHtml).join('');
    document.getElementById('empty-state').style.display = filtered.length ? 'none' : 'block';
    updateCounters();
  } catch (e) {
    alert(e.message);
  }
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
  renderTasks();
}

async function toggleTask(id, completed) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed })
  });
  renderTasks();
}

async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  renderTasks();
}

async function clearCompleted() {
  const completed = allTasks.filter(t => t.completed);
  await Promise.all(completed.map(t => fetch(`/api/tasks/${t.id}`, { method: 'DELETE' })));
  renderTasks();
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
    alert(err.message);
  }
});

document.getElementById('tasks').addEventListener('change', e => {
  if (e.target.classList.contains('toggle')) {
    const li = e.target.closest('li');
    toggleTask(li.dataset.id, e.target.checked);
  }
});

document.getElementById('tasks').addEventListener('click', async e => {
  const li = e.target.closest('li');
  if (!li) return;

  const id = Number(li.dataset.id);

  // Eliminar
  if (e.target.classList.contains('delete')) {
    await deleteTask(id);
  }

  // Editar
  if (e.target.classList.contains('edit')) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    const titleEl = document.getElementById('title');
    const descEl = document.getElementById('description');
    titleEl.value = task.title;
    descEl.value = task.description || '';

    const form = document.getElementById('task-form');
    const formBtn = form.querySelector('button[type="submit"]');
    formBtn.textContent = '💾 Guardar';

    // Remueve cualquier listener anterior para no duplicar
    form.replaceWith(form.cloneNode(true));
    const newForm = document.getElementById('task-form');

    newForm.addEventListener('submit', async ev => {
      ev.preventDefault();
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleEl.value, description: descEl.value })
      });
      newForm.reset();
      formBtn.textContent = '➕ Añadir';
      renderTasks();
    });
  }
});

document.querySelectorAll('.filters button[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filters button[data-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const list = document.getElementById('tasks');
    const filtered = applyFilter(allTasks);
    list.innerHTML = filtered.map(taskItemHtml).join('');
    document.getElementById('empty-state').style.display = filtered.length ? 'none' : 'block';
  });
});

document.getElementById('clear-completed').addEventListener('click', () => clearCompleted());

// Dark / Light mode
const themeBtn = document.getElementById('theme-btn');
function applyTheme(theme){
  document.documentElement.classList.toggle('dark', theme==='dark');
  themeBtn.textContent = theme==='dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
applyTheme(savedTheme);
themeBtn.addEventListener('click', ()=> applyTheme(document.documentElement.classList.contains('dark') ? 'light':'dark'));

renderTasks();
