<script>
  import { getContext, untrack } from "svelte";
  import "@spectrum-css/accordion";

  let { label, openDefault, size, width } = $props();

  const { styleable } = getContext("sdk");
  const component = getContext("component");

  // Match the Svelte 4 `$: open = openDefault` behavior: re-sync when the
  // setting changes, but allow the click handler to toggle it in between.
  let open = $state(openDefault);
  $effect(() => {
    const next = openDefault;
    untrack(() => { open = next; });
  });
</script>

<div use:styleable={$component.styles}>
  <div style:width class="spectrum-Accordion" role="region">
    <div
      class="spectrum-Accordion-item"
      class:is-open={open}
      role="presentation"
    >
      <h3 class="spectrum-Accordion-itemHeading">
        <button
          onclick={() => (open = !open)}
          style:font-size={size}
          class="spectrum-Accordion-itemHeader"
          type="button"
          id="spectrum-accordion-item-header"
          aria-controls="spectrum-accordion-item-content"
          aria-expanded="true">{label || " "}</button
        >
        <svg
          class="spectrum-Icon spectrum-UIIcon-ChevronRight100 spectrum-Accordion-itemIndicator"
          focusable="false"
          aria-hidden="true"
        >
          <use xlink:href="#spectrum-css-icon-Chevron100" />
        </svg>
      </h3>

      <div
        class="spectrum-Accordion-itemContent"
        role="region"
        id="spectrum-accordion-item-content"
        aria-labelledby="spectrum-accordion-item-header"
      >
        <slot />
      </div>
    </div>
  </div>
</div>

<style>
  .spectrum-Accordion-itemHeader {
    min-height: 0;
  }
</style>
