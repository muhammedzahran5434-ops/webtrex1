const CFG = {
  apiKey: 'AIzaSyDltBbZJWcVSywBpxWEwhoGxenePhwrO-0',
  authDomain: 'webtrex-portfolio.firebaseapp.com',
  projectId: 'webtrex-portfolio',
  storageBucket: 'webtrex-portfolio.firebasestorage.app',
  messagingSenderId: '536269316009',
  appId: '1:536269316009:web:b90d54772768e0ab9caeb8'
};
firebase.initializeApp(CFG);
const db = firebase.firestore(), auth = firebase.auth(), st = firebase.storage();
const ADMIN = 'webtrex@gmail.com';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
const toast = (m, bad) => {
  const t = $('#toast');
  t.textContent = m;
  t.className = bad ? 'show bad' : 'show';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = ''), 4200);
};

const CATS = ['Website', 'Mobile Application', 'Software', 'UI/UX Design', 'Image / Graphics', 'APK', 'ISO', 'Other'];
const SVC = [
  ['Website development', 'Fast, search-ready marketing sites and corporate platforms.'],
  ['Mobile apps', 'Native and cross-platform iOS and Android apps.'],
  ['UI/UX design', 'Interfaces, prototypes and design systems.'],
  ['Software', 'Desktop tools, automation and backend services.'],
  ['E-commerce', 'Storefronts and checkout flows that convert.'],
  ['Web applications', 'Dashboards and real-time browser apps.'],
  ['Custom solutions', 'APIs, APK and ISO builds, cloud setups.'],
  ['Branding', 'Identity, typography and digital artwork.']
];
const STEPS = [
  ['Discover', 'We map your goals, users and technical constraints.'],
  ['Design', 'Wireframes, a visual system and an interactive prototype.'],
  ['Develop', 'Clean, tested full-stack code.'],
  ['Deliver', 'Launch, QA and ongoing support.']
];
$('#svc').innerHTML = SVC.map(([t, d]) => `<div><h3>${t}</h3><p>${d}</p></div>`).join('');
$('#steps').innerHTML = STEPS.map(([t, d], i) => `<div><b>${i + 1}</b><h3>${t}</h3><p>${d}</p></div>`).join('');
$('#pills').innerHTML = ['All', ...CATS].map((c, i) => `<button class="${i ? '' : 'on'}" data-c="${c}">${c}</button>`).join('');
$('#pf').elements.cat.innerHTML = CATS.map((c) => `<option>${c}</option>`).join('');

/* ---------- public site ---------- */
let pub = [], adm = [], msgs = [], cat = 'All', cur = {}, subs = [];
const byDate = (a, b) => (b.date || '').localeCompare(a.date || '');

function draw() {
  const q = $('#q').value.toLowerCase();
  const list = pub.filter((p) =>
    (cat === 'All' || p.category === cat) &&
    (!q || [p.title, p.description, p.category, ...(p.technologies || [])].join(' ').toLowerCase().includes(q)));
  $('#grid').innerHTML = list.length
    ? list.map((p) => `<article data-id="${esc(p.id)}"><div class="th">${p.thumbnail ? `<img src="${esc(p.thumbnail)}" alt="" loading="lazy">` : ''}</div><small>${esc(p.category)}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></article>`).join('')
    : `<p class="empty">${pub.length ? 'No projects match your search.' : 'Projects will appear here once they are published.'}</p>`;
  $('#count').textContent = pub.length;
}
db.collection('projects').where('status', '==', 'published').onSnapshot((s) => {
  pub = s.docs.map((d) => d.data()).sort(byDate);
  draw();
}, (e) => console.warn('Projects unavailable:', e.code));

$('#q').oninput = draw;
$('#pills').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  cat = b.dataset.c;
  $$('#pills button').forEach((x) => x.classList.toggle('on', x === b));
  draw();
};

