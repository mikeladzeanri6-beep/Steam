
const KEY = 'steam-demo'
const ALYX = 546560
const GAMES = [
  { id: 546560, name: 'Half-Life: Alyx', price: 59.99, page: true },
  { id: 220, name: 'Half-Life 2', price: 9.99 },
  { id: 70, name: 'Half-Life', price: 9.99 },
  { id: 620, name: 'Portal 2', price: 9.99 },
  { id: 400, name: 'Portal', price: 9.99 },
  { id: 730, name: 'Counter-Strike 2', price: 0 },
]
const SHOTS = [1, 2, 3, 4, 5, 6].map((n) => `screenshot-${n}.png`)
const ADDRESS = {
  store: 'https://store.steampowered.com/app/546560/HalfLife_Alyx/',
  library: 'steam://nav/games',
  profile: 'https://steamcommunity.com/id/player_name/',
}
const NAV_MENUS = {
  browse: ['Top Sellers', 'New & Trending', 'Specials'],
  recs: ['Friends', 'Curators', 'Tags'],
  categories: ['Action', 'Adventure', 'RPG', 'Strategy'],
  hardware: ['Steam Deck', 'Valve Index', 'Steam Controller'],
  ways: ['Free to Play', 'Virtual Reality', 'Early Access'],
  more: ['Community Hub', 'News', 'Points Shop'],
}

/* ============ State ============ */
const defaults = { name: 'PLAYER_NAME', wallet: 75, cart: [], wish: false, follow: false, library: [620, 220], installed: [620] }
let S = { ...defaults }
try { S = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* use defaults */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* ignore */ } }

let history_ = ['store'], pos = 0, slide = 0, libSel = ALYX
const installing = {}, running = {}

/* ============ Helpers ============ */
const $ = (s) => document.querySelector(s)
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const money = (n) => (n ? `$${n.toFixed(2)}` : 'Free')
const game = (id) => GAMES.find((g) => g.id === id)
const owns = (id) => S.library.includes(id)
const cartTotal = () => S.cart.reduce((sum, id) => sum + game(id).price, 0)

let toastTimer
function toast(msg) {
  const t = $('#toast')
  t.textContent = msg
  t.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (t.hidden = true), 2600)
}

function modal(title, body, buttons = []) {
  const o = $('#overlay')
  o.innerHTML = `<div class="modal"><h3>${esc(title)}</h3><div class="modal__body">${body}</div>
    <div class="modal__btns">${buttons.map((b, i) => `<button class="${b.primary ? 'btn-green' : 'btn-grey'}" data-modal="${i}">${esc(b.label)}</button>`).join('')}
    <button class="btn-grey" data-modal="close">Close</button></div></div>`
  o.hidden = false
  o.onclick = (e) => {
    const b = e.target.closest('[data-modal]')
    if (e.target === o || (b && b.dataset.modal === 'close')) return closeOverlay()
    if (b) buttons[+b.dataset.modal].run()
  }
}
const closeOverlay = () => { $('#overlay').hidden = true; $('#overlay').innerHTML = '' }

