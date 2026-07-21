'use strict';

/* ==========================================================
   CHORE CHART DATA
   ========================================================== */
const STORAGE_KEY = 'seniorMasteryChildren';

const CHORE_GROUPS = [
  {
    minAge: 2,
    maxAge: 4,
    label: 'Ages 2–4',
    chores: [
      'Put away toys',
      'Help set the table',
      'Wipe up small spills',
      'Place dirty clothes in the laundry hamper',
      'Water indoor plants with adult assistance',
    ],
  },
  {
    minAge: 5,
    maxAge: 7,
    label: 'Ages 5–7',
    chores: [
      'Make the bed',
      'Feed pets',
      'Help with light dusting',
      'Sort laundry by color',
      'Organize books or school supplies',
    ],
  },
  {
    minAge: 8,
    maxAge: 10,
    label: 'Ages 8–10',
    chores: [
      'Take out the trash',
      'Help with laundry',
      'Sweep the floor',
      'Pack a school lunch with adult guidance',
      'Unload safe items from the dishwasher',
    ],
  },
  {
    minAge: 11,
    maxAge: 13,
    label: 'Ages 11–13',
    chores: [
      'Wash dishes',
      'Vacuum rooms',
      'Clean the bathroom',
      'Prepare a simple breakfast or snack',
      'Help care for younger siblings under adult supervision',
    ],
  },
  {
    minAge: 14,
    maxAge: 16,
    label: 'Ages 14–16',
    chores: [
      'Prepare simple meals',
      'Mow the lawn after receiving proper safety instruction',
      'Do laundry independently',
      'Create a weekly cleaning schedule',
      'Wash the family vehicle',
    ],
  },
  {
    minAge: 17,
    maxAge: 18,
    label: 'Ages 17–18',
    chores: [
      'Manage weekly groceries within a budget',
      'Plan family meals',
      'Handle minor home repairs with appropriate guidance',
      'Create and manage a basic household budget',
      'Schedule appointments and manage personal responsibilities',
    ],
  },
];

/* ==========================================================
   DOM REFERENCES AND APPLICATION STATE
   ========================================================== */
const choreForm = document.getElementById('choreForm');
const nameInput = document.getElementById('name');
const ageInput = document.getElementById('age');
const chartOutput = document.getElementById('chartOutput');
const clearButton = document.getElementById('clearBtn');
const printButton = document.getElementById('printBtn');
const toast = document.getElementById('toast');

let children = loadChildren();
let toastTimer;

renderCharts();

/* ==========================================================
   EVENT HANDLERS
   ========================================================== */
choreForm.addEventListener('submit', handleFormSubmit);
clearButton.addEventListener('click', clearAllCharts);
printButton.addEventListener('click', printCharts);
chartOutput.addEventListener('click', handleChartAction);
window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-charts');
});

function handleFormSubmit(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const age = Number(ageInput.value);

  if (name.length < 2) {
    showToast('Enter a name with at least two characters.', 'error');
    nameInput.focus();
    return;
  }

  if (!Number.isInteger(age) || age < 2 || age > 18) {
    showToast('Enter a whole number from 2 to 18.', 'error');
    ageInput.focus();
    return;
  }

  const group = getChoreGroup(age);
  children.push({
    id: createId(),
    name,
    age,
    ageGroup: group.label,
    chores: [...group.chores],
  });

  saveChildren();
  renderCharts();
  choreForm.reset();
  nameInput.focus();
  showToast(`A chore chart was created for ${name}.`, 'success');
}

function clearAllCharts() {
  if (children.length === 0) {
    showToast('There are no chore charts to clear.');
    return;
  }

  const shouldClear = window.confirm('Clear all saved chore charts?');
  if (!shouldClear) return;

  children = [];
  saveChildren();
  renderCharts();
  showToast('All chore charts were cleared.', 'success');
}

function printCharts() {
  if (children.length === 0) {
    showToast('Create at least one chore chart before printing.', 'error');
    return;
  }

  document.body.classList.add('print-charts');
  window.print();
}

function handleChartAction(event) {
  const removeButton = event.target.closest('[data-remove-id]');
  if (!removeButton) return;

  const childId = removeButton.dataset.removeId;
  const child = children.find((item) => item.id === childId);
  children = children.filter((item) => item.id !== childId);

  saveChildren();
  renderCharts();
  showToast(child ? `The chore chart for ${child.name} was removed.` : 'The chore chart was removed.', 'success');
}

/* ==========================================================
   CHORE SELECTION AND RENDERING
   ========================================================== */
function getChoreGroup(age) {
  return CHORE_GROUPS.find((group) => age >= group.minAge && age <= group.maxAge);
}

function renderCharts() {
  if (children.length === 0) {
    chartOutput.className = 'empty-state';
    chartOutput.textContent = 'No children have been added yet.';
    return;
  }

  chartOutput.className = 'generated-chart-list';
  chartOutput.innerHTML = children
    .map((child, index) => {
      const chores = child.chores
        .map((chore) => `<li>${escapeHTML(chore)}</li>`)
        .join('');

      return `
        <article class="child-card">
          <header class="child-card-header">
            <div>
              <span class="tag">Chart ${index + 1}</span>
              <h3>${escapeHTML(child.name)}</h3>
              <p class="child-meta">Age ${child.age} | Group: ${escapeHTML(child.ageGroup || getChoreGroup(child.age).label)}</p>
            </div>
            <button
              type="button"
              class="remove-chart-button"
              data-remove-id="${escapeHTML(child.id)}"
              aria-label="Remove the chore chart for ${escapeHTML(child.name)}"
            >
              Remove
            </button>
          </header>
          <h4>Recommended Chores</h4>
          <ul>${chores}</ul>
        </article>
      `;
    })
    .join('');
}

/* ==========================================================
   LOCAL STORAGE
   ========================================================== */
function saveChildren() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
  } catch (error) {
    console.error('Unable to save chore charts:', error);
    showToast('The chore charts could not be saved in this browser.', 'error');
  }
}

function loadChildren() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (!savedValue) return [];

    const parsedValue = JSON.parse(savedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
      .filter((child) => child && typeof child.name === 'string' && Number.isInteger(child.age))
      .map((child) => {
        const group = getChoreGroup(child.age);
        return {
          id: typeof child.id === 'string' ? child.id : createId(),
          name: child.name,
          age: child.age,
          ageGroup: child.ageGroup || group?.label || '',
          chores: Array.isArray(child.chores) && child.chores.length > 0
            ? child.chores
            : [...(group?.chores || [])],
        };
      });
  } catch (error) {
    console.error('Unable to load saved chore charts:', error);
    return [];
  }
}

/* ==========================================================
   UTILITIES
   ========================================================== */
function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message, type = 'info') {
  window.clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className = `toast is-visible${type === 'info' ? '' : ` is-${type}`}`;

  toastTimer = window.setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
