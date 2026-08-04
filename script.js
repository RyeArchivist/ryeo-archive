const publicRecords = [
  { id: 'AR-2026-014', title: '폐쇄된 양수장의 반복 소음', region: '인천', status: '공개' },
  { id: 'AR-2024-031', title: '철거 예정 주택의 가족사진', region: '부천', status: '일부 제한' },
  { id: 'AR-2019-008', title: '새벽 3시 이후 재생되는 테이프', region: '서울', status: '열람 제한' },
  { id: 'AR-1912-000', title: '기록 이관 목록 정정 안내', region: '미상', status: '비공개' }
];

const ryeoRecords = [
  { id: 'RY-2026-014', title: '새벽마다 두 번 울리는 전화기', region: '인천', status: '회수 완료' },
  { id: 'RY-2024-031', title: '철거 예정 주택의 가족사진', region: '부천', status: '일부 제한' },
  { id: 'RY-2019-008', title: '제목 없음', region: '서울', status: '결락' },
  { id: 'RY-1912-000', title: '회수하는 자는 늘 먼저 와 있었다', region: '미상', status: '비인가' }
];

const notices = [
  ['2026년 지역 생활환경기록 수집사업 안내', '2026-08-02'],
  ['민간 소장 사진자료 기증 접수 안내', '2026-07-29'],
  ['기록물 디지털화 및 보존처리 용역 사전 수요조사', '2026-07-20'],
  ['2026년 상반기 기록보존 자원봉사자 모집 공고', '2026-07-09'],
  ['제목 없음', '1912-00-00']
];

const dataRoom = [
  ['생활환경기록 기증 신청서 서식', 'PDF'],
  ['기록 열람·복제 신청서', 'HWP'],
  ['자료 공개 범위 및 이용 안내문', 'PDF'],
  ['record_1912_00.pdf', 'PDF']
];

const recordTableBody = document.getElementById('recordTableBody');
const noticeList = document.getElementById('noticeList');
const dataList = document.getElementById('dataList');
const rollingNotice = document.getElementById('rollingNotice');
const searchPanel = document.getElementById('searchPanel');
const searchToggle = document.getElementById('searchToggle');
const searchClose = document.getElementById('searchClose');
const searchSubmit = document.getElementById('searchSubmit');
const searchInput = document.getElementById('searchInput');
const searchResult = document.getElementById('searchResult');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileMenuX = document.getElementById('mobileMenuX');
const sitePopup = document.getElementById('sitePopup');
const hideToday = document.getElementById('hideToday');
const ryeoPanel = document.getElementById('ryeoPanel');
const brandKorean = document.getElementById('brandKorean');
const brandEnglish = document.getElementById('brandEnglish');
const toggleRecordMode = document.getElementById('toggleRecordMode');

const triggerSequence = ['intro', 'year1912', 'mark', 'search1912'];
let triggerStep = 0;
let ryeoActivated = false;

