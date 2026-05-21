<script>
	import Button from '$components/button.svelte';
</script>

<div class="flex h-full flex-col items-center justify-center gap-2 overflow-hidden p-1">
	<!-- Pulsing dots grid matching main board -->
	<div class="relative grid aspect-square w-full grid-cols-9 grid-rows-9 bg-background md:max-w-md">
		{#each Array(9) as _, row (row)}
			{#each Array(9) as _, col (col)}
				{@const dist = Math.sqrt(Math.pow(row - 4, 2) + Math.pow(col - 4, 2))}
				<div class="flex aspect-square items-center justify-center p-1">
					<div
						class="pulse-wave-dot h-3 w-3 rounded-full bg-primary"
						style="animation-delay: -{dist * 0.15}s"
					></div>
				</div>
			{/each}
		{/each}
	</div>

	<!-- Skeleton buttons matching game.svelte controls -->
	<div class="pointer-events-none flex flex-col items-center opacity-40 select-none">
		<div class="grid w-full grid-cols-5 md:grid-cols-10">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as n (n)}
				<div class="flex h-14 w-14 items-center justify-center">
					<span
						class="flex h-12 w-12 items-center justify-center rounded-full border border-secondary text-3xl text-secondary"
					>
						{n === 0 ? 'X' : n}
					</span>
				</div>
			{/each}
		</div>

		<div class="flex gap-4 pt-4">
			<Button intent="destructive" disabled>Clear</Button>
			<button
				class="h-9 rounded-full border border-primary bg-background px-3 text-foreground opacity-50"
				disabled
			>
				Mark
			</button>
			<Button intent="primary" disabled>Undo</Button>
		</div>
	</div>
</div>

<style>
	@keyframes pulse-wave {
		0%,
		100% {
			transform: scale(0);
			opacity: 0.2;
		}
		50% {
			transform: scale(1.15);
			opacity: 0.9;
		}
	}
	.pulse-wave-dot {
		animation: pulse-wave 1.6s ease-in-out infinite;
	}
</style>
