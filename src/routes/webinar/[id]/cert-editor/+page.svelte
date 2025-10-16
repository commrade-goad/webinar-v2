<script lang="ts">
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	
	// State variables for dragging and resizing
	let isDragging = false;
	let isResizing = false;
	let currentElement: HTMLElement | null = null;
	let selectedElement: HTMLElement | null = null;
	let offsetX = 0;
	let offsetY = 0;
	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;
	let canvasElement: HTMLElement;
	
	// Properties for the selected element
	let textContent = $state('Text Element');
	let fontSize = $state(16);
	let textColor = $state('#000000');
	
	// Initialize draggable and resizable functionality when component mounts
	onMount(() => {
		// Get canvas element
		canvasElement = document.getElementById('canvas') as HTMLElement;
		
		// Get all dragable elements
		const dragables = document.querySelectorAll('.dragable');
		
		// Initialize each dragable element
		dragables.forEach(element => {
			initDragable(element as HTMLElement);
		});
		
		// Add click event to canvas to deselect elements
		canvasElement.addEventListener('click', (e) => {
			if (e.target === canvasElement) {
				deselectAll();
			}
		});
	});
	
	// Initialize a draggable element with resize handles
	function initDragable(element: HTMLElement) {
		// Make the element position absolute if not already
		element.style.position = 'absolute';
		
		// Add selection ability
		element.addEventListener('click', (e) => {
			e.stopPropagation();
			selectElement(element);
		});
		
		// Add drag functionality
		element.addEventListener('mousedown', (e) => {
			// If clicking resize handle, don't start dragging
			if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
			
			e.preventDefault();
			e.stopPropagation();
			
			// Get element position relative to canvas
			const rect = element.getBoundingClientRect();
			const canvasRect = canvasElement.getBoundingClientRect();
			
			// Calculate offset within the element
			offsetX = e.clientX - rect.left;
			offsetY = e.clientY - rect.top;
			
			// Start dragging
			isDragging = true;
			currentElement = element;
			
			// Select element
			selectElement(element);
		});
		
		// Add resize handles
		addResizeHandles(element);
	}
	
	// Add resize handles to element
	function addResizeHandles(element: HTMLElement) {
		// Define resize handles positions
		const positions = ['nw', 'ne', 'sw', 'se'];
		
		// Create and add each handle
		positions.forEach(pos => {
			const handle = document.createElement('div');
			handle.className = `resize-handle ${pos}`;
			handle.style.position = 'absolute';
			handle.style.width = '8px';
			handle.style.height = '8px';
			handle.style.backgroundColor = '#007bff';
			handle.style.border = '1px solid white';
			handle.style.borderRadius = '50%';
			
			// Position the handle
			if (pos.includes('n')) handle.style.top = '-4px';
			if (pos.includes('s')) handle.style.bottom = '-4px';
			if (pos.includes('w')) handle.style.left = '-4px';
			if (pos.includes('e')) handle.style.right = '-4px';
			
			// Set cursor style based on position
			if (pos === 'nw' || pos === 'se') handle.style.cursor = 'nwse-resize';
			if (pos === 'ne' || pos === 'sw') handle.style.cursor = 'nesw-resize';
			
			// Add resize event handler
			handle.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				
				startResizing(element, e, pos);
			});
			
			element.appendChild(handle);
		});
	}
	
	// Start resizing an element
	function startResizing(element: HTMLElement, e: MouseEvent, direction: string) {
		isResizing = true;
		currentElement = element;
		
		// Get starting position and dimensions
		startX = e.clientX;
		startY = e.clientY;
		startWidth = element.offsetWidth;
		startHeight = element.offsetHeight;
		
		// Get element's current position
		const style = window.getComputedStyle(element);
		const left = parseInt(style.left) || 0;
		const top = parseInt(style.top) || 0;
		
		// Store original position
		element.dataset.originalX = left.toString();
		element.dataset.originalY = top.toString();
		
		// Store resize direction
		element.dataset.resizeDirection = direction;
		
		// Select element
		selectElement(element);
	}
	
	// Handle mouse move for dragging and resizing
	function handleMouseMove(e: MouseEvent) {
		if (isDragging && currentElement) {
			e.preventDefault();
			
			// Calculate new position
			const canvasRect = canvasElement.getBoundingClientRect();
			
			let newLeft = e.clientX - canvasRect.left - offsetX;
			let newTop = e.clientY - canvasRect.top - offsetY;
			
			// Constrain to canvas boundaries
			newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - currentElement.offsetWidth));
			newTop = Math.max(0, Math.min(newTop, canvasRect.height - currentElement.offsetHeight));
			
			// Set new position
			currentElement.style.left = `${newLeft}px`;
			currentElement.style.top = `${newTop}px`;
		} 
		else if (isResizing && currentElement) {
			e.preventDefault();
			
			// Get resize direction
			const direction = currentElement.dataset.resizeDirection || '';
			
			// Calculate how much the mouse has moved
			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;
			
			// Get original position
			const originalX = parseInt(currentElement.dataset.originalX || '0');
			const originalY = parseInt(currentElement.dataset.originalY || '0');
			
			// Variables for new dimensions and position
			let newWidth = startWidth;
			let newHeight = startHeight;
			let newX = originalX;
			let newY = originalY;
			
			// Resize based on direction
			if (direction.includes('e')) {
				newWidth = Math.max(20, startWidth + deltaX); // Minimum width
			}
			else if (direction.includes('w')) {
				newWidth = Math.max(20, startWidth - deltaX);
				newX = originalX + (startWidth - newWidth);
			}
			
			if (direction.includes('s')) {
				newHeight = Math.max(20, startHeight + deltaY); // Minimum height
			}
			else if (direction.includes('n')) {
				newHeight = Math.max(20, startHeight - deltaY);
				newY = originalY + (startHeight - newHeight);
			}
			
			// Apply new dimensions and position
			currentElement.style.width = `${newWidth}px`;
			currentElement.style.height = `${newHeight}px`;
			currentElement.style.left = `${newX}px`;
			currentElement.style.top = `${newY}px`;
		}
	}
	
	// Handle mouse up to stop dragging/resizing
	function handleMouseUp() {
		isDragging = false;
		isResizing = false;
		currentElement = null;
	}
	
	// Select an element
	function selectElement(element: HTMLElement) {
		deselectAll();
		element.classList.add('selected');
		selectedElement = element;
		
		// Update properties based on the selected element
		textContent = element.dataset.textContent || element.textContent || 'Text Element';
		fontSize = parseInt(element.style.fontSize) || 16;
		textColor = element.style.color || '#000000';
	}
	
	// Deselect all elements
	function deselectAll() {
		document.querySelectorAll('.dragable').forEach(el => {
			el.classList.remove('selected');
		});
		selectedElement = null;
	}
	
	// Add a new text element to the canvas
	function addTextElement() {
		// Create new element
		const newElement = document.createElement('div');
		newElement.className = 'dragable text-element';
		newElement.textContent = 'New Text';
		newElement.dataset.textContent = 'New Text';
		
		// Set default styles
		newElement.style.position = 'absolute';
		newElement.style.left = '50px';
		newElement.style.top = '50px';
		newElement.style.width = '150px';
		newElement.style.height = '50px';
		newElement.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
		newElement.style.padding = '8px';
		newElement.style.fontSize = '16px';
		newElement.style.color = '#000000';
		newElement.style.display = 'flex';
		newElement.style.alignItems = 'center';
		newElement.style.justifyContent = 'center';
		
		// Add to canvas
		canvasElement.appendChild(newElement);
		
		// Initialize draggable functionality
		initDragable(newElement);
		
		// Select the new element
		selectElement(newElement);
	}
	
	// Update text content of selected element
	function updateTextContent() {
		if (selectedElement) {
			selectedElement.textContent = textContent;
			selectedElement.dataset.textContent = textContent;
		}
	}
	
	// Update font size of selected element
	function updateFontSize() {
		if (selectedElement) {
			selectedElement.style.fontSize = `${fontSize}px`;
		}
	}
	
	// Update text color of selected element
	function updateTextColor() {
		if (selectedElement) {
			selectedElement.style.color = textColor;
		}
	}
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<style>
	.dragable {
		cursor: move;
		position: absolute;
		user-select: none;
		box-sizing: border-box;
	}
	
	.text-element {
		background-color: rgba(255, 255, 255, 0.7);
		border: 1px solid #ddd;
		padding: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	
	.selected {
		outline: 2px solid #007bff;
		z-index: 10;
	}
	
	#canvas {
		position: relative;
		overflow: hidden;
	}
	
	.resize-handle {
		position: absolute;
		width: 8px;
		height: 8px;
		background-color: #007bff;
		border: 1px solid white;
		border-radius: 50%;
		z-index: 20;
	}
	
	.property-group {
		margin-bottom: 1rem;
	}
	
	.property-label {
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: #4b5563;
	}
