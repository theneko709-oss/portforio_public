const editor = document.getElementById('editorArea');
const pageSelect = document.getElementById('pageSelect');
const addBtn = document.querySelector('.add-btn');
const clearBtn = document.querySelector('.clear-btn');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchCount = document.getElementById('searchCount');
const searchResults = document.getElementById('searchResults');

let currentPage = '';
let selectedSearchIndex = -1;

function getPages() {
  let pages = JSON.parse(localStorage.getItem('pages'));
  if (!pages || !Array.isArray(pages.list)) {
    pages = { list: ['page-1'], titles: { 'page-1': '無題' } };
    localStorage.setItem('page-1', '');
    localStorage.setItem('pages', JSON.stringify(pages));
  }
  return pages;
}

function savePages(pages) {
  localStorage.setItem('pages', JSON.stringify(pages));
}

function updatePageSelectFiltered(pages, filteredList) {
  pageSelect.innerHTML = '';
  if (filteredList.length === 0) {
    const option = document.createElement('option');
    option.textContent = '一致するページがありません';
    option.disabled = true;
    pageSelect.appendChild(option);
    editor.value = '';
    editor.setAttribute('readonly', true);
    return;
  }
  editor.removeAttribute('readonly');
  filteredList.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = pages.titles[id] || '無題';
    if (id === currentPage) option.selected = true;
    pageSelect.appendChild(option);
  });
  if (!filteredList.includes(currentPage)) {
    currentPage = filteredList[0];
    pageSelect.value = currentPage;
  }
}

function updatePageSelect(pages) {
  updatePageSelectFiltered(pages, pages.list);
}

function saveCurrentContent() {
  if (!currentPage) return;
  localStorage.setItem(currentPage, editor.value);
  const firstLine = editor.value.trim().split('\n')[0] || '無題';
  const pages = getPages();
  pages.titles[currentPage] = firstLine.slice(0, 30);
  savePages(pages);
  for (let option of pageSelect.options) {
    if (option.value === currentPage) {
      option.textContent = pages.titles[currentPage];
      break;
    }
  }
}

function loadCurrentContent() {
  editor.value = localStorage.getItem(currentPage) || '';
  editor.removeAttribute('readonly');
  editor.focus();
}

function openPage(id) {
  currentPage = id;
  loadCurrentContent();
  clearSearchResults();
  searchInput.value = '';
  updatePageSelect(getPages());
}

function renderSearchResults(results, pages) {
  searchResults.innerHTML = '';
  if (results.length === 0) {
    searchResults.style.display = 'none';
    searchCount.textContent = '一致するページがありません。';
    selectedSearchIndex = -1;
    return;
  }
  searchCount.textContent = `${results.length}件見つかりました。`;
  searchResults.style.display = 'block';
  results.forEach((id, index) => {
    const div = document.createElement('div');
    div.className = 'search-result';
    div.textContent = pages.titles[id] || '無題';
    div.setAttribute('data-id', id);
    if (index === 0) {
      div.classList.add('selected');
      selectedSearchIndex = 0;
    }
    div.addEventListener('click', () => openPage(id));
    searchResults.appendChild(div);
  });
}

function clearSearchResults() {
  searchResults.innerHTML = '';
  searchResults.style.display = 'none';
  searchCount.textContent = '';
  selectedSearchIndex = -1;
}

function performSearch() {
  const keyword = searchInput.value.trim().toLowerCase();
  const pages = getPages();
  if (!keyword) {
    updatePageSelect(pages);
    clearSearchResults();
    return;
  }
  const filteredPages = pages.list.filter(id => {
    const title = (pages.titles[id] || '').toLowerCase();
    const content = (localStorage.getItem(id) || '').toLowerCase();
    return title.includes(keyword) || content.includes(keyword);
  });
  updatePageSelectFiltered(pages, filteredPages);
  renderSearchResults(filteredPages, pages);
}

function updateSearchSelection(newIndex) {
  if (selectedSearchIndex >= 0 && searchResults.children[selectedSearchIndex]) {
    searchResults.children[selectedSearchIndex].classList.remove('selected');
  }
  selectedSearchIndex = newIndex;
  if (searchResults.children[selectedSearchIndex]) {
    searchResults.children[selectedSearchIndex].classList.add('selected');
    searchResults.children[selectedSearchIndex].scrollIntoView({ block: 'nearest' });
  }
}

addBtn.addEventListener('click', () => {
  saveCurrentContent();
  const pages = getPages();
  let maxNum = Math.max(...pages.list.map(id => parseInt(id.split('-')[1] || '0')));
  const newPageId = `page-${maxNum + 1}`;
  pages.list.push(newPageId);
  pages.titles[newPageId] = '無題';
  localStorage.setItem(newPageId, '');
  savePages(pages);
  currentPage = newPageId;
  updatePageSelect(pages);
  loadCurrentContent();
  clearSearchResults();
  searchInput.value = '';
});

clearBtn.addEventListener('click', () => {
  if (!confirm('このページを削除しますか？')) return;
  localStorage.removeItem(currentPage);
  const pages = getPages();
  pages.list = pages.list.filter(id => id !== currentPage);
  delete pages.titles[currentPage];
  if (pages.list.length === 0) {
    const newPageId = 'page-1';
    pages.list.push(newPageId);
    pages.titles[newPageId] = '無題';
    localStorage.setItem(newPageId, '');
    currentPage = newPageId;
  } else {
    currentPage = pages.list[0];
  }
  savePages(pages);
  updatePageSelect(pages);
  loadCurrentContent();
  clearSearchResults();
  searchInput.value = '';
});

pageSelect.addEventListener('change', () => {
  saveCurrentContent();
  currentPage = pageSelect.value;
  loadCurrentContent();
  clearSearchResults();
  searchInput.value = '';
});

editor.addEventListener('input', () => {
  saveCurrentContent();
});

searchButton.addEventListener('click', () => {
  performSearch();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedSearchIndex >= 0 && searchResults.children[selectedSearchIndex]) {
      const selectedDiv = searchResults.children[selectedSearchIndex];
      const id = selectedDiv.getAttribute('data-id');
      if (id) openPage(id);
    } else {
      performSearch();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (selectedSearchIndex < searchResults.children.length - 1) {
      updateSearchSelection(selectedSearchIndex + 1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedSearchIndex > 0) {
      updateSearchSelection(selectedSearchIndex - 1);
    }
  }
});

(function init() {
  const pages = getPages();
  currentPage = pages.list[0];
  updatePageSelect(pages);
  loadCurrentContent();
  clearSearchResults();
})();
