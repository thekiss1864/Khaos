<script lang="ts">
    export let title: string = "";
    export let compact: boolean = false;
    export let className: string = "";
</script>

<div
    class="card bg-base-200 shadow-xl {compact
        ? 'card-compact'
        : ''} {className} transition-all duration-300 ease-in-out hover:shadow-2xl"
>
    <div class="card-body">
        {#if title}
            <h2
                class="card-title text-primary transition-all duration-300 ease-in-out hover:scale-105"
            >
                {title}
            </h2>
        {/if}
        <div class="transition-all duration-300 ease-in-out">
            <slot />
        </div>
    </div>
</div>

<style>
    .card {
        transform: translateZ(0);
        backface-visibility: hidden;
    }

    .card:hover {
        transform: translateY(-4px) scale(1.02);
    }
</style>
