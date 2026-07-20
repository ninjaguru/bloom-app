const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

/* ---------- Questions ---------- */
export const QUESTIONS = {
  skinType: {
    label: 'Your skin / hair type',
    options: [
      { value: 'oily',        label: 'Oily' },
      { value: 'dry',         label: 'Dry' },
      { value: 'combination', label: 'Combination' },
      { value: 'normal',      label: 'Normal' },
      { value: 'sensitive',   label: 'Sensitive' },
    ],
  },
  concern: {
    label: 'Main concern',
    options: [
      { value: 'tan removal',   label: 'Tan Removal' },
      { value: 'anti-ageing',   label: 'Anti-Ageing' },
      { value: 'acne & pores',  label: 'Acne & Pores' },
      { value: 'relaxation',    label: 'Relaxation' },
      { value: 'hair removal',  label: 'Hair Removal' },
      { value: 'brightening',   label: 'Brightening' },
    ],
  },
  budget: {
    label: 'Budget',
    options: [
      { value: 'under ₹500',        label: 'Under ₹500' },
      { value: '₹500 – ₹1,500',     label: '₹500 – ₹1,500' },
      { value: '₹1,500 – ₹3,000',   label: '₹1,500 – ₹3,000' },
      { value: 'above ₹3,000',      label: '₹3,000+' },
    ],
  },
};