/* ============ Views ============ */
const VIEWS = {
  store() {
    const inCart = S.cart.includes(ALYX)
    const buy = owns(ALYX)
      ? `<span class="owned">✓ In your library</span><button class="btn-green" data-action="nav" data-view="library">Play</button>`
      : `<span class="price">${money(59.99)}</span>` +
        (inCart
          ? `<button class="btn-green" data-action="view-cart">In Cart — View</button>`
          : `<button class="btn-green" data-action="add-cart">Add to Cart</button>`)
    return `
      <p class="breadcrumb"><a href="#">All Games</a> &gt; <a href="#">Action Games</a> &gt; <a href="#">Half-Life: Alyx</a></p>
      <h1 class="game-title">Half-Life: Alyx</h1>
      <section class="app">
        <div class="media">
          <div class="media__main">
            <button class="media__nav media__nav--prev" data-action="slide" data-dir="-1" aria-label="Previous">‹</button>
            <img id="mainImage" data-action="lightbox" src="${SHOTS[slide]}" alt="Screenshot ${slide + 1}">
            <button class="media__nav media__nav--next" data-action="slide" data-dir="1" aria-label="Next">›</button>
            <span class="media__count" id="slideCount">${slide + 1} / ${SHOTS.length}</span>
          </div>
          <div class="media__thumbs">
            ${SHOTS.map((s, i) => `<button class="thumb ${i === slide ? 'active' : ''}" data-action="goto" data-i="${i}"><img src="${s}" alt="Screenshot ${i + 1}"></button>`).join('')}
          </div>
        </div>
        <aside class="info">
          <img class="info__header" src="header.png" alt="Half-Life: Alyx">
          <p class="info__desc">Half-Life: Alyx is Valve's VR return to the Half-Life series. It's the story of an impossible fight against a vicious alien race known as the Combine, set between the events of Half-Life and Half-Life 2. Playing as Alyx Vance, you are humanity's only chance for survival.</p>
          <dl class="info__meta">
            <div class="meta-row"><dt>All Reviews:</dt><dd class="positive">Overwhelmingly Positive</dd></div>
            <div class="meta-row"><dt>Release Date:</dt><dd>23 Mar, 2020</dd></div>
            <div class="meta-row"><dt>Developer:</dt><dd><a href="#">Valve</a></dd></div>
            <div class="meta-row"><dt>Publisher:</dt><dd><a href="#">Valve</a></dd></div>
          </dl>
          <div class="tags"><a class="tag" href="#">VR</a><a class="tag" href="#">Action</a><a class="tag" href="#">Story Rich</a><a class="tag" href="#">Sci-fi</a><a class="tag" href="#">Shooter</a></div>
        </aside>
      </section>
      <div class="actions-row">
        <button class="btn-blue ${S.wish ? 'on' : ''}" data-action="wish">${S.wish ? '✓ On Wishlist' : 'Add to your wishlist'}</button>
        <button class="btn-blue ${S.follow ? 'on' : ''}" data-action="follow">${S.follow ? '✓ Following' : 'Follow'}</button>
      </div>
      <section class="purchase"><h2>Buy Half-Life: Alyx</h2><div class="purchase__action">${buy}</div></section>`
  },

  library() {
    const list = S.library.map(game)
    const g = game(libSel) || list[0]
    if (!g) return '<p class="empty">Your library is empty.</p>'
    const isInstalled = S.installed.includes(g.id)
    let action
    if (installing[g.id] !== undefined) action = `<div class="progress"><div style="width:${installing[g.id]}%"></div></div><p>Installing… ${installing[g.id]}%</p>`
    else if (running[g.id]) action = `<button class="btn-red" data-action="stop" data-id="${g.id}">Stop</button><span class="running">Running</span>`
    else if (isInstalled) action = `<button class="btn-green big" data-action="play" data-id="${g.id}">▶ Play</button><button class="btn-grey" data-action="uninstall" data-id="${g.id}">Uninstall</button>`
    else action = `<button class="btn-blue big" data-action="install" data-id="${g.id}">Install</button>`
    return `
      <section class="library">
        <ul class="library__list">
          ${list.map((x) => `<li><button class="${x.id === g.id ? 'active' : ''}" data-action="lib-select" data-id="${x.id}">${esc(x.name)}${S.installed.includes(x.id) ? '' : ' <small>(not installed)</small>'}</button></li>`).join('')}
        </ul>
        <div class="library__detail">
          ${g.id === ALYX ? `<img class="library__hero" src="header.png" alt="">` : ''}
          <h2>${esc(g.name)}</h2>
          <div class="library__actions">${action}</div>
        </div>
      </section>`
  },

  profile() {
    return `
      <section class="profile">
        <div class="avatar">${esc(S.name[0] || '?').toUpperCase()}</div>
        <div>
          <h1 class="game-title">${esc(S.name)}</h1>
          <p>Level 12 · ${S.library.length} games · ${S.wish ? 1 : 0} on wishlist</p>
          <p class="wallet-line">Wallet balance: <strong>${money(S.wallet) === 'Free' ? '$0.00' : money(S.wallet)}</strong></p>
          <div class="actions-row">
            <button class="btn-blue" data-action="edit-name">Edit Profile</button>
            <button class="btn-blue" data-action="add-funds">Redeem Wallet Code</button>
          </div>
        </div>
      </section>`
  },
}

