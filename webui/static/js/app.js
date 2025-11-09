const form = document.querySelector('#prompt-form');
const promptInput = document.querySelector('#prompt');
const statusBadge = document.querySelector('#status');
const timeline = document.querySelector('#timeline');
const ctaButton = document.querySelector('#cta');
const hero = document.querySelector('#hero');
const layers = document.querySelectorAll('.parallax-layer');
const revealSection = document.querySelector('#features');

const icons = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  plugin: '🧩',
  info: 'ℹ️'
};

function createTimelineCard(result) {
  const article = document.createElement('article');
  article.className = 'timeline-card';

  const title = document.createElement('h3');
  title.textContent = `${result.intention} · ${result.prompt}`;
  article.appendChild(title);

  if (result.plan?.length) {
    const list = document.createElement('ul');
    list.innerHTML = result.plan.map((step) => `<li>${step}</li>`).join('');
    article.appendChild(list);
  }

  if (result.search_result) {
    const search = document.createElement('p');
    search.innerHTML = `<strong>Pesquisa:</strong> ${result.search_result}`;
    article.appendChild(search);
  }

  if (result.notifications?.length) {
    const notes = document.createElement('div');
    notes.className = 'notifications';
    result.notifications.forEach((note) => {
      const badge = document.createElement('span');
      badge.className = 'notification-badge';
      const icon = icons[note.kind] ?? icons.info;
      badge.textContent = `${icon} ${note.title ?? note.kind}`;
      const text = document.createElement('p');
      text.textContent = note.message;
      notes.appendChild(badge);
      notes.appendChild(text);
    });
    article.appendChild(notes);
  }

  if (result.conversation_summary) {
    const summary = document.createElement('pre');
    summary.textContent = result.conversation_summary;
    article.appendChild(summary);
  }

  if (result.execution_results?.length) {
    const exec = document.createElement('p');
    const statusList = result.execution_results
      .map((entry, index) => `#${index + 1} → código ${entry.returncode}`)
      .join(' · ');
    exec.innerHTML = `<strong>Execuções:</strong> ${statusList}`;
    article.appendChild(exec);
  }

  return article;
}

async function sendPrompt(event) {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  statusBadge.textContent = 'Processando...';
  statusBadge.style.color = '#4cc9f0';

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Falha ao executar o agente');
    }

    const result = await response.json();
    timeline.querySelector('.timeline-empty')?.remove();
    timeline.prepend(createTimelineCard(result));
    statusBadge.textContent = 'Concluído';
    statusBadge.style.color = '#7bffbd';
    promptInput.value = '';
  } catch (error) {
    console.error(error);
    statusBadge.textContent = 'Erro';
    statusBadge.style.color = '#ff7096';
  }
}

function handleParallax(event) {
  const rect = hero.getBoundingClientRect();
  const offsetX = (event.clientX - rect.width / 2) / rect.width;
  const offsetY = (event.clientY - rect.height / 2) / rect.height;

  layers.forEach((layer) => {
    const depth = Number(layer.dataset.depth ?? 0.15);
    const translateX = offsetX * depth * -60;
    const translateY = offsetY * depth * -40;
    layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  });
}

function observeReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.15 }
  );
  observer.observe(revealSection);
}

function smoothScroll() {
  document.querySelector('#cta').addEventListener('click', () => {
    document.querySelector('#workspace').scrollIntoView({ behavior: 'smooth' });
  });
}

form?.addEventListener('submit', sendPrompt);
ctaButton?.addEventListener('mousemove', handleParallax);
hero?.addEventListener('mousemove', handleParallax);
observeReveal();
smoothScroll();
