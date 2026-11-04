'use strict';

const state = {
  config: null,
  selectedImage: null,
  uploadedImage: null,
  answers: {},
  background: localStorage.getItem('yishan-background') || 'pink-plum'
};

const elements = {
  preview: document.querySelector('#image-preview'),
  empty: document.querySelector('#image-empty'),
  upload: document.querySelector('#image-upload'),
  clearImage: document.querySelector('#clear-image'),
  presetList: document.querySelector('#preset-list'),
  fields: document.querySelector('#fields-container'),
  picker: document.querySelector('#background-picker'),
  submit: document.querySelector('#submit-button'),
  status: document.querySelector('#image-status'),
  toast: document.querySelector('#toast'),
  title: document.querySelector('h1'),
  description: document.querySelector('#page-description')
};

function showToast(message, duration = 2800) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove('visible'), duration);
}

function safeText(value) {
  const span = document.createElement('span');
  span.textContent = value ?? '';
  return span.innerHTML;
}

function renderPresets() {
  elements.presetList.innerHTML = state.config.images.map((image) => `
    <button class="preset-button ${state.selectedImage?.id === image.id ? 'selected' : ''}" type="button" data-image-id="${safeText(image.id)}" aria-label="选择预设图片 ${safeText(image.label)}">
      <img src="${safeText(image.url)}" alt="${safeText(image.label)}">
      <span>${safeText(image.label)}</span>
    </button>
  `).join('');
}

function selectPreset(image) {
  state.selectedImage = { ...image, kind: 'preset' };
  state.uploadedImage = null;
  elements.preview.src = image.url;
  elements.preview.classList.add('visible');
  elements.empty.classList.add('hidden');
  elements.status.textContent = image.label;
  renderPresets();
}

function clearImage() {
  state.selectedImage = null;
  state.uploadedImage = null;
  elements.preview.removeAttribute('src');
  elements.preview.classList.remove('visible');
  elements.empty.classList.remove('hidden');
  elements.status.textContent = '尚未选择';
  renderPresets();
}

async function uploadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('请选择图片文件');
    return;
  }

  elements.status.textContent = '正在上传…';
  const previewUrl = URL.createObjectURL(file);
  elements.preview.src = previewUrl;
  elements.preview.classList.add('visible');
  elements.empty.classList.add('hidden');

  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!response.ok) {
    elements.status.textContent = '上传失败';
    showToast('图片上传失败，请重试');
    return;
  }

  const uploaded = await response.json();
  state.uploadedImage = { ...uploaded, label: file.name, kind: 'upload' };
  state.selectedImage = state.uploadedImage;
  elements.preview.src = uploaded.url;
  elements.status.textContent = file.name;
  renderPresets();
  showToast('图片上传成功');
}

function renderText(field) {
  const required = field.required ? '<span class="required-mark">*</span>' : '';
  return `
    <div class="field-block" data-field-id="${safeText(field.id)}">
      <div class="field-label-row">
        <label for="field-${safeText(field.id)}">${safeText(field.label)}${required}</label>
        <span class="field-hint">${field.required ? '必填' : '选填'}${field.maxLength ? ` · 最多 ${field.maxLength} 字` : ''}</span>
      </div>
      <textarea
        class="text-input"
        id="field-${safeText(field.id)}"
        data-field-type="text"
        maxlength="${Number(field.maxLength) || 500}"
        placeholder="${safeText(field.placeholder || '写下你想说的话')}"
        aria-label="${safeText(field.label)}"
      ></textarea>
    </div>
  `;
}

