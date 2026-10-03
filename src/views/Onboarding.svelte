<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { sfx } from '../lib/sound';
  import { burst } from '../lib/confetti';
  import { platform } from '../lib/platform';
  import { reduced, rise } from '../lib/motion';
  import type { Body, HeroClass, Settings } from '../lib/types';
  import Ember from '../components/Ember.svelte';
  import Avatar from '../components/Avatar.svelte';
  import Scene from '../components/Scene.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Icon from '../components/Icon.svelte';
  import Signature from '../components/Signature.svelte';

  let step = $state(0);
  let dir = $state(1);
  let name = $state(store.data.profile.name);
  let shake = $state(false);
  let nameEl: HTMLInputElement | undefined = $state();

  const SKINS = ['#ffe3cc', '#f6cfab', '#e3ad83', '#c78c60', '#9c6541', '#6f462b'];
  const HAIRS = ['#2c2226', '#5b3a29', '#9a5631', '#dcae62', '#c9503c', '#8f8aa6', '#efe3cb', '#3f5f8f'];
  const CLASSES: HeroClass[] = ['wizard', 'knight', 'ranger', 'bard'];
  const look = $derived(store.data.profile.look);

  function slide(_n: Element, { d = 1 } = {}) {
    if (reduced()) return { duration: 0 };
    return {
      duration: 420,
      easing: cubicOut,
      css: (t: number, u: number) => `opacity:${t};transform:translateX(${u * 40 * d}px)`,
    };
  }

  function go(n: number) {
    dir = n > step ? 1 : -1;
    step = n;
    sfx.pop();
  }

  function next() {
    if (step === 1) {
      const v = name.trim();
      if (!v) {
        shake = false;
        requestAnimationFrame(() => (shake = true));
        setTimeout(() => (shake = false), 450);
        sfx.error();
        nameEl?.focus();
        return;
      }
      store.data.profile.name = v.slice(0, 40);
      store.persist();
    }
    if (step < 3) go(step + 1);
    else finish();
  }

  function finish() {
    store.data.onboarded = true;
    if (store.data.tasks.length === 0) {
      store.createTask({
        title: t('onboarding.sampleTask'),
        purpose: t('onboarding.samplePurpose'),
        difficulty: 'easy',
        date: store.today,
      });
    }
    store.navigate('today');
    store.persist();
    sfx.levelUp();
    if (!reduced()) setTimeout(() => burst({ count: 120 }), 200);
  }

  function setLook<K extends keyof typeof look>(key: K, value: (typeof look)[K]) {
    store.data.profile.look[key] = value;
    store.persist();
  }

  function setBody(b: Body) {
    setLook('body', b);
    if (b === 'f' && look.hair === 0) setLook('hair', 1);
    if (b === 'm' && look.hair === 1) setLook('hair', 0);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && step !== 1) {
      const el = e.target as HTMLElement;
      if (el.tagName === 'BUTTON') return;
      next();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="onb">
  <div class="drag bar" class:mac={platform === 'mac'}></div>
  <div class="glow g1"></div>
  <div class="glow g2"></div>

  <div class="card wrap" in:rise={{ y: 16, duration: 500 }}>
    <div class="dots" aria-hidden="true">
      {#each [0, 1, 2, 3] as i}
        <span class:on={i === step} class:past={i < step}></span>
      {/each}
    </div>

    <div class="steps">
      {#key step}
        <div class="step" in:slide={{ d: dir }}>
          {#if step === 0}
            <div class="welcome">
              <div class="ember-hero"><Ember size={128} mood="happy" /></div>
              <h1>{t('onboarding.welcome')}</h1>
              <p class="lead">{t('onboarding.welcomeText')}</p>
              <div class="prefs">
                <Segmented
                  size="sm"
                  options={[
                    { value: 'tr', label: 'Türkçe' },
                    { value: 'en', label: 'English' },
                  ]}
                  value={store.data.settings.lang}
                  onchange={(v) => store.setSetting('lang', v as Settings['lang'])}
                />
                <Segmented
                  size="sm"
                  options={[
                    { value: 'light', label: t('settings.themes.light'), icon: 'sun' },
                    { value: 'dark', label: t('settings.themes.dark'), icon: 'moon' },
                    { value: 'system', label: t('settings.themes.system'), icon: 'monitor' },
                  ]}
                  value={store.data.settings.theme}
                  onchange={(v) => store.setSetting('theme', v as Settings['theme'])}
                />
              </div>
            </div>
          {:else if step === 1}
            <div class="name-step">
              <div class="mini-stage">
                <Avatar {look} size={120} crop="bust" />
              </div>
              <h2>{t('onboarding.nameTitle')}</h2>
              <p class="lead">{t('onboarding.nameText')}</p>
              <!-- svelte-ignore a11y_autofocus -->
              <input
                bind:this={nameEl}
                class="input big"
                class:shake
                bind:value={name}
                placeholder={t('onboarding.namePh')}
                maxlength="40"
                autofocus
                onkeydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    next();
                  }
                }}
              />
            </div>
          {:else if step === 2}
            <div class="look-step">
              <div class="stage">
                <Scene id={null} />
                <div class="figure"><Avatar {look} size={200} /></div>
              </div>
              <div class="controls">
                <h2>{t('onboarding.lookTitle')}</h2>
                <p class="lead small">{t('onboarding.lookText')}</p>
                <div class="field">
                  <span class="label">{t('hero.body')}</span>
                  <Segmented
                    options={[
                      { value: 'f', label: t('hero.female') },
                      { value: 'm', label: t('hero.male') },
                    ]}
                    value={look.body}
                    onchange={(v) => setBody(v as Body)}
                  />
                </div>
                <div class="field">
                  <span class="label">{t('hero.skin')}</span>
                  <div class="swatches">
                    {#each SKINS as c, i}
                      <button class="sw" class:on={look.skin === i} style="--c:{c}" onclick={() => setLook('skin', i)} aria-label="{t('hero.skin')} {i + 1}"></button>
                    {/each}
                  </div>
                </div>
                <div class="field">
                  <span class="label">{t('hero.hair')}</span>
                  <div class="hairs">
                    {#each [0, 1, 2, 3, 4, 5] as h}
                      <button class="hair" class:on={look.hair === h} onclick={() => setLook('hair', h)} aria-label="{t('hero.hair')} {h + 1}">
                        <Avatar look={{ ...look, hair: h }} size={44} crop="head" animate={false} decorations={false} />
                      </button>
                    {/each}
                  </div>
                </div>
                <div class="field">
                  <span class="label">{t('hero.hairColor')}</span>
                  <div class="swatches">
                    {#each HAIRS as c, i}
                      <button class="sw small" class:on={look.hairColor === i} style="--c:{c}" onclick={() => setLook('hairColor', i)} aria-label="{t('hero.hairColor')} {i + 1}"></button>
                    {/each}
                  </div>
                </div>
                <div class="field">
                  <span class="label">{t('hero.heroClass')}</span>
                  <Segmented
                    full
                    size="sm"
                    options={CLASSES.map((c) => ({ value: c, label: t(`hero.classes.${c}`) }))}
                    value={look.heroClass}
                    onchange={(v) => setLook('heroClass', v as HeroClass)}
                  />
                </div>
              </div>
            </div>
          {:else}
            <div class="how">
              <h2>{t('onboarding.howTitle')}</h2>
              <ul>
                <li style="--c:#4a78c2">
                  <span class="h-icon"><Icon name="scroll" size={22} /></span>
                  <p>{t('onboarding.how1')}</p>
                </li>
                <li style="--c:#ee6c3a">
                  <span class="h-icon"><Icon name="flame" size={22} /></span>
                  <p>{t('onboarding.how2')}</p>
                </li>
                <li style="--c:#e0912b">
                  <span class="h-icon"><Icon name="crown" size={22} /></span>
                  <p>{t('onboarding.how3')}</p>
                </li>
              </ul>
              <div class="hero-row">
                <Avatar {look} size={110} crop="bust" />
                <div class="bubble">
                  <strong>{store.data.profile.name}</strong>
                  <span>{t('ranks.novice')} · {t('common.level')} 1</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/key}
    </div>

    <div class="nav">
      {#if step > 0}
        <button class="btn ghost" onclick={() => go(step - 1)}><Icon name="left" size={16} />{t('common.back')}</button>
      {:else}
        <span></span>
      {/if}
      <button class="btn primary lg" onclick={next}>
        {step === 0 ? t('onboarding.start') : step === 3 ? t('onboarding.begin') : t('common.next')}
        <Icon name={step === 3 ? 'spark' : 'arrow'} size={17} />
      </button>
    </div>
  </div>

  <div class="foot"><Signature size={30} caption={t('settings.crafted')} /></div>
</div>

<style>
  .onb {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 40px 24px 24px;
    overflow-x: hidden;
    overflow-y: auto;
    background: var(--bg);
  }
  .bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--titlebar-h);
  }
  .bar.mac {
    height: 50px;
  }
  .glow {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
  }
  .g1 {
    width: 460px;
    height: 460px;
    left: -120px;
    top: -140px;
    background: var(--accent-soft);
  }
  .g2 {
    width: 420px;
    height: 420px;
    right: -140px;
    bottom: -160px;
    background: var(--gold-soft);
  }
  .wrap {
    position: relative;
    width: min(780px, 100%);
    padding: 22px 28px 22px;
    border-radius: 28px;
    box-shadow: var(--shadow-lg);
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .dots span {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: var(--line-2);
    transition: width 0.35s var(--ease-out), background-color 0.35s;
  }
  .dots span.past {
    background: color-mix(in srgb, var(--accent) 45%, var(--line-2));
  }
  .dots span.on {
    width: 26px;
    background: var(--accent);
  }
  .steps {
    display: grid;
    min-height: 430px;
  }
  .step {
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .welcome,
  .name-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  .ember-hero {
    margin-bottom: 4px;
  }
  h1 {
    font-size: 34px;
  }
  h2 {
    font-size: 26px;
  }
  .lead {
    max-width: 470px;
    color: var(--ink-2);
    font-size: 15.5px;
    line-height: 1.55;
  }
  .lead.small {
    font-size: 13.5px;
    color: var(--ink-3);
    margin-bottom: 4px;
  }
  .prefs {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 14px;
  }
  .mini-stage {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 70%, var(--accent-soft), var(--stage) 70%);
    display: grid;
    place-items: end center;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .input.big {
    max-width: 360px;
    height: 54px;
    font-size: 19px;
    text-align: center;
    border-radius: 16px;
    margin-top: 10px;
  }
  .shake {
    animation: shake 0.42s var(--ease-out);
  }
  @keyframes shake {
    20% {
      transform: translateX(-7px);
    }
    40% {
      transform: translateX(7px);
    }
    60% {
      transform: translateX(-4px);
    }
    80% {
      transform: translateX(3px);
    }
  }
  .look-step {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 24px;
    align-items: center;
  }
  .stage {
    position: relative;
    height: 330px;
    border-radius: 20px;
    overflow: hidden;
    isolation: isolate;
  }
  .figure {
    position: absolute;
    left: 50%;
    bottom: 8px;
    transform: translateX(-50%);
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .controls h2 {
    font-size: 22px;
  }
  .field .label {
    margin-bottom: 6px;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .sw {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: inset 0 0 0 1px var(--swatch-ring);
    transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
  }
  .sw.small {
    width: 24px;
    height: 24px;
  }
  .sw:hover {
    transform: scale(1.1);
  }
  .sw.on {
    box-shadow:
      inset 0 0 0 1px var(--swatch-ring),
      0 0 0 3px var(--surface),
      0 0 0 5px var(--accent);
  }
  .hairs {
    display: flex;
    gap: 6px;
  }
  .hair {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--stage);
    border: 2px solid transparent;
    transition: border-color 0.2s, transform 0.2s var(--ease-out);
  }
  .hair:hover {
    transform: translateY(-2px);
  }
  .hair.on {
    border-color: var(--accent);
  }
  .how {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
  }
  .how ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 520px;
  }
  .how li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 16px;
    background: var(--surface-2);
    border: 1px solid var(--line);
  }
  .h-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 14%, transparent);
    flex: none;
  }
  .how li p {
    font-weight: 700;
    font-size: 15px;
  }
  .hero-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bubble {
    display: flex;
    flex-direction: column;
    padding: 10px 16px;
    border-radius: 16px 16px 16px 4px;
    background: var(--accent-soft);
  }
  .bubble strong {
    font-family: var(--font-display);
    font-size: 18px;
  }
  .bubble span {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent-text);
  }
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
  .foot {
    position: relative;
    opacity: 0.9;
  }
</style>
