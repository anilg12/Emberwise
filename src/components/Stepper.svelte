<script lang="ts">
  let {
    value,
    min,
    max,
    step = 1,
    unit = '',
    onchange,
    label = '',
  }: { value: number; min: number; max: number; step?: number; unit?: string; onchange: (v: number) => void; label?: string } = $props();

  function set(v: number) {
    onchange(Math.min(max, Math.max(min, v)));
  }
</script>

<div class="stepper" role="group" aria-label={label}>
  <button onclick={() => set(value - step)} disabled={value <= min} aria-label="−"><span>−</span></button>
  <span class="val num">{value}<small>{unit}</small></span>
  <button onclick={() => set(value + step)} disabled={value >= max} aria-label="+"><span>+</span></button>
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--surface-3);
    border: 1px solid var(--line);
  }
  button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    font-size: 18px;
    font-weight: 700;
    color: var(--ink-2);
    transition: background-color 0.15s, transform 0.15s var(--ease-out);
  }
  button:hover:not(:disabled) {
    background: var(--surface);
  }
  button:active:not(:disabled) {
    transform: scale(0.9);
  }
  button:disabled {
    opacity: 0.35;
  }
  .val {
    min-width: 62px;
    text-align: center;
    font-weight: 800;
    font-size: 14.5px;
  }
  small {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-3);
    margin-left: 3px;
  }
</style>
