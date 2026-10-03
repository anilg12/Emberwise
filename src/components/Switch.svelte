<script lang="ts">
  let {
    checked,
    onchange,
    label = '',
    disabled = false,
  }: { checked: boolean; onchange: (v: boolean) => void; label?: string; disabled?: boolean } = $props();
</script>

<button
  type="button"
  class="switch"
  class:on={checked}
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  onclick={() => onchange(!checked)}
>
  <span class="knob"></span>
</button>

<style>
  .switch {
    position: relative;
    flex: none;
    width: 44px;
    height: 26px;
    border-radius: 99px;
    background: var(--line-2);
    transition: background-color 0.25s var(--ease-out);
  }
  .switch.on {
    background: var(--accent);
  }
  .switch:disabled {
    opacity: 0.5;
  }
  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.2),
      0 1px 1px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s var(--ease-spring);
  }
  .on .knob {
    transform: translateX(18px);
  }
  .switch:active .knob {
    width: 24px;
  }
  .on:active .knob {
    transform: translateX(14px);
  }
</style>