/* ============ Render / navigation ============ */
function render() {
  const cur = history_[pos]
  document.body.dataset.view = cur
  $('#view').innerHTML = VIEWS[cur]()
  $('#address').textContent = ADDRESS[cur]
  $('#backBtn').disabled = pos === 0
  $('#fwdBtn').disabled = pos === history_.length - 1
  $('#cartBtn').textContent = `Cart (${S.cart.length})`
  $('#wallet').textContent = money(S.wallet) === 'Free' ? '$0.00' : money(S.wallet)
  $('#navName').textContent = S.name.toUpperCase()
  document.querySelectorAll('.main-nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === cur))
  document.title = cur === 'store' ? 'Half-Life: Alyx on Steam' : `Steam — ${cur[0].toUpperCase() + cur.slice(1)}`
}

function go(view) {
  if (view === history_[pos]) return
  history_ = history_.slice(0, pos + 1).concat(view)
  pos++
  render()
}

function setSlide(i) {
  slide = (i + SHOTS.length) % SHOTS.length
  const img = $('#mainImage')
  if (img) {
    img.src = SHOTS[slide]
    img.alt = `Screenshot ${slide + 1}`
    $('#slideCount').textContent = `${slide + 1} / ${SHOTS.length}`
    document.querySelectorAll('.thumb').forEach((t, n) => t.classList.toggle('active', n === slide))
  }
  const lb = $('#overlay .lightbox img')
  if (lb) lb.src = SHOTS[slide]
}

function openLightbox() {
  const o = $('#overlay')
  o.innerHTML = `<div class="lightbox"><button data-lb="-1">‹</button><img src="${SHOTS[slide]}" alt=""><button data-lb="1">›</button></div>`
  o.hidden = false
  o.onclick = (e) => {
    const b = e.target.closest('[data-lb]')
    if (b) setSlide(slide + +b.dataset.lb)
    else closeOverlay()
  }
}

/* ============ Cart & wallet ============ */
function openCart() {
  if (!S.cart.length) return modal('Your Shopping Cart', '<p>Your cart is empty.</p>')
  const total = cartTotal()
  const enough = S.wallet >= total
  modal(
    'Your Shopping Cart',
    `<ul class="cart-list">${S.cart.map((id) => `<li><span>${esc(game(id).name)}</span><span>${money(game(id).price)}</span><button class="link" data-modal-remove="${id}">Remove</button></li>`).join('')}</ul>
     <p class="cart-total">Estimated total: <strong>${money(total)}</strong></p>
     <p>Wallet balance: ${money(S.wallet)}${enough ? '' : ' — <span class="neg">not enough funds</span>'}</p>`,
    [{ label: 'Purchase for myself', primary: true, run: () => purchase() }],
  )
  $('#overlay').querySelectorAll('[data-modal-remove]').forEach((b) =>
    b.addEventListener('click', () => { S.cart = S.cart.filter((id) => id !== +b.dataset.modalRemove); save(); render(); openCart() }),
  )
}

function purchase() {
  const total = cartTotal()
  if (S.wallet < total) { closeOverlay(); return toast('Not enough funds — redeem a wallet code on your profile') }
  S.wallet = +(S.wallet - total).toFixed(2)
  S.library.push(...S.cart.filter((id) => !owns(id)))
  S.cart = []
  save(); closeOverlay(); render()
  toast('Purchase complete! Find your game in the Library.')
}

function addFunds() {
  const code = prompt('Enter a wallet code (demo: any code like AAAAA-BBBBB-CCCCC)')
  if (code === null) return
  if (!/^[A-Z0-9]{5}(-[A-Z0-9]{5}){2}$/i.test(code.trim())) return toast('That code is not valid')
  S.wallet += 25; save(); render(); toast('$25.00 added to your wallet')
}

function install(id) {
  installing[id] = 0
  const t = setInterval(() => {
    installing[id] += 10
    if (installing[id] >= 100) {
      clearInterval(t); delete installing[id]
      S.installed.push(id); save(); toast(`${game(id).name} is ready to play`)
    }
    if (history_[pos] === 'library') render()
  }, 350)
  render()
}

/* ============ Actions (click delegation) ============ */
const ACTIONS = {
  back: () => { if (pos > 0) { pos--; render() } },
  forward: () => { if (pos < history_.length - 1) { pos++; render() } },
  nav: (el) => go(el.dataset.view),
  slide: (el) => setSlide(slide + +el.dataset.dir),
  goto: (el) => setSlide(+el.dataset.i),
  lightbox: openLightbox,
  'add-cart': () => { S.cart.push(ALYX); save(); render(); toast('Added to cart') },
  'view-cart': openCart,
  wish: () => { S.wish = !S.wish; save(); render(); toast(S.wish ? 'Added to your wishlist' : 'Removed from wishlist') },
  follow: () => { S.follow = !S.follow; save(); render() },
  'lib-select': (el) => { libSel = +el.dataset.id; render() },
  install: (el) => install(+el.dataset.id),
  play: (el) => { running[el.dataset.id] = true; render(); toast('Launching…') },
  stop: (el) => { delete running[el.dataset.id]; render() },
  uninstall: (el) => { S.installed = S.installed.filter((i) => i !== +el.dataset.id); save(); render() },
  'edit-name': () => {
    const n = prompt('Profile name', S.name)
    if (n && n.trim()) { S.name = n.trim().slice(0, 24); save(); render() }
  },
  'add-funds': addFunds,
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]')
  if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el)
})

