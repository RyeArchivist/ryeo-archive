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

function beginRyeoTransition() {
  if (ryeoActivated || ryeoTransitionRunning) return;
  ryeoTransitionRunning = true;

  const transition = document.getElementById('accessTransition');
  document.body.classList.add('access-transitioning');
  transition?.classList.add('is-active');
  transition?.setAttribute('aria-hidden', 'false');

  if (searchInput) searchInput.blur();

  window.setTimeout(() => {
    activateRyeoMode();
    document.body.classList.add('ryeo-entering');
  }, 4100);

  window.setTimeout(() => {
    transition?.classList.remove('is-active');
    transition?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('access-transitioning');
    ryeoTransitionRunning = false;
  }, 4680);

  window.setTimeout(() => {
    document.body.classList.remove('ryeo-entering');
  }, 5050);
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
  const value = searchInput.value.trim();
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

document.getElementById('secretYearBtn').addEventListener('click', () => {
  registerSequence('year1912');
  searchPanel.hidden = false;
  searchInput.focus();
  searchResult.innerHTML = '<p>연혁 자료가 검색창으로 이관되었습니다. 숫자만 입력해 확인하십시오.</p>';
});

document.getElementById('hiddenMark').addEventListener('click', () => {
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
  document.body.classList.remove('ryeo-mode', 'ryeo-entering', 'access-transitioning');
  document.title = '생활환경기록보존원 | LEAF';
  ryeoPanel.hidden = true;
  clearInterval(window.ryeoClockTimer);
  triggerStep = 0;
  searchPanel.hidden = true;
  searchInput.value = '';
  searchResult.innerHTML = '';
});
