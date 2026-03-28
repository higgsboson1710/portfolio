// ═══════════════════════════════════════════════════════════════
// UI Manager — Section Panels, Chatbot, Labels
// ═══════════════════════════════════════════════════════════════
import {
  PROFILE, ABOUT, EDUCATION, SKILLS, PROJECTS,
  ACHIEVEMENTS, COMPETITIVE, CONTACT, CHATBOT_RESPONSES,
} from './data.js';

// ─── Section Content Generators ───
const sectionGenerators = {
  about: () => `
    <div class="section-bio">${ABOUT.bio}</div>
    <h3 style="font-family:var(--font-display);font-size:0.75rem;letter-spacing:2px;color:var(--clr-accent);margin-bottom:0.8rem;">HIGHLIGHTS</h3>
    <ul class="highlight-list">
      ${ABOUT.highlights.map(h => `<li>${h}</li>`).join('')}
    </ul>
  `,

  education: () => `
    ${EDUCATION.map(e => `
      <div class="edu-card">
        <h3>${e.institution}</h3>
        <div class="degree">${e.degree}</div>
        <div class="meta">${e.period} • ${e.score} • ${e.location}</div>
      </div>
    `).join('')}
  `,

  projects: () => `
    ${PROJECTS.map(p => `
      <div class="project-card">
        <h3>${p.title}</h3>
        <div class="tech">${p.tech}</div>
        <ul>
          ${p.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  `,

  skills: () => {
    const categories = [
      { title: 'Languages', items: SKILLS.languages },
      { title: 'Backend / Web', items: SKILLS.backend },
      { title: 'Libraries / ML', items: SKILLS.libraries },
      { title: 'Tools & Databases', items: SKILLS.tools },
      { title: 'Coursework', items: SKILLS.coursework },
    ];
    return categories.map(cat => `
      <div class="skill-category">
        <h3>${cat.title}</h3>
        <div class="skill-tags">
          ${cat.items.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      </div>
    `).join('');
  },

  achievements: () => `
    ${ACHIEVEMENTS.map(a => `
      <div class="achievement-card">
        <div class="achievement-icon">${a.icon}</div>
        <div>
          <h3>${a.title}</h3>
          <p>${a.detail}</p>
        </div>
      </div>
    `).join('')}
  `,

  competitive: () => `
    <div class="cp-stats">
      ${COMPETITIVE.platforms.map(p => `
        <div class="cp-stat">
          <span class="badge">${p.badge}</span>
          <span class="platform">${p.name}</span>
          <span class="rating">${p.rating}</span>
          <span class="solved">${p.solved} solved</span>
        </div>
      `).join('')}
    </div>
    <div class="cp-total">
      <span>TOTAL PROBLEMS CRUSHED</span>
      <span class="number">${COMPETITIVE.totalSolved}</span>
    </div>
  `,

  contact: () => `
    <div class="contact-links">
      <a class="contact-link" href="mailto:${CONTACT.email}">
        <span class="link-icon">📧</span>
        <div>
          <span class="link-label">EMAIL</span><br/>
          <span class="link-value">${CONTACT.email}</span>
        </div>
      </a>
      <a class="contact-link" href="tel:${CONTACT.phone}">
        <span class="link-icon">📱</span>
        <div>
          <span class="link-label">PHONE</span><br/>
          <span class="link-value">${CONTACT.phone}</span>
        </div>
      </a>
      <a class="contact-link" href="${CONTACT.linkedin}" target="_blank">
        <span class="link-icon">💼</span>
        <div>
          <span class="link-label">LINKEDIN</span><br/>
          <span class="link-value">abhinav-singh-yadav</span>
        </div>
      </a>
      <a class="contact-link" href="${CONTACT.github}" target="_blank">
        <span class="link-icon">🐙</span>
        <div>
          <span class="link-label">GITHUB</span><br/>
          <span class="link-value">github.com/higgsboson1710</span>
        </div>
      </a>
    </div>
    <div class="contact-message">${CONTACT.message}</div>
  `,
};

const SECTION_LABELS = {
  about: 'About Me',
  education: 'Education',
  projects: 'Projects',
  skills: 'Technical Skills',
  achievements: 'Achievements',
  competitive: 'Competitive Programming',
  contact: 'Contact',
};

// ─── Section Panel ───
export function showSection(sectionId) {
  const panel = document.getElementById('section-panel');
  const title = document.getElementById('section-title');
  const content = document.getElementById('section-content');
  const nameDisplay = document.getElementById('planet-name-display');

  title.textContent = SECTION_LABELS[sectionId] || sectionId;
  content.innerHTML = sectionGenerators[sectionId]
    ? sectionGenerators[sectionId]()
    : '<p>Section coming soon...</p>';

  panel.classList.remove('hidden');
  nameDisplay.textContent = SECTION_LABELS[sectionId];
  nameDisplay.classList.add('visible');

  document.getElementById('btn-back').classList.remove('hidden');
}

export function hideSection() {
  document.getElementById('section-panel').classList.add('hidden');
  document.getElementById('btn-back').classList.add('hidden');
  const nameDisplay = document.getElementById('planet-name-display');
  nameDisplay.classList.remove('visible');
}

// ─── Planet Labels (2D projected) ───
export function createPlanetLabels(planetConfigs) {
  const container = document.getElementById('planet-labels');
  container.innerHTML = '';
  const labels = [];

  planetConfigs.forEach(cfg => {
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.textContent = cfg.label;
    el.dataset.planetId = cfg.id;
    container.appendChild(el);
    labels.push({ el, id: cfg.id });
  });

  return labels;
}

// Note: Planet label updates are handled directly in main.js

// ─── Chatbot ───
export function initChatbot() {
  const chatBtn = document.getElementById('btn-chat');
  const chatPanel = document.getElementById('chatbot');
  const chatCloseBtn = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');

  chatBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('hidden');
    if (!chatPanel.classList.contains('hidden')) {
      chatInput.focus();
    }
  });

  chatCloseBtn.addEventListener('click', () => {
    chatPanel.classList.add('hidden');
  });

  const sendMessage = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage('user', text);
    chatInput.value = '';

    setTimeout(() => {
      const response = generateResponse(text);
      appendMessage('bot', response);
    }, 400 + Math.random() * 600);
  };

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function appendMessage(sender, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${sender}`;
  div.innerHTML = `<div class="msg-bubble">${text}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateResponse(input) {
  const lower = input.toLowerCase();

  // Greeting patterns
  if (/^(hi|hello|hey|yo|sup|what'?s? up|hola|howdy)/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.greetings);
  }

  // About
  if (/who is|about|tell me about|introduce|abhinav|himself|overview/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.about);
  }

  // Skills
  if (/skill|tech|stack|language|tool|framework|library|what.*know|what.*use/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.skills);
  }

  // Projects
  if (/project|build|built|made|create|fall detection|insurance|patient|portfolio/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.projects);
  }

  // Achievements
  if (/achieve|rank|award|accomplishment|competition|hackathon|reply|iicpc|insomnia/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.achievements);
  }

  // Education
  if (/educat|college|university|school|degree|cgpa|gpa|bit mesra|birla/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.education);
  }

  // Competitive programming
  if (/compet|leetcode|codechef|codeforces|cp|rating|solved|problem/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.competitive);
  }

  // Contact
  if (/contact|reach|email|phone|linkedin|github|hire|connect|social/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.contact);
  }

  // Funny / Easter eggs
  if (/joke|funny|lol|lmao|meme|easter|secret|rizz/.test(lower)) {
    return pickRandom(CHATBOT_RESPONSES.funny);
  }

  // Resume / CV
  if (/resume|cv|download/.test(lower)) {
    return "Want Abhinav's resume? Smart move 📄 You can reach out to him at higgsboson1710@gmail.com and he'll send it over. Or better yet, you're LOOKING at his interactive resume right now — just explore the planets! 🪐";
  }

  // Compliment
  if (/cool|awesome|nice|great|amazing|impressive|wow/.test(lower)) {
    return "Right?! 🔥 This man Abhinav designed this entire 3D universe as his portfolio. When others make basic websites, he builds ENTIRE SOLAR SYSTEMS. That's the energy. 🌌✨";
  }

  // Fallback
  return pickRandom(CHATBOT_RESPONSES.fallback);
}
