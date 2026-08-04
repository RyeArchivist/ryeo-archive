const $ = (id) => document.getElementById(id);

const TYPE_LABELS = {
  '現象': '현상형',
  '個體': '개체형',
  '物件': '물건형',
  '傳染': '전염형',
  '記錄': '기록형',
  '未分類': '미분류',
};

let records = [];
let selected = null;
let selectedYear = 'all';
const ARCHIVE_INDEX = window.RYEO_ARCHIVE_INDEX || { startYear:1912, currentYear:2026, pre1912:{total:1473}, counts:{} };

const fields = {
  record_no: $('recordNo'),
  title: $('title'),
  region: $('region'),
  risk_level: $('riskLevel'),
  status: $('status'),
  assigned_to: $('assignedTo'),
  summary: $('summary'),
  content: $('content'),
  is_published: $('published'),
};

function typeCheckboxes() {
  return [...document.querySelectorAll('input[name="recordType"]')];
}

function recordYear(record) {
  const match = String(record?.record_no || '').match(/RY-(\d{4})-/i);
  return match ? Number(match[1]) : null;
}

function archiveCount(year) {
  return Number(ARCHIVE_INDEX.counts?.[String(year)] || 0);
}

function buildAdminYearFilter() {
  const select = $('yearFilter');
  if (!select) return;
  const options = ['<option value="all">전체 연도</option>'];
  for (let year = ARCHIVE_INDEX.currentYear; year >= ARCHIVE_INDEX.startYear; year -= 1) {
    options.push(`<option value="${year}">${year}년 · 색인 ${archiveCount(year)}건</option>`);
  }
  options.push(`<option value="pre1912">1912년 이전 · 열람 금지 · ${ARCHIVE_INDEX.pre1912.total.toLocaleString()}건</option>`);
  select.innerHTML = options.join('');
  select.value = selectedYear;
}

function updateAdminArchiveMeta(visibleActual = 0) {
  const meta = $('yearArchiveMeta');
  if (!meta) return;
  if (selectedYear === 'pre1912') {
    const p = ARCHIVE_INDEX.pre1912;
    meta.className = 'year-archive-meta locked';
    meta.innerHTML = `<b>1912년 이전 기록</b><span>열람 금지 · 통합 색인 ${p.total.toLocaleString()}건</span><small>원본 소재 ${p.originalLocated} · 부분 소실 ${p.partialLoss} · 위치 미확인 ${p.locationUnknown} · 기록관 제한 ${p.keeperRestricted}</small>`;
    return;
  }
  const indexed = selectedYear === 'all' ? ARCHIVE_INDEX.accessibleTotal : archiveCount(Number(selectedYear));
  meta.className = 'year-archive-meta';
  meta.innerHTML = `<b>${selectedYear === 'all' ? '1912–2026 통합 기록' : selectedYear + '년 기록'}</b><span>색인 ${Number(indexed).toLocaleString()}건 · 데이터베이스 등록 ${visibleActual}건</span>`;
}

function getSelectedTypes() {
  const values = typeCheckboxes().filter((el) => el.checked).map((el) => el.value);
  return values.length ? values.join(' / ') : '未分類';
}

function setSelectedTypes(value) {
  const values = String(value || '未分類')
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);

  typeCheckboxes().forEach((el) => {
    el.checked = values.includes(el.value);
  });

  if (!typeCheckboxes().some((el) => el.checked)) {
    const unclassified = typeCheckboxes().find((el) => el.value === '未分類');
    if (unclassified) unclassified.checked = true;
  }
}

function bindTypeRules() {
  typeCheckboxes().forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const unclassified = typeCheckboxes().find((el) => el.value === '未分類');

      if (checkbox.value === '未分類' && checkbox.checked) {
        typeCheckboxes().forEach((el) => {
          if (el.value !== '未分類') el.checked = false;
        });
      } else if (checkbox.checked && unclassified) {
        unclassified.checked = false;
      }

      if (!typeCheckboxes().some((el) => el.checked) && unclassified) {
        unclassified.checked = true;
      }
    });
  });
}

function msg(text, error = false) {
  const el = $('message');
  el.hidden = !text;
  el.textContent = text || '';
  el.classList.toggle('error', error);
}

