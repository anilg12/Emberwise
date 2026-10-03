<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './lib/state.svelte';
  import { timer } from './lib/timer.svelte';
  import { fx } from './lib/fx.svelte';
  import { t } from './lib/i18n.svelte';
  import { sfx, configureSfx } from './lib/sound';
  import { playAmbient, stopAmbient, setAmbientLevel } from './lib/ambient';
  import { focusOn } from './lib/actions';
  import { rise } from './lib/motion';
  import {
    platform,
    notify,
    setNativeTheme,
    setCloseToTray,
    onTrayAction,
    onNavigate,
    onResume,
  } from './lib/platform';
  import type { Route } from './lib/types';

  import Sidebar from './components/Sidebar.svelte';
  import Toasts from './components/Toasts.svelte';
  import Floaters from './components/Floaters.svelte';
  import LevelUp from './components/LevelUp.svelte';
  import TaskEditor from './components/TaskEditor.svelte';
  import Onboarding from './views/Onboarding.svelte';
  import Today from './views/Today.svelte';
  import Quests from './views/Quests.svelte';
  import Focus from './views/Focus.svelte';
  import Hero from './views/Hero.svelte';
  import Shop from './views/Shop.svelte';
  import Awards from './views/Awards.svelte';
  import Stats from './views/Stats.svelte';
  import Settings from './views/Settings.svelte';

  const ROUTES: Route[] = ['today', 'quests', 'focus', 'hero', 'shop', 'awards', 'stats'];

  let scroller: HTMLDivElement | undefined = $state();

  onMount(() => {
    const root = document.documentElement;
    root.classList.add(`platform-${platform}`);

    const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    store.systemDark = darkMq.matches;
    store.systemReducedMotion = motionMq.matches;
    const onDark = () => (store.systemDark = darkMq.matches);
    const onMotion = () => (store.systemReducedMotion = motionMq.matches);
    darkMq.addEventListener('change', onDark);
    motionMq.addEventListener('change', onMotion);

    store.onReminder = ({ task }) => {
      sfx.reminder();
      const id = task.id;
      fx.toast({
        kind: 'reminder',
        icon: 'bell',
        title: t('reminder.title'),
        body: `${t('reminder.body', { task: task.title })} — ${t('reminder.sub')}`,
        action: { label: t('reminder.start'), run: () => focusOn(store.task(id) ?? null) },
        duration: 15000,
      });
      if (store.data.settings.notifications) {
        notify(t('reminder.title'), `${t('reminder.body', { task: task.title })}\n${t('reminder.sub')}`, 'quests');
      }
    };

    let disposed = false;
    store.init().then(() => {
      if (disposed) return;
      timer.restore();
      store.checkReminders();
      requestAnimationFrame(() => root.classList.add('theme-ready'));
    });

    const interval = setInterval(() => {
      store.tick();
      store.checkReminders();
    }, 15_000);

    const wake = () => {
      store.tick();
      timer.wake();
      store.checkReminders();
    };
    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Decorative loops rest while the window is in the background.
    const onBlur = () => root.classList.add('paused-anim');
    const onFocus = () => {
      root.classList.remove('paused-anim');
      wake();
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    const offTray = onTrayAction((a) => {
      if (a === 'toggle-timer') timer.toggle();
    });
    const offNav = onNavigate((r) => {
      if (r === 'settings' || ROUTES.includes(r as Route)) store.navigate(r as Route);
    });
    const offResume = onResume(wake);

    const onUnload = () => store.flush();
    window.addEventListener('beforeunload', onUnload);

    return () => {
      disposed = true;
      clearInterval(interval);
      darkMq.removeEventListener('change', onDark);
      motionMq.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeunload', onUnload);
      offTray();
      offNav();
      offResume();
    };
  });

  // Theme, accent, motion and language → <html>, the native title bar and the pre-paint hint.
  $effect(() => {
    const root = document.documentElement;
    const s = store.data.settings;
    const dark = store.dark;
    root.classList.toggle('dark', dark);
    for (const c of [...root.classList]) if (c.startsWith('accent-')) root.classList.remove(c);
    if (s.accent !== 'ember') root.classList.add(`accent-${s.accent}`);
    root.classList.toggle('reduce-motion', store.reducedMotion);
    root.lang = s.lang;
    try {
      localStorage.setItem('emberwise-theme-hint', JSON.stringify({ dark, accent: s.accent, lang: s.lang }));
    } catch {
      /* storage may be unavailable */
    }
    setNativeTheme(s.theme, dark, dark ? '#17131f' : '#fbf6ee', dark ? '#efe7dc' : '#3b3149');
  });

  $effect(() => {
    configureSfx(store.data.settings.sounds, store.data.settings.volume);
  });

  $effect(() => {
    setCloseToTray(store.data.settings.closeToTray);
  });

  // Ambience plays while a focus session is running. Only stop what we started,
  // so a short preview on the Focus page isn't cut off.
  let ambientByTimer = false;
  $effect(() => {
    const kind = store.data.settings.ambient;
    const on = timer.status === 'running' && timer.phase === 'focus' && kind !== 'off';
    setAmbientLevel(store.data.settings.ambientVolume);
    if (on) {
      playAmbient(kind);
      ambientByTimer = true;
    } else if (ambientByTimer) {
      stopAmbient();
      ambientByTimer = false;
    }
  });

  // Keep the idle timer in sync with duration settings.
  $effect(() => {
    store.data.settings.focusMin;
    store.data.settings.shortMin;
    store.data.settings.longMin;
    if (store.ready) timer.syncIdleDuration();
  });

  // Re-publish the tray labels when the language changes.
  $effect(() => {
    store.data.settings.lang;
    if (store.ready) timer.publish();
  });

  $effect(() => {
    store.route;
    if (scroller) scroller.scrollTop = 0;
  });

  function isTyping(e: KeyboardEvent) {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return false;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable || el.getAttribute('role') === 'spinbutton';
  }

  function onkeydown(e: KeyboardEvent) {
    if (!store.ready || !store.data.onboarded) return;
    const mod = platform === 'mac' ? e.metaKey : e.ctrlKey;
    if (mod && !e.shiftKey && !e.altKey) {
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        store.openEditor(null, { date: store.today });
        return;
      }
      if (e.key === ',') {
        e.preventDefault();
        store.navigate('settings');
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= ROUTES.length) {
        e.preventDefault();
        store.navigate(ROUTES[n - 1]);
        return;
      }
    }
    if (store.editor.open || fx.celebrations.length) return;
    if (isTyping(e)) return;
    if (e.key === ' ' && store.route === 'focus') {
      e.preventDefault();
      timer.toggle();
    }
  }
