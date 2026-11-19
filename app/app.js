// Leonida Trophy Atlas — tracker for the 55 GTA 6 trophies.
// Progress lives only in this browser (localStorage) and in the file you export.
// No network at run time: the only fetch is the app's own data/trophies.json.
const STORAGE_KEY = 'gta6-trophy-guide-01-progress-v1';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABELS = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

const grid = document.getElementById('trophy-grid');
const listCount = document.getElementById('list-count');
const listNote = document.getElementById('list-note');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const sortSelect = document.getElementById('sort');
const spoilerBox = document.getElementById('spoiler');
const filtersBox = document.getElementById('filters');

let trophyData = null;
let earnedIds = new Set();
let activeKind = 'all';

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) earnedIds = new Set(saved.earned.filter((n) => Number.isInteger(n)));
    if (typeof saved.spoiler === 'boolean') spoilerBox.checked = saved.spoiler;
  } catch {
    earnedIds = new Set();
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earnedIds].sort((a, b) => a - b), spoiler: spoilerBox.checked }));
}

function applyShareParams() {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('earned');
  if (shared) {
    for (const part of shared.split(',')) {
      const id = Number(part.trim());
      if (Number.isInteger(id)) earnedIds.add(id);
    }
    saveProgress();
  }
  if (params.get('spoiler') === '1') spoilerBox.checked = true;
  if (params.get('spoiler') === '0') spoilerBox.checked = false;
  const kind = params.get('filter');
  if (kind && KIND_LABELS[kind]) setActiveKind(kind);
  const q = params.get('q');
  if (q) searchInput.value = q;
}

function trophyMatchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'online') return false;
  return trophy.kind === kind;
}

function trophyIsSpoilerHidden(trophy) {
  return spoilerBox.checked && trophy.hidden === true && trophy.kind === 'story' && !earnedIds.has(trophy.id);
}

function visibleTrophies() {
  const query = searchInput.value.trim().toLowerCase();
  let list = trophyData.trophies.filter((t) => trophyMatchesKind(t, activeKind));
  if (gradeSelect.value !== 'all') list = list.filter((t) => t.grade === gradeSelect.value);
  if (query) {
    list = list.filter((t) => {
      if (trophyIsSpoilerHidden(t)) return false;
      return [t.name, t.description, t.guide, t.source].join(' ').toLowerCase().includes(query);
    });
  }
  if (sortSelect.value === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sortSelect.value === 'grade') {
    list = [...list].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  }
  if (sortSelect.value === 'roadmap') {
    list = [...list].sort((a, b) => a.stage - b.stage || a.id - b.id);
  }
  return list;
}

function renderProgress() {
  const total = trophyData.trophies.length;
  const done = earnedIds.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('progress-count').textContent = `${done} of ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-ring').style.setProperty('--pct', String(pct));
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of trophyData.trophies) {
    if (earnedIds.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  }
  const parts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g] || 0}/${trophyData.trophies.filter((t) => t.grade === g).length} ${g}`)
    .join(' · ');
  document.getElementById('progress-grades').textContent = parts;
}

function renderRoadmap() {
  const stages = document.getElementById('stages');
  stages.replaceChildren();
  for (const stage of trophyData.roadmap) {
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = String(stage.stage);
    const title = document.createElement('h3');
    title.textContent = stage.title;
    head.append(num, title);
    const note = document.createElement('p');
    note.className = 'stage-note';
    note.textContent = stage.note;
    const chips = document.createElement('ul');
    chips.className = 'stage-trophies';
    for (const t of trophyData.trophies.filter((x) => x.stage === stage.stage)) {
      const chip = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#trophy-${t.id}`;
      link.textContent = t.name;
      if (earnedIds.has(t.id)) link.classList.add('earned');
      chip.append(link);
      chips.append(chip);
    }
    li.append(head, note, chips);
    stages.append(li);
  }
}

function renderTrophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'trophy-card';
  card.id = `trophy-${trophy.id}`;
  if (earnedIds.has(trophy.id)) card.classList.add('earned');
  if (trophy.missable) card.classList.add('missable-card');

  const top = document.createElement('div');
  top.className = 'card-top';
  const boxWrap = document.createElement('label');
  boxWrap.className = 'earn-box';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earnedIds.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earnedIds.add(trophy.id);
    else earnedIds.delete(trophy.id);
    saveProgress();
    renderAll();
  });
  boxWrap.append(box);

  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title';
  const name = document.createElement('h3');
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  if (trophyIsSpoilerHidden(trophy)) {
    name.textContent = 'Hidden story trophy';
    const hiddenNote = document.createElement('p');
    hiddenNote.className = 'official spoiler-hidden';
    hiddenNote.textContent = 'Spoilers hidden — earn this trophy to reveal its name and guide.';
    titleWrap.append(name, hiddenNote);
  } else {
    name.textContent = trophy.name;
    const desc = document.createElement('p');
    desc.className = 'official';
    desc.textContent = trophy.description;
    titleWrap.append(name, desc);
  }
  top.append(boxWrap, titleWrap, badge);

  const tags = document.createElement('div');
  tags.className = 'tag-row';
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
  tags.append(kindTag);
  if (trophy.hidden) {
    const hiddenTag = document.createElement('span');
    hiddenTag.className = 'tag hidden-tag';
    hiddenTag.textContent = 'Hidden on PSN';
    tags.append(hiddenTag);
  }
  if (trophy.missable) {
    const missTag = document.createElement('span');
    missTag.className = 'tag missable';
    missTag.textContent = 'Missable';
    tags.append(missTag);
  }
  if (trophy.count) {
    const countTag = document.createElement('span');
    countTag.className = 'tag count-tag';
    countTag.textContent = `Target: ${trophy.count} ${trophy.count_label || ''}`.trim();
    tags.append(countTag);
  }
  const stageTag = document.createElement('span');
  stageTag.className = 'tag';
  stageTag.textContent = `Roadmap stage ${trophy.stage}`;
  tags.append(stageTag);

  card.append(top, tags);
  if (!trophyIsSpoilerHidden(trophy)) {
    const guide = document.createElement('p');
    guide.className = 'guide';
    const label = document.createElement('strong');
    label.textContent = 'Guide: ';
    guide.append(label, document.createTextNode(trophy.guide));
    const source = document.createElement('p');
    source.className = 'source';
    source.append(document.createTextNode('Source: '));
    const link = document.createElement('a');
    link.href = trophy.source_url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = trophy.source;
    source.append(link);
    card.append(guide, source);
  }
  return card;
}

function renderTrophyGrid() {
  const list = visibleTrophies();
  grid.replaceChildren();
  for (const trophy of list) grid.append(renderTrophyCard(trophy));
  listCount.textContent = `— showing ${list.length} of ${trophyData.trophies.length}`;
  if (activeKind === 'online') {
    emptyState.hidden = false;
    emptyState.textContent = 'No online trophies: all 55 unlock in single-player, and there are no online or DLC trophies at launch (GTABase, via GGRecon). Nothing here needs GTA Online.';
  } else if (list.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent = 'No trophies match this filter. Try clearing the search or choosing another kind.';
  } else {
    emptyState.hidden = true;
  }
  listNote.textContent = activeKind === 'missable'
    ? 'Exactly one trophy is missable. The rest stay open after the credits.'
    : 'Tick a trophy when you earn it in-game — your progress is saved in this browser.';
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderTrophyGrid();
}

function setActiveKind(kind) {
  activeKind = kind;
  for (const button of filtersBox.querySelectorAll('.chip')) {
    button.classList.toggle('active', button.dataset.kind === kind);
  }
}

function exportProgress() {
  const payload = {
    app: 'gta6-trophy-guide-01',
    exported_at: new Date().toISOString(),
    earned: [...earnedIds].sort((a, b) => a - b),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const valid = new Set(trophyData.trophies.map((t) => t.id));
    earnedIds = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
    saveProgress();
    renderAll();
  } catch {
    window.alert('That file is not a Leonida Trophy Atlas progress export.');
  }
}

async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json failed: ${response.status}`);
  return response.json();
}

filtersBox.addEventListener('click', (event) => {
  const button = event.target.closest('.chip');
  if (!button) return;
  setActiveKind(button.dataset.kind);
  renderTrophyGrid();
});
searchInput.addEventListener('input', renderTrophyGrid);
gradeSelect.addEventListener('change', renderTrophyGrid);
sortSelect.addEventListener('change', renderTrophyGrid);
spoilerBox.addEventListener('change', () => {
  saveProgress();
  renderAll();
});
document.getElementById('export').addEventListener('click', exportProgress);
document.getElementById('import').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies in this browser?')) {
    earnedIds = new Set();
    saveProgress();
    renderAll();
  }
});

trophyData = await loadTrophyData();
loadSavedProgress();
applyShareParams();
renderAll();

// Deep links: scroll to the anchored trophy card or section once the list exists.
if (window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) target.scrollIntoView({ block: 'start' });
}