function renderRecords(records) {
  recordTableBody.innerHTML = records.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.title}</td>
      <td>${r.region}</td>
      <td>${r.status}</td>
    </tr>
  `).join('');
}

function renderNoticeList() {
  noticeList.innerHTML = notices.map(([title, date], idx) => `
    <li>
      <button type="button" class="notice-item" data-notice-index="${idx}">${title}</button>
      <small>${date}</small>
    </li>
  `).join('');

  dataList.innerHTML = dataRoom.map(([title, type]) => `
    <li>
      <a href="#">${title}</a>
      <small>${type}</small>
    </li>
  `).join('');
}

function registerSequence(action) {
  if (ryeoActivated) return;
  if (action === triggerSequence[triggerStep]) {
    triggerStep += 1;
    if (triggerStep === triggerSequence.length) beginRyeoTransition();
  } else {
    triggerStep = action === triggerSequence[0] ? 1 : 0;
  }
}

let ryeoTransitionRunning = false;
let transitionTimers = [];

function queueTransitionTimer(callback, delay) {
  const id = window.setTimeout(callback, delay);
  transitionTimers.push(id);
  return id;
}

function clearTransitionTimers() {
  transitionTimers.forEach(id => window.clearTimeout(id));
  transitionTimers = [];
}

function resetTransitionTyping() {
  const title = document.getElementById('transitionTypingTitle');
  if (title) {
    title.textContent = '';
    title.classList.remove('is-visible', 'is-typing', 'is-complete');
  }

  document.querySelectorAll('[data-transition-line]').forEach((line) => {
    line.textContent = '';
    line.classList.remove('is-visible', 'is-typing', 'is-complete');
  });
}

const HANGUL_CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function buildTypingFrames(text) {
  const frames = [];
  let committed = '';

  for (const char of text) {
    const code = char.charCodeAt(0);
    const isHangulSyllable = code >= 0xAC00 && code <= 0xD7A3;

    if (!isHangulSyllable) {
      committed += char;
      frames.push(committed);
      continue;
    }

    const syllableIndex = code - 0xAC00;
    const choIndex = Math.floor(syllableIndex / 588);
    const jungIndex = Math.floor((syllableIndex % 588) / 28);
    const jongIndex = syllableIndex % 28;

    const cho = HANGUL_CHO[choIndex];
    const lvChar = String.fromCharCode(0xAC00 + ((choIndex * 21) + jungIndex) * 28);
    const fullChar = String.fromCharCode(0xAC00 + syllableIndex);

    frames.push(committed + cho);
    frames.push(committed + lvChar);

    if (jongIndex > 0) {
      frames.push(committed + fullChar);
      committed += fullChar;
    } else {
      committed += lvChar;
    }
  }

  return frames.filter((frame, idx, arr) => idx === 0 || frame !== arr[idx - 1]);
}

function typeTransitionText(element, text, speed, delay) {
  if (!element) return;
  queueTransitionTimer(() => {
    element.classList.add('is-visible', 'is-typing');
    const frames = buildTypingFrames(text);
    let index = 0;

    const tick = () => {
      element.textContent = frames[index] || '';
      index += 1;
      if (index < frames.length) {
        queueTransitionTimer(tick, speed);
      } else {
        element.classList.remove('is-typing');
        element.classList.add('is-complete');
      }
    };

    tick();
  }, delay);
}

function startTransitionTyping() {
  resetTransitionTyping();

  const title = document.getElementById('transitionTypingTitle');
  if (title) {
    typeTransitionText(title, title.dataset.text || '', 18, 0);
  }

  const schedule = [180, 500, 820, 1140];
  document.querySelectorAll('[data-transition-line]').forEach((line, idx) => {
    typeTransitionText(line, line.dataset.text || '', 12, schedule[idx] || (180 + idx * 320));
  });
}

function beginRyeoTransition() {
  if (ryeoActivated || ryeoTransitionRunning) return;
  ryeoTransitionRunning = true;
  clearTransitionTimers();

  const transition = document.getElementById('accessTransition');
  document.body.classList.add('access-transitioning');
  transition?.classList.add('is-active', 'phase-emblem');
  transition?.classList.remove('phase-terminal', 'phase-complete');
  transition?.setAttribute('aria-hidden', 'false');

  if (searchInput) searchInput.blur();
  resetTransitionTyping();

  // 1단계: 慮 로고만 보여주기
  queueTransitionTimer(() => {
    transition?.classList.add('phase-emblem-out');
  }, 1280);

  // 2단계: 로고가 사라진 뒤 터미널 표시 + 타이핑 시작
  queueTransitionTimer(() => {
    transition?.classList.remove('phase-emblem', 'phase-emblem-out');
    transition?.classList.add('phase-terminal');
    startTransitionTyping();
  }, 1600);

  // 3단계: 모든 문구 완성 상태 유지
  queueTransitionTimer(() => {
    transition?.classList.add('phase-complete');
  }, 2900);

  // 4단계: 내부망 진입
  queueTransitionTimer(() => {
    activateRyeoMode();
    document.body.classList.add('ryeo-entering');
  }, 3800);

  queueTransitionTimer(() => {
    transition?.classList.remove('is-active', 'phase-emblem', 'phase-emblem-out', 'phase-terminal', 'phase-complete');
    transition?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('access-transitioning');
    ryeoTransitionRunning = false;
    resetTransitionTyping();
  }, 4450);

  queueTransitionTimer(() => {
    document.body.classList.remove('ryeo-entering');
  }, 4800);
}

function activateRyeoMode() {
  ryeoActivated = true;
  document.body.classList.add('ryeo-mode');
  document.title = '慮 記錄網';
  ryeoPanel.hidden = false;

  const now = new Date();
  const clock = document.getElementById('ryeoClock');
  if (clock) {
    const updateClock = () => {
      const current = new Date();
      clock.textContent = current.toLocaleTimeString('ko-KR', { hour12: false });
    };
    updateClock();
    window.ryeoClockTimer = setInterval(updateClock, 1000);
  }

  const logItems = document.querySelectorAll('#ryeoAccessLog time');
  logItems.forEach((time, index) => {
    const t = new Date(now.getTime() - (logItems.length - index - 1) * 1000);
    time.textContent = t.toLocaleTimeString('ko-KR', { hour12: false });
  });

  document.body.classList.add('ryeo-booted');
  window.setTimeout(() => document.body.classList.remove('ryeo-booted'), 1200);

  requestAnimationFrame(() => {
    document.querySelector('.ryeo-workspace')?.scrollTo({ top: 0 });
  });
}

function openPopup() {
  sitePopup.classList.add('is-open');
  sitePopup.setAttribute('aria-hidden', 'false');
}

function closePopup() {
  if (hideToday.checked) {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('ryeo_popup_hide', today);
  }
  sitePopup.classList.remove('is-open');
  sitePopup.setAttribute('aria-hidden', 'true');
}

function maybeOpenPopup() {
  const today = new Date().toISOString().slice(0, 10);
  const hiddenUntil = localStorage.getItem('ryeo_popup_hide');
  if (hiddenUntil !== today) openPopup();
}

function runSearch() {
  const value = searchInput.value.trim().replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
  if (!value) {
    searchResult.innerHTML = '<p>검색어를 입력해주세요.</p>';
    return;
  }

  if (value === '1912') {
    searchResult.innerHTML = '<p class="search-anomaly"><strong>검색 결과 1건</strong><br />AR-1912-000 / 제목 없음 / 상태: 비공개</p>';
    registerSequence('search1912');
  } else if (value.toLowerCase() === ':|') {
    searchResult.innerHTML = '<p>기록은 이름과 표식으로 시작하고 끝난다.</p>';
  } else {
    const hits = publicRecords.filter(r => [r.id, r.title, r.region].join(' ').includes(value));
    if (hits.length) {
      searchResult.innerHTML = hits.map(hit => `<p>${hit.id} / ${hit.title} / ${hit.region}</p>`).join('');
    } else {
      searchResult.innerHTML = '<p>검색 결과가 없습니다.</p>';
    }
  }
}

renderRecords(publicRecords);
renderNoticeList();
maybeOpenPopup();

searchToggle.addEventListener('click', () => {
  searchPanel.hidden = !searchPanel.hidden;
  if (!searchPanel.hidden) searchInput.focus();
});
searchClose.addEventListener('click', () => searchPanel.hidden = true);
searchSubmit.addEventListener('click', runSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSearch();
});
menuToggle.addEventListener('click', () => mobileMenu.hidden = false);
mobileMenuClose.addEventListener('click', () => mobileMenu.hidden = true);
mobileMenuX.addEventListener('click', () => mobileMenu.hidden = true);

document.querySelectorAll('[data-close-popup]').forEach(el => el.addEventListener('click', closePopup));
document.querySelector('[data-confirm-popup]').addEventListener('click', closePopup);

document.querySelectorAll('.nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const target = document.getElementById(action);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (action === 'intro') registerSequence('intro');
  });
});

// 모바일 메뉴도 PC 상단 메뉴와 동일한 비밀 진입 순서를 사용한다.
document.querySelectorAll('#mobileMenu a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);

    if (target) {
      event.preventDefault();
      mobileMenu.hidden = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (targetId === 'intro') {
      registerSequence('intro');
    }
  });
});

document.getElementById('secretYearBtn').addEventListener('click', () => {
  registerSequence('year1912');
  searchPanel.hidden = false;
  searchInput.focus();
  searchResult.innerHTML = '<p>연혁 자료가 검색창으로 이관되었습니다. 숫자만 입력해 확인하십시오.</p>';
});

document.getElementById('hiddenMark').addEventListener('click', (event) => {
  event.preventDefault();
  registerSequence('mark');
  rollingNotice.textContent = '기록은 이름과 표식으로 시작하고 끝난다.';
});

document.addEventListener('click', (e) => {
  const noticeBtn = e.target.closest('.notice-item');
  if (noticeBtn) {
    const idx = Number(noticeBtn.dataset.noticeIndex);
    const title = notices[idx][0];
    if (title === '제목 없음') {
      searchPanel.hidden = false;
      searchInput.value = '1912';
      searchResult.innerHTML = '<p>열람 기록을 확인했습니다. “1912”를 검색하여 계속 진행할 수 있습니다.</p>';
    } else {
      searchResult.innerHTML = `<p>선택한 공지: ${title}</p>`;
    }
  }
});

toggleRecordMode.addEventListener('click', () => {
  renderRecords(ryeoActivated ? ryeoRecords : publicRecords);
});


// 慮 내부 기록망 메뉴
document.querySelectorAll('[data-ryeo-view]').forEach((button) => {
  button.addEventListener('click', () => {
    const viewName = button.dataset.ryeoView;
    document.querySelectorAll('[data-ryeo-view]').forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });
    document.querySelectorAll('.ryeo-view').forEach((view) => {
      view.classList.toggle('is-visible', view.dataset.view === viewName);
    });

    const titleMap = {
      dashboard: '종합 현황',
      records: '사건 기록',
      triad: '삼직 보고',
      anomaly: '괴이 분류',
      recovery: '회수 관리',
      forbidden: '禁錄',
      scripture: '慮經',
      keeper: '기록관'
    };

    const title = document.getElementById('ryeoViewTitle');
    if (title) title.textContent = titleMap[viewName] || '내부 기록망';

    document.querySelector('.ryeo-workspace')?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

document.querySelectorAll('[data-open-view]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(
      `[data-ryeo-view="${button.dataset.openView}"]`
    );
    target?.click();
  });
});

document.getElementById('exitRyeoMode')?.addEventListener('click', () => {
  ryeoActivated = false;
  clearTransitionTimers();
  resetTransitionTyping();
  document.getElementById('accessTransition')?.classList.remove('is-active', 'phase-emblem', 'phase-emblem-out', 'phase-terminal', 'phase-complete');
  document.getElementById('accessTransition')?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ryeo-mode', 'ryeo-entering', 'access-transitioning', 'ryeo-booted');
  document.title = '생활환경기록보존원 | LEAF';
  ryeoPanel.hidden = true;
  clearInterval(window.ryeoClockTimer);
  triggerStep = 0;
  searchPanel.hidden = true;
  searchInput.value = '';
  searchResult.innerHTML = '';
});


// 실제 D1 기록 게시판 + 연도별 색인
const dynamicRecordState = { records: [], selectedYear: 'all', selectedStatus: 'all', sort: 'newest', search: '' };
const ARCHIVE_INDEX = window.RYEO_ARCHIVE_INDEX || { startYear: 1912, currentYear: 2026, pre1912:{total:1473}, counts:{} };
function escapeRecordHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function riskTagClass(value) {
  return ({'기록 오염':'tag--orange','접근 제한':'tag--blue','인명 위험':'tag--red','평가 불가':'tag--gray'})[value] || 'tag--gray';
}
function statusDotClass(value) {
  return ({'회수 완료':'status-dot--green','분석 중':'status-dot--yellow','회수 대기':'status-dot--orange','관찰 중':'status-dot--blue','격리 유지':'status-dot--violet','열람 금지':'status-dot--red','회수 기록 없음':'status-dot--gray'})[value] || 'status-dot--gray';
}
function paintTriadStatusCounts({ active = 0, unresolved = 0, containment = 0 } = {}) {
  const activeEl = document.getElementById('triadActiveCount');
  const unresolvedEl = document.getElementById('triadUnresolvedCount');
  const containmentEl = document.getElementById('triadContainmentCount');
  if (activeEl) activeEl.textContent = `활성 보고 ${Number(active) || 0}건`;
  if (unresolvedEl) unresolvedEl.textContent = `미해명 ${Number(unresolved) || 0}건`;
  if (containmentEl) containmentEl.textContent = `격리 유지 ${Number(containment) || 0}건`;
}

function updateTriadStatusCountsFromRecords(records) {
  const publicRecords = Array.isArray(records) ? records : [];
  paintTriadStatusCounts({
    active: publicRecords.filter(record => ['관찰 중', '분석 중', '회수 대기'].includes(record.status)).length,
    unresolved: publicRecords.filter(record => record.status === '회수 기록 없음').length,
    containment: publicRecords.filter(record => record.status === '격리 유지').length,
  });
}

async function loadTriadStatusCounts() {
  try {
    const response = await fetch(`/api/records/stats?_=${Date.now()}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '삼직 보고 통계 오류');
    paintTriadStatusCounts(data);
    return true;
  } catch (error) {
    console.warn('D1 삼직 보고 통계 집계 실패. 목록 기반 집계로 대체합니다.', error);
    return false;
  }
}

