<script lang="ts">
  // Props for customization
  export let title: string = ""; // Optional card title
  export let subtitle: string = ""; // Optional card subtitle
  export let padding: string = "p-6"; // Customizable padding
  export let rounded: string = "rounded-xl"; // Customizable border radius
  export let shadow: string = "shadow-md shadow-blue-100"; // Customizable shadow
  export let border: string = "border border-white/70"; // Customizable border
  export let bgColor: string = "bg-white/40"; // Background color
  export let width: string = "w-[98%]"; // Width of the card
  export let height: string = "h-auto"; // Width of the card
  export let hover: string = ""; // Optional hover effects
  export let margin: string = "m-2";
  export let onClick: (() => void) | null = null; // Optional click handler
  
  // Computed classes
  let cardClasses = `${padding} ${rounded} ${shadow} ${border} ${bgColor} ${width} ${height} ${hover} ${onClick ? 'cursor-pointer' : ''} ${margin}`;
  
  // Handle click events if handler is provided
  function handleClick() {
    if (onClick) onClick();
  }
</script>

<div class={cardClasses} onclick={handleClick}>
  {#if title}
    <div class="mb-1">
      <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
      {#if subtitle}
        <p class="text-sm text-gray-500">{subtitle}</p>
      {/if}
    </div>
  {/if}
  
  <div>
    <slot />
  </div>
  
  {#if $$slots.footer}
    <div class="mt-4 pt-3 border-t border-gray-100">
      <slot name="footer" />
    </div>
  {/if}
</div>