function payload() {
  const data = Object.fromEntries(
    Object.entries(fields).map(([key, element]) => [
      key,
      key === 'is_published' ? element.checked : element.value.trim(),
    ])
  );
  data.record_type = getSelectedTypes();
  return data;
}

function clearForm() {
  selected = null;
  $('recordForm').reset();
  $('recordId').value = '';
  $('region').value = '미상';
  $('riskLevel').value = '평가 불가';
  $('status').value = '분석 중';
  setSelectedTypes('未分類');
  $('editorTitle').textContent = '새 사건 기록';
  $('deleteBtn').hidden = true;
  document.querySelectorAll('.record-item').forEach((el) => el.classList.remove('active'));
  msg('');
}

function fill(record) {
  selected = record;
  $('recordId').value = record.id;

  for (const [key, element] of Object.entries(fields)) {
    if (key === 'is_published') element.checked = !!record[key];
    else element.value = record[key] ?? '';
  }

  setSelectedTypes(record.record_type);
  $('editorTitle').textContent = record.record_no;
  $('deleteBtn').hidden = false;
  render();
}

function typeToKorean(value) {
  return String(value || '未分類')
    .split('/')
    .map((item) => TYPE_LABELS[item.trim()] || item.trim())
    .join(' · ');
}

function render() {
  const query = $('filterInput').value.trim().toLowerCase();
  const list = records.filter((record) => {
    const year = recordYear(record);
    const yearMatch = selectedYear === 'all' || (selectedYear !== 'pre1912' && year === Number(selectedYear));
    const queryMatch = `${record.record_no} ${record.title}`.toLowerCase().includes(query);
    return yearMatch && queryMatch;
  });

  updateAdminArchiveMeta(list.length);

  if (selectedYear === 'pre1912') {
    $('recordList').innerHTML = '<div class="pre1912-admin-lock"><strong>封</strong><b>1912년 이전 기록은 목록 열람이 제한됩니다.</b><span>새 기록 작성 시 기록번호를 직접 지정할 수 있으나 기존 색인 목록은 기록관 권한이 필요합니다.</span></div>';
    return;
  }

  $('recordList').innerHTML = list.map((record) => `
    <article class="record-item ${selected?.id === record.id ? 'active' : ''}" data-id="${record.id}">
      <b>${esc(record.record_no)}</b>
      <span>${esc(record.title)}</span>
      <span>${esc(typeToKorean(record.record_type))}</span>
      <small>
        <i>${esc(record.status)}</i>
        <i>${record.is_published ? '공개' : '비공개'}</i>
      </small>
    </article>
  `).join('') || '<p class="loading">해당 연도에 등록된 상세 기록이 없습니다. 색인 정보만 존재합니다.</p>';

  document.querySelectorAll('.record-item').forEach((el) => {
    el.onclick = () => fill(records.find((record) => record.id === Number(el.dataset.id)));
  });
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

async function load() {
  try {
    const response = await fetch('/api/admin/records', { credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '불러오기 실패');
    records = data.records;
    $('adminUser').textContent = data.admin;
    render();
  } catch (error) {
    $('recordList').innerHTML = `<p class="message error">${esc(error.message)}</p>`;
  }
}

$('recordForm').onsubmit = async (event) => {
  event.preventDefault();
  msg('저장 중…');

  try {
    const id = $('recordId').value;
    const response = await fetch(
      id ? `/api/admin/records/${id}` : '/api/admin/records',
      {
        method: id ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload()),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '저장 실패');

    msg('기록이 저장되었습니다.');
    await load();

    if (data.id) {
      const created = records.find((record) => record.id === Number(data.id));
      if (created) fill(created);
    } else if (id) {
      const updated = records.find((record) => record.id === Number(id));
      if (updated) fill(updated);
    }
  } catch (error) {
    msg(error.message, true);
  }
};

$('deleteBtn').onclick = async () => {
  if (!selected || !confirm(`${selected.record_no} 기록을 삭제할까요?`)) return;

  try {
    const response = await fetch(`/api/admin/records/${selected.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '삭제 실패');
    clearForm();
    await load();
  } catch (error) {
    msg(error.message, true);
  }
};

$('newBtn').onclick = clearForm;
$('filterInput').oninput = render;
$('yearFilter').onchange = () => { selectedYear = $('yearFilter').value; render(); };
buildAdminYearFilter();
bindTypeRules();
clearForm();
load();
