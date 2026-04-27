<script>
  import Component from "../src/Component.svelte"
  import pkg from "../package.json"
  import { getContext } from "svelte"

  const { styleable } = getContext("sdk")
  const component = getContext("component")

  $: styles = {
    normal: {},
    id: $component.id,
    interactive: true,
  }
</script>

<svelte:boundary>
  <Component {...$$restProps}>
    <slot />
  </Component>

  {#snippet failed(error)}
    <div class="error" use:styleable={styles}>
      <b>There was an error running the "{pkg.name}" plugin:</b>
      <div class="detail">
        {error?.message ?? error}
      </div>
    </div>
  {/snippet}
</svelte:boundary>

<style>
  .error {
    background: var(--spectrum-global-color-red-400);
    color: white;
    border-radius: 4px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 8px;
    min-width: 400px;
  }
  .detail {
    font-family: monospace;
    font-size: 10px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    max-height: 100px;
    overflow: auto;
  }
</style>
