<script lang="ts">
  import { onMount } from 'svelte';
  import { store, categoryName, categoryColor, nextCategoryColor, CATEGORY_COLORS } from '../lib/state.svelte';
  import { t, i18n } from '../lib/i18n.svelte';
  import { fx } from '../lib/fx.svelte';
  import { sfx } from '../lib/sound';
  import { uid } from '../lib/game';
  import { rise } from '../lib/motion';
  import {
    exportFile,
    importFile,
    isElectron,
    modKey,
    notify,
    openExternal,
    platform,
    setOpenAtLogin,
    getOpenAtLogin,
  } from '../lib/platform';
  import type { Accent, Settings } from '../lib/types';
  import Icon from '../components/Icon.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Switch from '../components/Switch.svelte';
  import Stepper from '../components/Stepper.svelte';
  import Logo from '../components/Logo.svelte';
  import Signature from '../components/Signature.svelte';
  import Modal from '../components/Modal.svelte';

  const ACCENTS: { id: Accent; color: string }[] = [
    { id: 'ember', color: '#ee6c3a' },
    { id: 'rose', color: '#dc5a7b' },
    { id: 'ocean', color: '#3a7fc4' },
    { id: 'forest', color: '#3e9466' },
    { id: 'plum', color: '#8a5cc4' },
    { id: 'honey', color: '#d48b12' },
  ];

  const LINKEDIN = 'https://www.linkedin.com/in/an%C4%B1l-g%C3%BCl-753417249';
  const GITHUB = 'https://github.com/anilg12/Emberwise';

  const version = __APP_VERSION__;
  let resetOpen = $state(false);
  let resetText = $state('');
  let importConfirm = $state<string | null>(null);

  const s = $derived(store.data.settings);

  onMount(async () => {
    if (isElectron) {
      const actual = await getOpenAtLogin();
      if (actual !== store.data.settings.openAtLogin) store.setSetting('openAtLogin', actual);
    }
  });

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    store.setSetting(k, v);
  }

  async function doExport() {
    const date = new Date().toISOString().slice(0, 10);
    const r = await exportFile(store.exportText(), `emberwise-backup-${date}.json`, t('settings.export'));
    if (r.ok) fx.toast({ kind: 'success', icon: 'download', title: t('settings.exported') });
  }

  async function doImport() {
    const r = await importFile(t('settings.import'));
    if (!r.ok || !r.text) return;
    importConfirm = r.text;
  }

  function confirmImport() {
    if (!importConfirm) return;
    const ok = store.importText(importConfirm);
    importConfirm = null;
    if (ok) {
      sfx.complete();
      fx.toast({ kind: 'success', icon: 'upload', title: t('settings.imported') });
    } else {
      sfx.error();
      fx.toast({ kind: 'warn', icon: 'alert', title: t('settings.importError') });
    }
  }

  function doReset() {
    if (resetText.trim().toLocaleUpperCase(i18n.locale) !== t('settings.resetWord')) return;
    resetOpen = false;
    resetText = '';
    store.resetAll();
  }

  function cycleColor(id: string) {
    const c = store.data.categories.find((x) => x.id === id);
    if (!c) return;
    const i = CATEGORY_COLORS.indexOf(c.color.toLowerCase());
    c.color = CATEGORY_COLORS[(i + 1) % CATEGORY_COLORS.length];
    store.persist();
  }

  function renameCategory(id: string, name: string) {
    const c = store.data.categories.find((x) => x.id === id);
    if (!c) return;
    c.name = name.slice(0, 40);
    store.persist();
  }

  function removeCategory(id: string) {
    store.data.categories = store.data.categories.filter((c) => c.id !== id);
    for (const task of store.data.tasks) if (task.categoryId === id) task.categoryId = null;
    store.persist();
  }

  function addCategory() {
    store.data.categories.push({
      id: `cat_${uid()}`,
      name: t('editor.newCategory'),
      color: nextCategoryColor(store.data.categories.map((c) => c.color)),
    });
    store.persist();
  }

  function testNotification() {
    notify(t('settings.testTitle'), t('settings.testBody'), 'settings');
    sfx.reminder();
  }