</style>

<Body>
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-sky-600">Edit Sertifikat</h1>
	</div>
	<div class="flex flex-row justify-center h-full gap-4">
		<Card width="w-fit" padding="p-5">
			<div id="canvas" class="h-[500px] w-[700px] rounded-xl bg-red-100">
				<!-- Initial text element -->
				<div class="dragable text-element" style="left: 50px; top: 50px; width: 150px; height: 50px;">
					Text Element
				</div>
			</div>
		</Card>
		<Card width="w-[300px]" padding="p-5">
			<h3 class="text-lg font-medium mb-4">Properties</h3>
			
			<!-- Add new element button -->
			<button 
				onclick={addTextElement}
				class="w-full mb-6 px-4 py-2 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
			>
				+ Add Text Element
			</button>
			
			{#if selectedElement}
				<!-- Text Content -->
				<div class="property-group">
					<p class="property-label block">Text Content</p>
					<input 
						type="text" 
						bind:value={textContent} 
						oninput={updateTextContent}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
					/>
				</div>
				
				<!-- Font Size -->
				<div class="property-group">
					<p class="property-label block">Font Size (px)</p>
					<div class="flex items-center">
						<input 
							type="range" 
							bind:value={fontSize} 
							oninput={updateFontSize}
							min="8" 
							max="72" 
							step="1"
							class="w-2/3 mr-2"
						/>
						<input 
							type="number" 
							bind:value={fontSize} 
							oninput={updateFontSize}
							min="8" 
							max="72" 
							class="w-1/3 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
						/>
					</div>
				</div>
				
				<!-- Text Color -->
				<div class="property-group">
					<p class="property-label block">Text Color</p>
					<div class="flex items-center">
						<input 
							type="color" 
							bind:value={textColor} 
							oninput={updateTextColor}
							class="w-10 h-10 p-0 border border-gray-300 rounded-md cursor-pointer"
						/>
						<input 
							type="text" 
							bind:value={textColor} 
							oninput={updateTextColor}
							class="ml-2 flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
						/>
					</div>
				</div>
				
				<!-- Position information -->
				<div class="mt-6 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
					<p><strong>Position:</strong> 
						L: {parseInt(selectedElement.style.left) || 0}px, 
						T: {parseInt(selectedElement.style.top) || 0}px
					</p>
					<p><strong>Size:</strong> 
						W: {selectedElement.offsetWidth}px, 
						H: {selectedElement.offsetHeight}px
					</p>
				</div>
			{:else}
				<p class="text-gray-500">Select an element to edit its properties</p>
			{/if}
		</Card>
	</div>
</Body>