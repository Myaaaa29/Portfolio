const folderNames = {
  activities: 'Activities',
  quizzes: 'Quizzes',
  projects: 'Projects',
  laboratory: 'Laboratory work'
};

const state = {
  activeFolder: 'activities',
  files: JSON.parse(localStorage.getItem('sandraPortfolioFiles') || '{}')
};

Object.keys(folderNames).forEach((folder) => {
  if (!Array.isArray(state.files[folder])) state.files[folder] = [];
});

const fileInput = document.querySelector('#file-input');
const fileList = document.querySelector('#file-list');
const dropZone = document.querySelector('#drop-zone');
const folderTitle = document.querySelector('#current-folder-title');
const dropFolderName = document.querySelector('#drop-folder-name');
const fileCountLabel = document.querySelector('#file-count-label');

function saveFiles() {
  localStorage.setItem('sandraPortfolioFiles', JSON.stringify(state.files));
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileType(name) {
  const extension = name.split('.').pop().toLowerCase();
  return extension.length > 4 ? 'file' : extension;
}

function render() {
  const folder = state.activeFolder;
  const currentFiles = state.files[folder];
  const displayName = folderNames[folder];
  folderTitle.textContent = displayName;
  dropFolderName.textContent = displayName;
  fileCountLabel.textContent = `${currentFiles.length} ${currentFiles.length === 1 ? 'file' : 'files'}`;

  document.querySelectorAll('[data-count]').forEach((counter) => {
    counter.textContent = state.files[counter.dataset.count].length;
  });
  document.querySelectorAll('.folder-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.folder === folder);
  });

  if (!currentFiles.length) {
    fileList.innerHTML = '<div class="empty-state">Nothing here yet. Add your first learning output.</div>';
    return;
  }

  fileList.innerHTML = currentFiles.map((file, index) => `
    <div class="file-row">
      <div class="file-type">${fileType(file.name)}</div>
      <div class="file-details"><a class="file-link" href="${file.content}" target="_blank" rel="noopener" title="Open ${file.name}">${file.name}</a><span>${formatBytes(file.size)} · Added ${file.added}</span></div>
      <div class="file-actions"><button class="file-action" data-remove="${index}">Remove</button></div>
    </div>
  `).join('');
}

function addFiles(fileCollection) {
  [...fileCollection].forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      state.files[state.activeFolder].push({
        name: file.name,
        size: file.size,
        type: file.type,
        content: reader.result,
        added: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
      saveFiles();
      render();
    };
    reader.readAsDataURL(file);
  });
}

document.querySelectorAll('.folder-button').forEach((button) => {
  button.addEventListener('click', () => {
    state.activeFolder = button.dataset.folder;
    render();
  });
});

fileInput.addEventListener('change', (event) => {
  addFiles(event.target.files);
  event.target.value = '';
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  addFiles(event.dataTransfer.files);
});

fileList.addEventListener('click', (event) => {
  const removeIndex = event.target.dataset.remove;
  if (removeIndex !== undefined) {
    state.files[state.activeFolder].splice(removeIndex, 1);
    saveFiles();
    render();
  }
});

render();