/* ---------- Gemini call ---------- */
export async function getRecommendations({ gender, skinType, concern, budget, services }) {
  const serviceList = services.map((s) => ({
    serviceId:       s.serviceId || s.id,
    title:           s.title,
    category:        s.category,
    price:           s.price,
    durationMinutes: s.durationMinutes,
  }));

  const prompt = `You are a salon service recommender for Bloom Salon, a premium at-home beauty service in Bangalore.

Customer profile:
- Gender: ${gender}
- Skin/hair type: ${skinType}
- Main concern: ${concern}
- Budget: ${budget}

Available ${gender}'s services (JSON):
${JSON.stringify(serviceList)}

Recommend exactly 3 services that best match this profile. Reply ONLY with a valid JSON array, no markdown fences, no text outside the array:
[{"serviceId":"...","reason":"one concise sentence why this fits"}]`;

  const res = await fetch(GEMINI_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents:         [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Gemini error:', res.status, errBody);
    throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data  = await res.json();
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Gemini returned no JSON');

  const recs = JSON.parse(match[0]);
  return recs
    .map((r) => ({
      service: services.find((s) => (s.serviceId || s.id) === r.serviceId),
      reason:  r.reason,
    }))
    .filter((r) => r.service);
}

/* ---------- Modal ---------- */
const state = { skinType: null, concern: null, budget: null };

function renderQuestion(key, currentGender) {
  const q = QUESTIONS[key];
  let options = q.options;

  // For concern, swap hair removal with grooming for men
  if (key === 'concern' && currentGender === 'men') {
    options = options.map((o) =>
      o.value === 'hair removal' ? { value: 'grooming', label: 'Grooming' } : o
    );
  }

  return `
    <div class="rec-question" data-key="${key}">
      <p class="rec-question-label">${q.label}</p>
      <div class="rec-pills">
        ${options.map((o) => `
          <button class="rec-pill ${state[key] === o.value ? 'active' : ''}"
                  data-key="${key}" data-value="${o.value}">
            ${o.label}
          </button>`).join('')}
      </div>
    </div>`;
}

export function setupRecommender(getCurrentGender, getCachedServices, addToCartFn) {
  const overlay = document.getElementById('rec-overlay');
  const content = document.getElementById('rec-content');

  function open() {
    state.skinType = null;
    state.concern  = null;
    state.budget   = null;
    renderForm();
    overlay.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function close() {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function renderForm() {
    const gender = getCurrentGender();
    content.innerHTML = `
      <div class="rec-form">
        ${renderQuestion('skinType', gender)}
        ${renderQuestion('concern',  gender)}
        ${renderQuestion('budget',   gender)}
        <p class="rec-error" id="rec-error"></p>
        <button class="checkout-btn" id="rec-submit-btn" style="margin-top:8px;">
          <span>Get My Recommendations</span>
        </button>
      </div>`;

    content.querySelectorAll('.rec-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const key = pill.dataset.key;
        state[key] = pill.dataset.value;
        content.querySelectorAll(`.rec-pill[data-key="${key}"]`).forEach((p) =>
          p.classList.toggle('active', p === pill)
        );
      });
    });

    document.getElementById('rec-submit-btn').addEventListener('click', handleSubmit);
  }

  async function handleSubmit() {
    const errorEl = document.getElementById('rec-error');
    if (!state.skinType || !state.concern || !state.budget) {
      errorEl.textContent = 'Please answer all three questions.';
      return;
    }

    const btn = document.getElementById('rec-submit-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Finding best services…';
    errorEl.textContent = '';

    content.innerHTML = `
      <div class="rec-loading">
        <div class="loader"></div>
        <p>Bloom AI is finding your perfect services…</p>
      </div>`;

    try {
      const gender   = getCurrentGender();
      const services = getCachedServices();
      const recs     = await getRecommendations({
        gender,
        skinType: state.skinType,
        concern:  state.concern,
        budget:   state.budget,
        services,
      });

      if (!recs.length) throw new Error('No recommendations returned');
      renderResults(recs, addToCartFn);
    } catch (err) {
      console.error(err);
      content.innerHTML = `
        <div class="rec-loading">
          <p style="color:var(--color-red);font-size:0.82rem">${err.message}</p>
          <button class="checkout-btn" id="rec-retry" style="margin-top:16px;"><span>Try Again</span></button>
        </div>`;
      document.getElementById('rec-retry').addEventListener('click', renderForm);
    }
  }

  function renderResults(recs, addToCartFn) {
    const _px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`;
    const _ux = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=400&fit=crop&auto=format`;
    const IMG_MAP = {
      Waxing: _px('6763618'), Facial: _ux('1570172619644-dfd03ed5d881'),
      Hair: _px('10028673'), Massage: _ux('1544161515-4ab6ce6db874'),
      'Manicure & Pedicure': _ux('1604654894610-df63bc536371'),
      Threading: _px('6135615'), Cleanup: _px('29189893'),
      'Beard & Grooming': _ux('1503951914875-452162b0f3f1'),
      Haircut: _ux('1599351431202-1e0f0137899a'),
    };

    content.innerHTML = `
      <p style="font-size:0.82rem;color:var(--color-text-muted);margin-bottom:16px;">
        Based on your answers, Bloom AI recommends:
      </p>
      <div class="rec-results">
        ${recs.map(({ service, reason }) => {
          const img = service.imageUrl || IMG_MAP[service.category] || _px('6763618');
          const sid = service.serviceId || service.id;
          return `
            <div class="rec-card">
              <div class="rec-card-img">
                <img src="${img}" alt="${service.title}" loading="lazy" />
                <span class="rec-rank-badge">#${recs.indexOf(recs.find(r => (r.service.serviceId || r.service.id) === sid)) + 1} Pick</span>
              </div>
              <div class="rec-card-body">
                <span class="rec-card-cat">${service.category}</span>
                <h4 class="rec-card-title">${service.title}</h4>
                <p class="rec-card-reason">${reason}</p>
                <div class="rec-card-footer">
                  <span class="price-current">₹${service.price.toLocaleString('en-IN')}</span>
                  <button class="add-to-cart-btn rec-add-btn" data-id="${sid}">+ Add</button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
      <button class="rec-retry-link" id="rec-redo">Start over</button>`;

    content.querySelectorAll('.rec-add-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const service = recs.find((r) => (r.service.serviceId || r.service.id) === btn.dataset.id)?.service;
        if (service) {
          addToCartFn(service);
          btn.classList.add('added');
          btn.textContent = '✓ Added';
        }
      });
    });

    document.getElementById('rec-redo').addEventListener('click', () => {
      state.skinType = null;
      state.concern  = null;
      state.budget   = null;
      renderForm();
    });
  }

  // Event listeners
  document.getElementById('rec-open-btn')?.addEventListener('click', open);
  document.getElementById('rec-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}