</script>

<svelte:window {onkeydown} />

{#if store.ready}
  {#if !store.data.onboarded}
    <Onboarding />
  {:else}
    <div class="shell">
      <Sidebar />
      <main class="main">
        <div class="titlebar drag" class:mac={platform === 'mac'}></div>
        <div class="scroller" bind:this={scroller}>
          {#key store.route}
            <div class="view" in:rise={{ y: 8, duration: 300 }}>
              {#if store.route === 'today'}
                <Today />
              {:else if store.route === 'quests'}
                <Quests />
              {:else if store.route === 'focus'}
                <Focus />
              {:else if store.route === 'hero'}
                <Hero />
              {:else if store.route === 'shop'}
                <Shop />
              {:else if store.route === 'awards'}
                <Awards />
              {:else if store.route === 'stats'}
                <Stats />
              {:else}
                <Settings />
              {/if}
            </div>
          {/key}
        </div>
      </main>
    </div>
    <TaskEditor />
  {/if}
  <LevelUp />
  <Toasts />
  <Floaters />
{/if}

<style>
  .shell {
    display: flex;
    height: 100%;
  }
  .main {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }
  .titlebar {
    flex: none;
    height: var(--titlebar-h);
  }
  .titlebar.mac {
    height: 50px;
  }
  .scroller {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-gutter: stable;
  }
  :global(html.paused-anim *) {
    animation-play-state: paused !important;
  }
</style>