function view(p) {
  const g = p.images && p.images.length ? p.images : [p.thumbnail].filter(Boolean);
  $('#pmb').innerHTML = `<button class="btn x" data-x>Close</button>${g[0] ? `<img id="big" src="${esc(g[0])}" alt="">` : ''}
    ${g.length > 1 ? `<div class="gal">${g.map((u) => `<img src="${esc(u)}" alt="">`).join('')}</div>` : ''}
    <small class="tg">${esc(p.category)}</small><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p>
    <div class="tags">${(p.technologies || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    ${(p.files || []).map((f) => `<a class="btn" href="${esc(f.url)}" target="_blank" rel="noopener">Download ${esc(f.name)}</a>`).join('')}
    ${p.downloadUrl ? `<a class="btn" href="${esc(p.downloadUrl)}" target="_blank" rel="noopener">Download from link</a>` : ''}
    ${p.websiteUrl ? `<a class="btn dark" href="${esc(p.websiteUrl)}" target="_blank" rel="noopener">Visit live site</a>` : ''}`;
  $('#pm').showModal();
}
$('#grid').onclick = (e) => {
  const a = e.target.closest('article');
  const p = a && pub.find((x) => x.id === a.dataset.id);
  if (p) view(p);
};
$('#pmb').onclick = (e) => {
  if (e.target.matches('.gal img')) $('#big').src = e.target.src;
};
document.addEventListener('click', (e) => {
  const d = e.target.closest('dialog');
  if (e.target.matches('[data-x]') && d) d.close();
  else if (e.target.tagName === 'DIALOG') e.target.close();
});

$('#cf').onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, b = f.querySelector('button');
  b.disabled = true;
  try {
    await db.collection('messages').add({
      name: f.nm.value.trim(), email: f.em.value.trim(), type: f.tp.value,
      message: f.msg.value.trim(), read: false, createdAt: new Date().toISOString()
    });
    f.reset();
    toast('Message sent. We reply within one business day.');
  } catch (x) {
    toast('Could not send your message. Please email us directly.', true);
  }
  b.disabled = false;
};

/* ---------- admin sign in ---------- */
$('#authBtn').onclick = () => (auth.currentUser ? openAdmin() : $('#si').showModal());
$('#sf').onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target;
  $('#err').textContent = '';
  try {
    await auth.signInWithEmailAndPassword(f.elements.em.value.trim(), f.elements.pw.value);
    f.reset();
    $('#si').close();
    openAdmin();
  } catch (x) {
    $('#err').textContent = x.code === 'auth/operation-not-allowed' ? 'Email/Password sign-in is not enabled in Firebase yet.'
      : x.code === 'auth/network-request-failed' ? 'Network error. Check your connection and try again.'
      : 'Wrong email or password.';
  }
};
auth.onAuthStateChanged((u) => {
  const ok = !!u && (u.email || '').toLowerCase() === ADMIN;
  if (u && !ok) { auth.signOut(); return; }
  $('#authBtn').textContent = ok ? 'Dashboard' : 'Sign in';
  if (!ok) closeAdmin();
});
$('#out').onclick = () => auth.signOut();
$('#viewSite').onclick = closeAdmin;

function openAdmin() {
  if (!auth.currentUser) return;
  closeAdmin(true);
  $('#site').hidden = true;
  $('#admin').hidden = false;
  window.scrollTo(0, 0);
  const fail = (e) => toast('Cloud error: ' + e.code + (e.code === 'permission-denied' ? '. Publish the Firestore rules.' : ''), true);
  subs.push(db.collection('projects').onSnapshot((s) => { adm = s.docs.map((d) => d.data()).sort(byDate); drawAdmin(); }, fail));
  subs.push(db.collection('messages').onSnapshot((s) => {
    msgs = s.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    drawMsgs();
  }, fail));
}
function closeAdmin(keep) {
  subs.forEach((u) => u());
  subs = [];
  if (keep) return;
  $('#admin').hidden = true;
  $('#site').hidden = false;
}
$$('#admin aside [data-t]').forEach((b) => (b.onclick = () => {
  $$('#admin aside [data-t]').forEach((x) => x.classList.toggle('on', x === b));
  $('#t-projects').hidden = b.dataset.t !== 'projects';
  $('#t-messages').hidden = b.dataset.t !== 'messages';
}));