</script>

<div class="page">
  <header class="page-head" in:rise>
    <div>
      <h1>{t('settings.title')}</h1>
      <p>{t('settings.subtitle')}</p>
    </div>
  </header>

  <div class="cols">
    <div class="col">
      <section class="card" in:rise={{ delay: 30 }}>
        <h2><Icon name="palette" size={18} />{t('settings.appearance')}</h2>
        <div class="row stack">
          <span class="row-label">{t('settings.theme')}</span>
          <div class="themes">
            {#each ['light', 'dark', 'system'] as const as th}
              <button class="theme {th}" class:on={s.theme === th} onclick={() => set('theme', th)}>
                <span class="mock">
                  <span class="m-side"></span>
                  <span class="m-main"><i></i><i></i><i class="short"></i></span>
                </span>
                <span class="th-label"><Icon name={th === 'light' ? 'sun' : th === 'dark' ? 'moon' : 'monitor'} size={15} />{t(`settings.themes.${th}`)}</span>
              </button>
            {/each}
          </div>
        </div>
        <div class="row">
          <span class="row-label">{t('settings.accent')}</span>
          <div class="accents">
            {#each ACCENTS as a (a.id)}
              <button class="acc" class:on={s.accent === a.id} style="--c:{a.color}" onclick={() => set('accent', a.id)} title={t(`settings.accents.${a.id}`)} aria-label={t(`settings.accents.${a.id}`)}>
                {#if s.accent === a.id}<Icon name="check" size={14} stroke={3} />{/if}
              </button>
            {/each}
          </div>
        </div>
        <div class="row">
          <span class="row-label">{t('settings.motion')}</span>
          <Segmented
            size="sm"
            options={[
              { value: 'system', label: t('settings.motions.system') },
              { value: 'full', label: t('settings.motions.full') },
              { value: 'reduced', label: t('settings.motions.reduced') },
            ]}
            value={s.motion}
            onchange={(v) => set('motion', v as Settings['motion'])}
          />
        </div>
        <div class="row">
          <span class="row-label"><Icon name="globe" size={16} />{t('settings.language')}</span>
          <Segmented
            size="sm"
            options={[
              { value: 'tr', label: 'Türkçe' },
              { value: 'en', label: 'English' },
            ]}
            value={s.lang}
            onchange={(v) => set('lang', v as Settings['lang'])}
          />
        </div>
      </section>

      <section class="card" in:rise={{ delay: 60 }}>
        <h2><Icon name="hourglass" size={18} />{t('settings.timer')}</h2>
        <div class="row">
          <span class="row-label">{t('settings.focusLen')}</span>
          <Stepper value={s.focusMin} min={5} max={120} step={5} unit={t('common.min')} onchange={(v) => set('focusMin', v)} label={t('settings.focusLen')} />
        </div>
        <div class="row">
          <span class="row-label">{t('settings.shortLen')}</span>
          <Stepper value={s.shortMin} min={1} max={30} unit={t('common.min')} onchange={(v) => set('shortMin', v)} label={t('settings.shortLen')} />
        </div>
        <div class="row">
          <span class="row-label">{t('settings.longLen')}</span>
          <Stepper value={s.longMin} min={5} max={60} step={5} unit={t('common.min')} onchange={(v) => set('longMin', v)} label={t('settings.longLen')} />
        </div>
        <div class="row">
          <span class="row-label">{t('settings.longEvery')}</span>
          <Stepper value={s.longEvery} min={2} max={8} unit="×" onchange={(v) => set('longEvery', v)} label={t('settings.longEvery')} />
        </div>
        <div class="row">
          <span class="row-label">{t('settings.autoBreak')}</span>
          <Switch checked={s.autoBreak} onchange={(v) => set('autoBreak', v)} label={t('settings.autoBreak')} />
        </div>
        <div class="row">
          <span class="row-label">{t('settings.autoFocus')}</span>
          <Switch checked={s.autoFocus} onchange={(v) => set('autoFocus', v)} label={t('settings.autoFocus')} />
        </div>
        {#if isElectron}
          <div class="row">
            <span class="row-label">{t('settings.pinWhileFocus')}</span>
            <Switch checked={s.pinWhileFocus} onchange={(v) => set('pinWhileFocus', v)} label={t('settings.pinWhileFocus')} />
          </div>
        {/if}
      </section>

      <section class="card" in:rise={{ delay: 90 }}>
        <h2><Icon name="volume" size={18} />{t('settings.sound')} & {t('settings.notifications')}</h2>
        <div class="row">
          <span class="row-label">{t('settings.sounds')}</span>
          <Switch checked={s.sounds} onchange={(v) => set('sounds', v)} label={t('settings.sounds')} />
        </div>
        <div class="row">
          <span class="row-label">{t('settings.volume')}</span>
          <div class="vol" class:dim={!s.sounds}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={s.volume}
              style="--p:{s.volume * 100}%"
              disabled={!s.sounds}
              oninput={(e) => set('volume', Number((e.currentTarget as HTMLInputElement).value))}
              onchange={() => sfx.complete()}
              aria-label={t('settings.volume')}
            />
            <button class="btn sm ghost" disabled={!s.sounds} onclick={() => sfx.levelUp()}>{t('settings.test')}</button>
          </div>
        </div>
        <div class="row">
          <div class="row-text">
            <span class="row-label">{t('settings.notifications')}</span>
            <span class="row-desc">{t('settings.notificationsDesc')}</span>
          </div>
          <Switch checked={s.notifications} onchange={(v) => set('notifications', v)} label={t('settings.notifications')} />
        </div>
        <div class="row end">
          <button class="btn sm" disabled={!s.notifications} onclick={testNotification}><Icon name="bell" size={15} />{t('settings.testNotification')}</button>
        </div>
      </section>
    </div>

    <div class="col">
      {#if isElectron}
        <section class="card" in:rise={{ delay: 45 }}>
          <h2><Icon name="power" size={18} />{t('settings.system')}</h2>
          <div class="row">
            <span class="row-label">{t('settings.openAtLogin')}</span>
            <Switch
              checked={s.openAtLogin}
              onchange={(v) => {
                set('openAtLogin', v);
                setOpenAtLogin(v);
              }}
              label={t('settings.openAtLogin')}
            />
          </div>
          {#if platform !== 'mac'}
            <div class="row">
              <div class="row-text">
                <span class="row-label">{t('settings.closeToTray')}</span>
                <span class="row-desc">{t('settings.closeToTrayDesc')}</span>
              </div>
              <Switch checked={s.closeToTray} onchange={(v) => set('closeToTray', v)} label={t('settings.closeToTray')} />
            </div>
          {/if}
        </section>
      {/if}

      <section class="card" in:rise={{ delay: 75 }}>
        <h2><Icon name="tag" size={18} />{t('settings.categories')}</h2>
        <ul class="cat-list">
          {#each store.data.categories as c (c.id)}
            <li>
              <button class="dot" style="--c:{categoryColor(c.color, store.dark)}" onclick={() => cycleColor(c.id)} aria-label={t('settings.accent')}></button>
              <input
                class="cat-name"
                value={categoryName(c)}
                maxlength="40"
                oninput={(e) => renameCategory(c.id, (e.currentTarget as HTMLInputElement).value)}
                onblur={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  if (!el.value.trim() && !c.key) renameCategory(c.id, t('editor.newCategory'));
                  el.value = categoryName(c);
                }}
              />
              <button class="icon-btn danger" onclick={() => removeCategory(c.id)} aria-label={t('common.delete')}><Icon name="trash" size={16} /></button>
            </li>
          {/each}
        </ul>
        <button class="btn sm ghost add-cat" onclick={addCategory}><Icon name="plus" size={15} />{t('settings.addCategory')}</button>
      </section>

      <section class="card" in:rise={{ delay: 105 }}>
        <h2><Icon name="shield" size={18} />{t('settings.data')}</h2>
        <p class="desc">{t('settings.dataDesc')}</p>
        <div class="data-actions">
          <button class="btn" onclick={doExport}><Icon name="download" size={16} />{t('settings.export')}</button>
          <button class="btn" onclick={doImport}><Icon name="upload" size={16} />{t('settings.import')}</button>
          <button class="btn danger-soft" onclick={() => (resetOpen = true)}><Icon name="trash" size={16} />{t('settings.reset')}</button>
        </div>
      </section>

      <section class="card" in:rise={{ delay: 135 }}>
        <h2><Icon name="keyboard" size={18} />{t('settings.shortcuts')}</h2>
        <ul class="keys">
          <li><span>{t('settings.keys.newTask')}</span><span><kbd class="kbd">{modKey}</kbd><kbd class="kbd">N</kbd></span></li>
          <li><span>{t('settings.keys.navigate')}</span><span><kbd class="kbd">{modKey}</kbd><kbd class="kbd">1</kbd>…<kbd class="kbd">7</kbd></span></li>
          <li><span>{t('settings.keys.timer')}</span><span><kbd class="kbd">Space</kbd></span></li>
          <li><span>{t('settings.keys.search')}</span><span><kbd class="kbd">/</kbd></span></li>
          <li><span>{t('settings.keys.settings')}</span><span><kbd class="kbd">{modKey}</kbd><kbd class="kbd">,</kbd></span></li>
          <li><span>{t('settings.keys.close')}</span><span><kbd class="kbd">Esc</kbd></span></li>
        </ul>
      </section>

      <section class="card about" in:rise={{ delay: 165 }}>
        <div class="about-top">
          <Logo size={58} />
          <div>
            <h2 class="app-name">Emberwise</h2>
            <p class="ver">{t('settings.version', { v: version })}</p>
          </div>
        </div>
        <p class="desc">{t('settings.aboutText')}</p>
        <div class="maker">
          <Signature size={44} caption={t('settings.crafted')} />
        </div>
        <div class="links">
          <button class="btn sm ghost" onclick={() => openExternal(LINKEDIN)}><Icon name="linkedin" size={16} />{t('settings.linkedin')}</button>
          <button class="btn sm ghost" onclick={() => openExternal(GITHUB)}><Icon name="github" size={16} />{t('settings.github')}</button>
        </div>
      </section>
    </div>
  </div>
</div>

<Modal open={resetOpen} onclose={() => (resetOpen = false)} width={420} label={t('settings.reset')}>
  <div class="dialog">
    <span class="d-icon"><Icon name="alert" size={22} /></span>
    <h3>{t('settings.reset')}</h3>
    <p>{t('settings.resetDesc')}</p>
    <label class="label" for="reset-input">{t('settings.resetConfirm')}</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="reset-input" class="input" bind:value={resetText} placeholder={t('settings.resetWord')} autofocus onkeydown={(e) => e.key === 'Enter' && doReset()} />
    <div class="d-actions">
      <button class="btn ghost" onclick={() => (resetOpen = false)}>{t('common.cancel')}</button>
      <button class="btn danger" disabled={resetText.trim().toLocaleUpperCase(i18n.locale) !== t('settings.resetWord')} onclick={doReset}>{t('settings.reset')}</button>
    </div>
  </div>
</Modal>

<Modal open={importConfirm !== null} onclose={() => (importConfirm = null)} width={420} label={t('settings.import')}>
  <div class="dialog">
    <span class="d-icon info"><Icon name="upload" size={22} /></span>
    <h3>{t('settings.import')}</h3>
    <p>{t('settings.importConfirm')}</p>
    <div class="d-actions">
      <button class="btn ghost" onclick={() => (importConfirm = null)}>{t('common.cancel')}</button>
      <!-- svelte-ignore a11y_autofocus -->
      <button class="btn primary" onclick={confirmImport} autofocus>{t('settings.import')}</button>
    </div>
  </div>
</Modal>

<style>
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .card {
    padding: 18px 20px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 17px;
    margin-bottom: 8px;
  }
  h2 :global(svg) {
    color: var(--accent);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  h2 + .row {
    border-top: none;
  }
  .row.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .row.end {
    justify-content: flex-end;
    border-top: none;
    padding-top: 0;
  }
  .row-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 750;
    font-size: 14px;
  }
  .row-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .row-desc {
    font-size: 12.5px;
    color: var(--ink-3);
  }
  .themes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .theme {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border-radius: 14px;
    border: 1.5px solid var(--line);
    background: var(--surface-2);
    transition: border-color 0.2s, transform 0.2s var(--ease-out);
  }
  .theme:hover {
    transform: translateY(-2px);
  }
  .theme.on {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
  .mock {
    display: flex;
    height: 62px;
    border-radius: 9px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
  .m-side {
    width: 30%;
  }
  .m-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 8px;
  }
  .m-main i {
    height: 7px;
    border-radius: 4px;
  }
  .m-main i.short {
    width: 55%;
  }
  .light .m-side {
    background: #f4ece0;
  }
  .light .m-main {
    background: #fbf6ee;
  }
  .light .m-main i {
    background: #e8dccb;
  }
  .light .m-main i:first-child {
    background: #ee6c3a;
    width: 40%;
  }
  .dark .m-side {
    background: #1c1725;
  }
  .dark .m-main {
    background: #17131f;
  }
  .dark .m-main i {
    background: #342b40;
  }
  .dark .m-main i:first-child {
    background: #ff8150;
    width: 40%;
  }
  .system .m-side {
    background: linear-gradient(135deg, #f4ece0 50%, #1c1725 50%);
  }
  .system .m-main {
    background: linear-gradient(135deg, #fbf6ee 50%, #17131f 50%);
  }
  .system .m-main i {
    background: #9d91a9;
    opacity: 0.6;
  }
  .th-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 750;
  }
  .accents {
    display: flex;
    gap: 8px;
  }
  .acc {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--c);
    color: #fff;
    transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
  }
  .acc:hover {
    transform: scale(1.1);
  }
  .acc.on {
    box-shadow:
      0 0 0 3px var(--surface),
      0 0 0 5px var(--c);
  }
  .vol {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 220px;
  }
  .vol.dim {
    opacity: 0.5;
  }
  .vol input {
    flex: 1;
  }
  .cat-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cat-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--c);
    flex: none;
    transition: transform 0.2s var(--ease-spring);
  }
  .dot:hover {
    transform: scale(1.15);
  }
  .cat-name {
    flex: 1;
    height: 34px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 9px;
    padding: 0 10px;
    font-weight: 700;
  }
  .cat-name:hover {
    background: var(--surface-2);
  }
  .cat-name:focus {
    border-color: var(--accent);
    background: var(--surface);
  }
  .add-cat {
    margin-top: 6px;
  }
  .desc {
    color: var(--ink-3);
    font-size: 13.5px;
    margin-bottom: 14px;
  }
  .data-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .keys {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .keys li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    font-size: 13.5px;
    font-weight: 650;
    color: var(--ink-2);
    border-top: 1px solid var(--line);
  }
  .keys li:first-child {
    border-top: none;
  }
  .keys li > span:last-child {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
    color: var(--ink-4);
  }
  .about {
    text-align: left;
    background:
      radial-gradient(circle at 100% 0%, var(--accent-softer), transparent 50%),
      var(--surface);
  }
  .about-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
  }
  .app-name {
    font-size: 24px;
    margin: 0;
  }
  .ver {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .maker {
    display: flex;
    justify-content: center;
    padding: 8px 0 14px;
  }
  .links {
    display: flex;
    justify-content: center;
    gap: 6px;
  }
  .dialog {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .d-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--danger-soft);
    color: var(--danger);
    margin-bottom: 4px;
  }
  .d-icon.info {
    background: var(--info-soft);
    color: var(--info);
  }
  .dialog h3 {
    font-size: 20px;
  }
  .dialog p {
    color: var(--ink-3);
    margin-bottom: 8px;
  }
  .d-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }
  @media (max-width: 1100px) {
    .cols {
      grid-template-columns: 1fr;
    }
  }
</style>
