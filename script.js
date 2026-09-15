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
const filePreviewModal = document.querySelector('#file-preview-modal');
const filePreviewTitle = document.querySelector('#file-preview-title');
const filePreviewContent = document.querySelector('#file-preview-content');
const fileModalClose = document.querySelector('#file-modal-close');

function saveFiles() {
  localStorage.setItem('sandraPortfolioFiles', JSON.stringify(state.files));
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileType(name) {
  const extension = getFileExtension(name);
  return extension.length > 4 ? 'file' : extension;
}

function getFileExtension(name) {
  const cleanName = String(name || '').split(/[?#]/)[0];
  const lastDot = cleanName.lastIndexOf('.');
  return lastDot > -1 ? cleanName.slice(lastDot + 1).toLowerCase() : '';
}

function createFileElement(file, index) {
  const row = document.createElement('div');
  row.className = 'file-row';

  const type = document.createElement('div');
  type.className = 'file-type';
  type.textContent = fileType(file.name);

  const details = document.createElement('div');
  details.className = 'file-details';
  const name = document.createElement('strong');
  name.title = file.name;
  name.textContent = file.name;
  const metadata = document.createElement('span');
  metadata.textContent = `${formatBytes(file.size)} · Added ${file.added}`;
  details.append(name, metadata);

  const actions = document.createElement('div');
  actions.className = 'file-actions';
  const viewButton = document.createElement('button');
  viewButton.className = 'file-action';
  viewButton.type = 'button';
  viewButton.dataset.view = index;
  viewButton.textContent = 'View';
  const removeButton = document.createElement('button');
  removeButton.className = 'file-action';
  removeButton.type = 'button';
  removeButton.dataset.remove = index;
  removeButton.textContent = 'Remove';
  actions.append(viewButton, removeButton);

  row.append(type, details, actions);
  return row;
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

  fileList.replaceChildren(...currentFiles.map(createFileElement));
}

function closeModal() {
  filePreviewContent.replaceChildren();
  filePreviewModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function openModal(file) {
  closeModal();
  if (!file || typeof file.content !== 'string' || !file.content) {
    filePreviewTitle.textContent = 'Preview unavailable';
    const message = document.createElement('p');
    message.textContent = 'This file has no valid content to preview.';
    filePreviewContent.append(message);
    filePreviewModal.hidden = false;
    document.body.classList.add('modal-open');
    return;
  }

  filePreviewTitle.textContent = file.name || 'File preview';
  const extension = getFileExtension(file.name);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);

  if (isImage) {
    const image = document.createElement('img');
    image.src = file.content;
    image.alt = file.name || 'Selected file';
    image.addEventListener('error', closeModal, { once: true });
    filePreviewContent.append(image);
  } else if (extension === 'pdf') {
    const frame = document.createElement('iframe');
    frame.src = file.content;
    frame.title = file.name || 'PDF preview';
    filePreviewContent.append(frame);
  } else {
    const message = document.createElement('p');
    message.textContent = 'Preview not available for this file type.';
    const download = document.createElement('a');
    download.className = 'button button-dark file-download';
    download.href = file.content;
    download.download = file.name || 'download';
    download.textContent = 'Download file';
    filePreviewContent.append(message, download);
  }

  filePreviewModal.hidden = false;
  document.body.classList.add('modal-open');
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
  const viewIndex = event.target.dataset.view;
  const removeIndex = event.target.dataset.remove;
  if (viewIndex !== undefined) {
    const file = state.files[state.activeFolder][viewIndex];
    openModal(file);
  }
  if (removeIndex !== undefined) {
    state.files[state.activeFolder].splice(removeIndex, 1);
    saveFiles();
    render();
  }
});

fileModalClose.addEventListener('click', closeModal);
filePreviewModal.addEventListener('click', (event) => {
  if (event.target === filePreviewModal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !filePreviewModal.hidden) closeModal();
});

render();