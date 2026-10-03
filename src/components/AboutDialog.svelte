<script lang="ts">
  import { store } from '../lib/state.svelte';
  import { t } from '../lib/i18n.svelte';
  import { openExternal } from '../lib/platform';
  import { AMBIENCE_CREDITS } from '../lib/ambience-credits';
  import Modal from './Modal.svelte';
  import Icon from './Icon.svelte';
  import Logo from './Logo.svelte';
  import Signature from './Signature.svelte';
  import Ember from './Ember.svelte';

  const LINKEDIN = 'https://www.linkedin.com/in/an%C4%B1l-g%C3%BCl-753417249';
  const GITHUB = 'https://github.com/anilg12/Emberwise';

  let showCredits = $state(false);
</script>

<Modal open={store.aboutOpen} onclose={() => (store.aboutOpen = false)} width={500} label={t('common.about')}>
  <div class="about">
    <div class="glow" aria-hidden="true"></div>
    <div class="top">
      <Logo size={64} />
      <div>
        <h2>Emberwise</h2>
        <p class="ver">{t('settings.version', { v: __APP_VERSION__ })}</p>
      </div>
      <span class="mascot"><Ember size={46} mood="happy" /></span>
    </div>
    <p class="text">{t('settings.aboutText')}</p>
    <p class="offline"><Icon name="shield" size={14} />{t('settings.offline')}</p>

    <div class="sig">
      <Signature size={46} caption={t('settings.crafted')} />
    </div>
    <div class="links">
      <button class="btn sm ghost" onclick={() => openExternal(LINKEDIN)}><Icon name="linkedin" size={16} />{t('settings.linkedin')}</button>
      <button class="btn sm ghost" onclick={() => openExternal(GITHUB)}><Icon name="github" size={16} />{t('settings.github')}</button>
      <button class="btn sm ghost" onclick={() => (showCredits = !showCredits)} aria-expanded={showCredits}>
        <Icon name="heart" size={15} />{t('settings.credits')}
      </button>
    </div>

    {#if showCredits}
      <div class="credits">
        <p>{t('settings.soundCredits')}</p>
        <ul>
          {#each AMBIENCE_CREDITS as c (c.id)}
            <li>
              <b>{t(`focus.sounds.${c.id}`)}</b> ·
              <button class="link" onclick={() => openExternal(c.url)}>{c.title}</button>
              — {c.author} · {c.license}
            </li>
          {/each}
        </ul>
        <p>{t('settings.fonts')}</p>
      </div>
    {/if}
  </div>
</Modal>

<style>
  .about {
    position: relative;
    padding: 26px 26px 22px;
    overflow: hidden;
  }
  .glow {
    position: absolute;
    inset: -40% -20% auto auto;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent-soft), transparent 65%);
    pointer-events: none;
  }
  .top {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .top h2 {
    font-size: 26px;
  }
  .ver {
    font-weight: 800;
    font-size: 13px;
    color: var(--ink-3);
  }
  .mascot {
    margin-left: auto;
  }
  .text {
    position: relative;
    margin-top: 14px;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .offline {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--success);
  }
  .sig {
    display: flex;
    justify-content: center;
    margin: 18px 0 8px;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .credits {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    font-size: 12px;
    color: var(--ink-3);
    max-height: 200px;
    overflow: auto;
  }
  .credits ul {
    margin: 6px 0 8px;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .credits b {
    color: var(--ink-2);
  }
  .link {
    color: var(--accent-text);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-align: left;
  }
</style>
