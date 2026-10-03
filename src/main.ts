import '@fontsource-variable/nunito/wght.css';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource/caveat/latin-600.css';
import '@fontsource/caveat/latin-ext-600.css';
import '@fontsource/caveat/latin-700.css';
import '@fontsource/caveat/latin-ext-700.css';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

async function start() {
  if (import.meta.env.DEV && location.hash === '#gallery') {
    const { default: Gallery } = await import('./dev/Gallery.svelte');
    return mount(Gallery, { target: document.getElementById('app')! });
  }
  return mount(App, { target: document.getElementById('app')! });
}

const app = start();

export default app;