/* ============ Dropdown menus ============ */
const MENUS = {
  steam: [['Go Offline…', () => toast('Offline mode is not part of this demo')], ['Exit', () => toast('This is just a web page 🙂')]],
  view: [['Store', () => go('store')], ['Library', () => go('library')], ['Profile', () => go('profile')]],
  friends: [['View Friends List', () => toast('Friends list is not part of this demo')]],
  games: [['View Library', () => go('library')], ['Redeem a Steam Wallet Code…', addFunds]],
  help: [['Reset demo data', () => { localStorage.removeItem(KEY); location.reload() }]],
}
Object.entries(NAV_MENUS).forEach(([k, items]) => {
  MENUS[k] = items.map((label) => [label, () => toast(`"${label}" isn't available in this demo`)])
})

let openMenu = null
function showMenu(btn) {
  const dd = $('#dropdown')
  const key = btn.dataset.menu
  dd.innerHTML = MENUS[key].map(([label], i) => `<button data-i="${i}">${esc(label)}</button>`).join('')
  const r = btn.getBoundingClientRect()
  dd.style.left = `${r.left + scrollX}px`
  dd.style.top = `${r.bottom + scrollY}px`
  dd.hidden = false
  openMenu = key
  dd.onclick = (e) => {
    const b = e.target.closest('button')
    if (b) { hideMenu(); MENUS[key][+b.dataset.i][1]() }
  }
}
const hideMenu = () => { $('#dropdown').hidden = true; openMenu = null }

document.querySelectorAll('.menu-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => { e.stopPropagation(); openMenu === btn.dataset.menu ? hideMenu() : showMenu(btn) })
  btn.addEventListener('mouseenter', () => { if (openMenu && openMenu !== btn.dataset.menu) showMenu(btn) })
})
document.addEventListener('click', (e) => { if (!e.target.closest('.search')) $('#suggest').hidden = true; hideMenu() })

/* ============ Search ============ */
const input = $('#searchInput')
const suggest = $('#suggest')

function pick(id) {
  suggest.hidden = true
  input.value = ''
  game(id).page ? go('store') : toast(`${game(id).name} doesn't have a page in this demo`)
}

input.addEventListener('input', () => {
  const q = input.value.trim().toLowerCase()
  const hits = q ? GAMES.filter((g) => g.name.toLowerCase().includes(q)) : []
  suggest.innerHTML = hits.map((g) => `<li><button type="button" data-id="${g.id}"><span>${esc(g.name)}</span><span>${money(g.price)}</span></button></li>`).join('')
  suggest.hidden = !hits.length
})
suggest.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pick(+b.dataset.id) })
$('#searchForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const first = suggest.querySelector('button')
  first ? pick(+first.dataset.id) : toast('No results found')
})

/* ============ Keyboard ============ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeOverlay(); hideMenu(); suggest.hidden = true }
  const typing = /input|textarea/i.test(e.target.tagName)
  if (!typing && history_[pos] === 'store' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) setSlide(slide + (e.key === 'ArrowRight' ? 1 : -1))
})

render()