function recordYear(record) {
  const match = String(record?.record_no || '').match(/RY-(\d{4})-/i);
  return match ? Number(match[1]) : null;
}
function archiveCount(year) { return Number(ARCHIVE_INDEX.counts?.[String(year)] || 0); }
function buildYearOptions(select) {
  if (!select) return;
  const options = ['<option value="all">전체 연도</option>'];
  for (let year = ARCHIVE_INDEX.currentYear; year >= ARCHIVE_INDEX.startYear; year -= 1) {
    options.push(`<option value="${year}">${year}년 · 색인 ${archiveCount(year)}건</option>`);
  }
  options.push(`<option value="pre1912">1912년 이전 · 열람 금지 · ${ARCHIVE_INDEX.pre1912.total.toLocaleString()}건</option>`);
  select.innerHTML = options.join('');
}
function recordSequence(record) {
  const match = String(record?.record_no || '').match(/RY-(\d{4})-(\d+)/i);
  return match ? Number(match[2]) : -1;
}
function compareRecordNumbers(a, b, direction = 'newest') {
  const yearDiff = (recordYear(a) ?? -1) - (recordYear(b) ?? -1);
  const sequenceDiff = recordSequence(a) - recordSequence(b);
  const idDiff = String(a.record_no || '').localeCompare(String(b.record_no || ''), 'ko', { numeric: true });
  const result = yearDiff || sequenceDiff || idDiff;
  return direction === 'oldest' ? result : -result;
}
function filteredPublicRecords() {
  const query = dynamicRecordState.search.trim().toLowerCase();
  return dynamicRecordState.records.filter(record => {
    const year = recordYear(record);
    const yearMatch = dynamicRecordState.selectedYear === 'all' || (dynamicRecordState.selectedYear !== 'pre1912' && year === Number(dynamicRecordState.selectedYear));
    const statusMatch = dynamicRecordState.selectedStatus === 'all' || record.status === dynamicRecordState.selectedStatus;
    const queryMatch = !query || `${record.record_no} ${record.title} ${record.region} ${record.record_type} ${record.status}`.toLowerCase().includes(query);
    return yearMatch && statusMatch && queryMatch;
  }).sort((a, b) => compareRecordNumbers(a, b, dynamicRecordState.sort));
}
function updatePublicYearSummary() {
  const box = document.getElementById('publicYearSummary');
  if (!box) return;
  const selected = dynamicRecordState.selectedYear;
  if (selected === 'pre1912') {
    const p = ARCHIVE_INDEX.pre1912;
    box.className = 'ryeo-year-summary is-locked';
    box.innerHTML = `<div class="year-lock-mark">封</div><div><span>PRE-1912 ARCHIVE</span><h3>1912년 이전 기록은 현 계통에서 열람할 수 없습니다.</h3><p>통합 색인 <b>${p.total.toLocaleString()}건</b> · 원본 소재 확인 ${p.originalLocated}건 · 부분 소실 ${p.partialLoss}건 · 보관 위치 미확인 ${p.locationUnknown}건 · 기록관 제한 ${p.keeperRestricted}건</p></div>`;
    return;
  }
  const actual = filteredPublicRecords().length;
  const count = selected === 'all' ? ARCHIVE_INDEX.accessibleTotal : archiveCount(Number(selected));
  const title = selected === 'all' ? '1912–2026 통합 색인' : `${selected}년 기록 색인`;
  box.className = 'ryeo-year-summary';
  box.innerHTML = `<div><span>ARCHIVE INDEX</span><h3>${title}</h3></div><div class="year-summary-numbers"><strong>${Number(count).toLocaleString()}건</strong><small>현재 공개 열람 ${actual}건</small></div>`;
}
function renderPublicRecordDirectory() {
  const tbody = document.querySelector('.ryeo-view[data-view="records"] .ryeo-table tbody');
  if (!tbody) return;
  if (dynamicRecordState.selectedYear === 'pre1912') {
    tbody.innerHTML = '<tr class="record-loading-row"><td colspan="6">1912년 이전 기록은 기록관 승인 없이 열람할 수 없습니다.</td></tr>';
    updatePublicYearSummary();
    return;
  }
  const records = filteredPublicRecords();
  tbody.innerHTML = records.map(r => `<tr data-record-id="${r.id}"><td>${escapeRecordHtml(r.record_no)}</td><td>${escapeRecordHtml(r.title)}</td><td>${escapeRecordHtml(r.region)}</td><td>${escapeRecordHtml(r.assigned_to || '-')}</td><td>${escapeRecordHtml(r.record_type)}</td><td><span class="status-dot ${statusDotClass(r.status)}">${escapeRecordHtml(r.status)}</span></td></tr>`).join('') || '<tr class="record-loading-row"><td colspan="6">해당 연도에는 현재 공개된 상세 기록이 없습니다. 색인 정보만 보존되어 있습니다.</td></tr>';
  tbody.querySelectorAll('tr[data-record-id]').forEach(row => row.addEventListener('click', () => openDynamicRecord(row.dataset.recordId)));
  updatePublicYearSummary();
}
function bindPublicArchiveControls() {
  const yearSelect = document.getElementById('publicRecordYear');
  const statusSelect = document.getElementById('publicRecordStatus');
  const sortSelect = document.getElementById('publicRecordSort');
  const search = document.getElementById('publicRecordSearch');
  const button = document.getElementById('publicRecordSearchBtn');
  buildYearOptions(yearSelect);
  if (yearSelect && !yearSelect.dataset.bound) {
    yearSelect.dataset.bound = '1';
    yearSelect.addEventListener('change', () => { dynamicRecordState.selectedYear = yearSelect.value; renderPublicRecordDirectory(); });
  }
  if (statusSelect && !statusSelect.dataset.bound) {
    statusSelect.dataset.bound = '1';
    statusSelect.addEventListener('change', () => { dynamicRecordState.selectedStatus = statusSelect.value; renderPublicRecordDirectory(); });
  }
  if (sortSelect && !sortSelect.dataset.bound) {
    sortSelect.dataset.bound = '1';
    sortSelect.addEventListener('change', () => { dynamicRecordState.sort = sortSelect.value; renderPublicRecordDirectory(); });
  }
  const runSearch = () => { dynamicRecordState.search = search?.value || ''; renderPublicRecordDirectory(); };
  if (button && !button.dataset.bound) { button.dataset.bound='1'; button.addEventListener('click', runSearch); }
  if (search && !search.dataset.bound) { search.dataset.bound='1'; search.addEventListener('keydown', event => { if (event.key === 'Enter') runSearch(); }); }
}
async function loadDynamicRyeoRecords() {
  const tbody = document.querySelector('.ryeo-view[data-view="records"] .ryeo-table tbody');
  const dashBody = document.querySelector('.ryeo-view[data-view="dashboard"] .ryeo-table tbody');
  bindPublicArchiveControls();
  if (tbody) tbody.innerHTML = '<tr class="record-loading-row"><td colspan="6">기록망에서 자료를 불러오는 중…</td></tr>';
  try {
    const response = await fetch(`/api/records?limit=500&_=${Date.now()}`, { headers: { accept: 'application/json' }, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '기록 목록 오류');
    dynamicRecordState.records = (data.records || []).slice().sort((a, b) => compareRecordNumbers(a, b, 'newest'));

    // 목록 API가 D1에서 같은 시점에 계산한 통계를 최우선으로 사용합니다.
    // 별도 stats 경로의 배포/라우팅 문제 때문에 숫자가 고정되는 일을 막습니다.
    if (data.stats && typeof data.stats === 'object') {
      paintTriadStatusCounts(data.stats);
    } else {
      const statsLoaded = await loadTriadStatusCounts();
      if (!statsLoaded) updateTriadStatusCountsFromRecords(dynamicRecordState.records);
    }

    renderPublicRecordDirectory();
    if (dashBody) {
      dashBody.innerHTML = dynamicRecordState.records.slice(0,4).map(r => `<tr data-record-id="${r.id}"><td>${escapeRecordHtml(r.record_no)}</td><td>${escapeRecordHtml(r.title)}</td><td>${escapeRecordHtml(r.record_type)}</td><td><span class="tag ${riskTagClass(r.risk_level)}">${escapeRecordHtml(r.risk_level)}</span></td><td><span class="status-dot ${statusDotClass(r.status)}">${escapeRecordHtml(r.status)}</span></td></tr>`).join('') || '<tr class="record-loading-row"><td colspan="5">공개된 사건 기록이 없습니다.</td></tr>';
      dashBody.querySelectorAll('tr[data-record-id]').forEach(row => row.addEventListener('click', () => openDynamicRecord(row.dataset.recordId)));
    }
  } catch (error) {
    if (tbody) tbody.innerHTML = `<tr class="record-loading-row"><td colspan="6">${escapeRecordHtml(error.message)} — D1 연결 설정을 확인하십시오.</td></tr>`;
    const activeEl = document.getElementById('triadActiveCount');
    const unresolvedEl = document.getElementById('triadUnresolvedCount');
    const containmentEl = document.getElementById('triadContainmentCount');
    if (activeEl) activeEl.textContent = '활성 보고 연결 오류';
    if (unresolvedEl) unresolvedEl.textContent = '미해명 연결 오류';
    if (containmentEl) containmentEl.textContent = '격리 유지 연결 오류';
  }
}
async function openDynamicRecord(id) {
  const modal = document.getElementById('recordModal');
  modal.hidden = false; document.body.style.overflow = 'hidden';
  document.getElementById('recordModalNo').textContent = 'RECORD ACCESS';
  document.getElementById('recordModalTitle').textContent = '기록을 불러오는 중…';
  document.getElementById('recordModalMeta').innerHTML = ''; document.getElementById('recordModalSummary').textContent = ''; document.getElementById('recordModalContent').textContent = '';
  try {
    const response = await fetch(`/api/records/${encodeURIComponent(id)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || '기록을 열 수 없습니다.'); const r=data.record;
    document.getElementById('recordModalNo').textContent = r.record_no; document.getElementById('recordModalTitle').textContent = r.title;
    document.getElementById('recordModalMeta').innerHTML = [r.region,r.record_type,r.risk_level,r.status,r.assigned_to].filter(Boolean).map(v=>`<span>${escapeRecordHtml(v)}</span>`).join('');
    document.getElementById('recordModalSummary').textContent = r.summary || '요약 없음'; document.getElementById('recordModalContent').textContent = r.content || '공개된 본문이 없습니다.';
  } catch(error) { document.getElementById('recordModalTitle').textContent='열람 실패'; document.getElementById('recordModalContent').textContent=error.message; }
}
document.querySelectorAll('[data-record-close]').forEach(el => el.addEventListener('click',()=>{document.getElementById('recordModal').hidden=true;document.body.style.overflow='';}));
const originalActivateRyeoModeDynamic = activateRyeoMode;
activateRyeoMode = function(){ originalActivateRyeoModeDynamic(); loadDynamicRyeoRecords(); };