/* ---------- admin: projects ---------- */
function drawAdmin() {
  $('#plist').innerHTML = adm.length ? adm.map((p) => `<div class="row2"><img src="${esc(p.thumbnail || '')}" alt=""><div><b>${esc(p.title)}</b><small>${esc(p.category)}</small></div><em class="${esc(p.status)}">${esc(p.status)}</em>
    <button data-a="edit" data-id="${esc(p.id)}">Edit</button><button data-a="tog" data-id="${esc(p.id)}">${p.status === 'published' ? 'Unpublish' : 'Publish'}</button><button data-a="del" data-id="${esc(p.id)}">Delete</button></div>`).join('')
    : '<p class="empty">No projects yet. Fill in the form above and publish your first one.</p>';
}
$('#plist').onclick = async (e) => {
  const b = e.target.closest('button[data-a]');
  const p = b && adm.find((x) => x.id === b.dataset.id);
  if (!p) return;
  try {
    if (b.dataset.a === 'tog') {
      await db.collection('projects').doc(p.id).update({ status: p.status === 'published' ? 'draft' : 'published' });
      toast(p.status === 'published' ? 'Moved to drafts.' : 'Published.');
    } else if (b.dataset.a === 'del') {
      if (confirm('Delete "' + p.title + '"? This cannot be undone.')) { await db.collection('projects').doc(p.id).delete(); toast('Project deleted.'); }
    } else {
      const f = $('#pf').elements;
      cur = p;
      f.pid.value = p.id; f.ttl.value = p.title; f.cat.value = p.category; f.date.value = p.date || '';
      f.desc.value = p.description; f.web.value = p.websiteUrl || ''; f.dl.value = p.downloadUrl || '';
      f.tech.value = (p.technologies || []).join(', ');
      $('#pf h3').textContent = 'Edit project (new uploads are added to existing ones)';
      $('#pf').scrollIntoView({ behavior: 'smooth' });
    }
  } catch (x) { toast('Failed: ' + (x.code || x.message), true); }
};
function resetForm() {
  $('#pf').reset();
  cur = {};
  $('#pf h3').textContent = 'Add a project';
}
$('#cancel').onclick = resetForm;

const OK = /\.(jpe?g|png|webp|svg|apk|iso|pdf|docx|txt|zip)$/i;
async function up(file) {
  if (!OK.test(file.name)) throw new Error('Unsupported file type: ' + file.name);
  const r = st.ref('uploads/' + Date.now() + '-' + file.name.replace(/[^\w.-]+/g, '_'));
  await r.put(file);
  return r.getDownloadURL();
}
async function save(status) {
  const f = $('#pf').elements, v = (n) => f[n].value.trim();
  if (!v('ttl') || !v('desc')) return toast('Add a title and description first.', true);
  const btns = $$('#pf button');
  btns.forEach((b) => (b.disabled = true));
  toast('Saving. Large uploads can take a moment.');
  try {
    const p = { thumbnail: cur.thumbnail || '', images: [...(cur.images || [])], files: [...(cur.files || [])] };
    if (f.thumb.files[0]) p.thumbnail = await up(f.thumb.files[0]);
    for (const x of f.gal.files) p.images.push(await up(x));
    for (const x of f.rel.files) p.files.push({ name: x.name, size: x.size, url: await up(x) });
    const id = cur.id || 'p' + Date.now(), now = new Date().toISOString();
    await db.collection('projects').doc(id).set({
      ...p, id, title: v('ttl'), category: f.cat.value, description: v('desc'),
      date: v('date') || now.slice(0, 10), websiteUrl: v('web'), downloadUrl: v('dl'),
      technologies: v('tech').split(',').map((s) => s.trim()).filter(Boolean),
      status, createdAt: cur.createdAt || now, updatedAt: now
    });
    toast(status === 'published' ? 'Published.' : 'Saved as draft.');
    resetForm();
  } catch (x) { toast('Save failed: ' + (x.code || x.message), true); }
  btns.forEach((b) => (b.disabled = false));
}
$$('#pf [data-s]').forEach((b) => (b.onclick = () => save(b.dataset.s)));

/* ---------- admin: messages ---------- */
function drawMsgs() {
  $('#unread').textContent = msgs.filter((m) => !m.read).length || '';
  $('#mlist').innerHTML = msgs.length ? msgs.map((m) => `<article class="msg ${m.read ? '' : 'new'}"><div><b>${esc(m.name)}</b><small>${esc(m.type)}</small></div><p>${esc(m.message)}</p>
    <div class="acts"><a href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: ' + m.type + ' | WebTrex')}">Reply to ${esc(m.email)}</a>
    <button data-m="read" data-id="${esc(m.id)}">${m.read ? 'Mark unread' : 'Mark read'}</button><button data-m="del" data-id="${esc(m.id)}">Delete</button></div></article>`).join('')
    : '<p class="empty">No messages yet.</p>';
}
$('#mlist').onclick = async (e) => {
  const b = e.target.closest('button[data-m]');
  const m = b && msgs.find((x) => x.id === b.dataset.id);
  if (!m) return;
  try {
    const ref = db.collection('messages').doc(m.id);
    if (b.dataset.m === 'read') await ref.update({ read: !m.read });
    else if (confirm('Delete this message?')) await ref.delete();
  } catch (x) { toast('Failed: ' + (x.code || x.message), true); }
};