function renderChoice(field) {
  const required = field.required ? '<span class="required-mark">*</span>' : '';
  return `
    <div class="field-block" data-field-id="${safeText(field.id)}">
      <div class="field-label-row">
        <span class="field-label">${safeText(field.label)}${required}</span>
        <span class="field-hint">${field.selection === 'multiple' ? '可多选' : '单选'} · ${field.required ? '必填' : '选填'}</span>
      </div>
      <div class="choice-grid" role="${field.selection === 'multiple' ? 'group' : 'radiogroup'}" aria-label="${safeText(field.label)}">
        ${(field.options || []).map((option) => `
          <button
            class="choice-option"
            type="button"
            data-field-id="${safeText(field.id)}"
            data-option-id="${safeText(option.id)}"
            data-selection="${safeText(field.selection)}"
            role="${field.selection === 'multiple' ? 'checkbox' : 'radio'}"
            aria-checked="false"
          >${safeText(option.label)}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFields() {
  elements.fields.innerHTML = state.config.fields.map((field) => {
    if (field.type === 'text') return renderText(field);
    if (field.type === 'choice') return renderChoice(field);
    return '';
  }).join('');
}

function renderBackgroundPicker() {
  const themes = window.YishanBackgrounds.THEMES;
  elements.picker.innerHTML = Object.entries(themes).map(([key, theme]) => `
    <button class="background-option ${state.background === key ? 'selected' : ''}" type="button" data-theme="${key}" aria-pressed="${state.background === key}">
      <span class="background-swatch" style="background: linear-gradient(120deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})"></span>
      <strong>${safeText(theme.label)}</strong>
      <small>${key === 'pink-plum' ? '梅花缓缓飘落' : '液态玻璃流动'}</small>
    </button>
  `).join('');
}

function collectAnswers() {
  const answers = {};
  state.config.fields.forEach((field) => {
    if (field.type === 'text') {
      const input = document.querySelector(`#field-${CSS.escape(field.id)}`);
      answers[field.id] = input ? input.value.trim() : '';
    } else if (field.type === 'choice') {
      const selected = [...document.querySelectorAll(`.choice-option[data-field-id="${CSS.escape(field.id)}"].selected`)];
      const values = selected.map((button) => button.dataset.optionId);
      answers[field.id] = field.selection === 'multiple' ? values : (values[0] || '');
    }
  });
  return answers;
}

function renderParticipant() {
  elements.title.textContent = state.config.title;
  elements.description.textContent = state.config.description;
  renderPresets();
  renderFields();
  renderBackgroundPicker();

  if (state.config.images[0]) {
    selectPreset(state.config.images[0]);
  }
}

async function loadConfig() {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('无法读取页面配置');
  state.config = await response.json();
  renderParticipant();
}

function bindEvents() {
  elements.upload.addEventListener('change', (event) => {
    uploadFile(event.target.files[0]);
    event.target.value = '';
  });

  elements.clearImage.addEventListener('click', clearImage);

  const imageStage = document.querySelector('.image-stage');
  imageStage.addEventListener('dragover', (event) => {
    event.preventDefault();
    imageStage.classList.add('dragging');
  });
  imageStage.addEventListener('dragleave', () => imageStage.classList.remove('dragging'));
  imageStage.addEventListener('drop', (event) => {
    event.preventDefault();
    imageStage.classList.remove('dragging');
    uploadFile(event.dataTransfer.files[0]);
  });

  elements.presetList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image-id]');
    if (!button) return;
    const image = state.config.images.find((item) => item.id === button.dataset.imageId);
    if (image) selectPreset(image);
  });

  elements.fields.addEventListener('click', (event) => {
    const button = event.target.closest('.choice-option');
    if (!button) return;
    const field = state.config.fields.find((item) => item.id === button.dataset.fieldId);
    if (!field) return;

    if (field.selection === 'multiple') {
      button.classList.toggle('selected');
      button.setAttribute('aria-checked', String(button.classList.contains('selected')));
      return;
    }

    document.querySelectorAll(`.choice-option[data-field-id="${CSS.escape(field.id)}"]`).forEach((option) => {
      option.classList.remove('selected');
      option.setAttribute('aria-checked', 'false');
    });
    button.classList.add('selected');
    button.setAttribute('aria-checked', 'true');
  });

  elements.picker.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme]');
    if (!button) return;
    state.background = button.dataset.theme;
    localStorage.setItem('yishan-background', state.background);
    window.yishanBackground.setTheme(state.background);
    renderBackgroundPicker();
  });

  elements.submit.addEventListener('click', async () => {
    const answers = collectAnswers();
    const selectedImage = state.selectedImage;
    const payload = {
      imageId: selectedImage?.kind === 'preset' ? selectedImage.id : undefined,
      imageUrl: selectedImage?.kind === 'preset' ? selectedImage.url : undefined,
      imageLabel: selectedImage?.label,
      uploadId: selectedImage?.kind === 'upload' ? selectedImage.id : undefined,
      uploadUrl: selectedImage?.kind === 'upload' ? selectedImage.url : undefined,
      uploadName: selectedImage?.kind === 'upload' ? selectedImage.label : undefined,
      background: state.background,
      answers
    };

    elements.submit.disabled = true;
    elements.submit.querySelector('span').textContent = '正在提交…';

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        const firstError = result.errors?.[0]?.message || result.error || '提交失败';
        throw new Error(firstError);
      }
      showToast('已收到你的心意，这一刻已经被好好收下。', 4200);
    } catch (error) {
      showToast(error.message);
    } finally {
      elements.submit.disabled = false;
      elements.submit.querySelector('span').textContent = '提交这一刻';
    }
  });
}

async function init() {
  window.yishanBackground = window.YishanBackgrounds.initBackground(document.querySelector('#liquid-background'), state.background);
  bindEvents();
  try {
    await loadConfig();
  } catch (error) {
    showToast(error.message, 5000);
  }
}

init();
