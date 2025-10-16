<script lang="ts">
	import { onMount } from 'svelte';
	import Body from '$lib/components/Body.svelte';
	import Card from '$lib/components/Card.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// State variables for dragging and resizing
	let isDragging = false;
	let isResizing = false;
	let currentElement: HTMLElement | null = $state(null);
	let selectedElement: HTMLElement | null = $state(null);
	let offsetX = 0;
	let offsetY = 0;
	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;
	let canvasElement: HTMLElement;
	let backgroundURL = $state(''); // Store the background image URL
	let webinarId = $derived(page.params.id);

	// Properties for the selected element
	let textContent = $state('Text Element');
	let fontSize = $state(16);
	let textColor = $state('#000000');
	let fontFamily = $state('Arial, sans-serif');
	let textAlign = $state('center');
	let backgroundColor = $state('rgba(255, 255, 255, 0.7)');
	let borderColor = $state('#dddddd');
	let borderWidth = $state(1);
	let borderStyle = $state('solid');
	let borderRadius = $state(0);
	let opacity = $state(100); // 0-100%

	// File input reference
	let fileInputElement: HTMLInputElement;

	// Available font families
	const fontFamilies = [
		'Arial, sans-serif',
		'Times New Roman, serif',
		'Courier New, monospace',
		'Georgia, serif',
		'Verdana, sans-serif',
		'Tahoma, sans-serif',
		'Trebuchet MS, sans-serif',
		'Impact, fantasy',
		'Comic Sans MS, cursive',
		'Roboto, sans-serif',
		'Open Sans, sans-serif',
		'Lato, sans-serif'
	];

	// Available border styles
	const borderStyles = [
		'solid',
		'dashed',
		'dotted',
		'double',
		'groove',
		'ridge',
		'inset',
		'outset',
		'none'
	];

	// Initialize draggable and resizable functionality when component mounts
	onMount(() => {
		// Get canvas element
		canvasElement = document.getElementById('canvas') as HTMLElement;

		// Get all dragable elements
		const dragables = document.querySelectorAll('.dragable');

		// Initialize each dragable element
		dragables.forEach((element) => {
			initDragable(element as HTMLElement);
		});

		// Add click event to canvas to deselect elements
		canvasElement.addEventListener('click', (e) => {
			if (e.target === canvasElement) {
				deselectAll();
			}
		});

		// Create a hidden file input element
		fileInputElement = document.createElement('input');
		fileInputElement.type = 'file';
		fileInputElement.accept = 'image/*';
		fileInputElement.style.display = 'none';
		document.body.appendChild(fileInputElement);

		// Add event listener for file selection
		fileInputElement.addEventListener('change', handleFileSelected);
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
		positions.forEach((pos) => {
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
		} else if (isResizing && currentElement) {
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
			} else if (direction.includes('w')) {
				newWidth = Math.max(20, startWidth - deltaX);
				newX = originalX + (startWidth - newWidth);
			}

			if (direction.includes('s')) {
				newHeight = Math.max(20, startHeight + deltaY); // Minimum height
			} else if (direction.includes('n')) {
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

		// Get computed style of the element
		const style = window.getComputedStyle(element);

		// Update properties based on the selected element
		textContent = element.dataset.textContent || element.textContent || 'Text Element';

		// Extract numeric value from font size (remove 'px')
		fontSize = parseInt(style.fontSize) || 16;

		// Get font family
		fontFamily = style.fontFamily || 'Arial, sans-serif';

		// Get text color
		textColor = style.color || '#000000';

		// Get text alignment
		textAlign = style.textAlign || 'center';

		// Get background color
		backgroundColor = style.backgroundColor || 'rgba(255, 255, 255, 0.7)';

		// Get border properties
		borderWidth = parseInt(style.borderWidth) || 1;
		borderColor = style.borderColor || '#dddddd';
		borderStyle = style.borderStyle || 'solid';

		// Get border radius
		borderRadius = parseInt(style.borderRadius) || 0;

		// Get opacity (convert from 0-1 to 0-100)
		opacity = Math.round((parseFloat(style.opacity) || 1) * 100);
	}

	// Deselect all elements
	function deselectAll() {
		document.querySelectorAll('.dragable').forEach((el) => {
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
		newElement.style.fontFamily = 'Arial, sans-serif';
		newElement.style.textAlign = 'center';
		newElement.style.border = '1px solid #dddddd';
		newElement.style.borderRadius = '0px';
		newElement.style.display = 'flex';
		newElement.style.alignItems = 'center';
		newElement.style.justifyContent = 'center';
		newElement.style.opacity = '1';

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
			const old = selectElement;
			selectedElement.textContent = textContent;
			selectedElement.dataset.textContent = textContent;
			addResizeHandles(selectedElement);
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

	// Update font family of selected element
	function updateFontFamily() {
		if (selectedElement) {
			selectedElement.style.fontFamily = fontFamily;
		}
	}

	// Update text alignment of selected element
	function updateTextAlign() {
		if (selectedElement) {
			selectedElement.style.textAlign = textAlign;

			// Update flexbox alignment based on text alignment
			switch (textAlign) {
				case 'left':
					selectedElement.style.justifyContent = 'flex-start';
					break;
				case 'center':
					selectedElement.style.justifyContent = 'center';
					break;
				case 'right':
					selectedElement.style.justifyContent = 'flex-end';
					break;
				default:
					selectedElement.style.justifyContent = 'center';
			}
		}
	}

	// Update background color of selected element
	function updateBackgroundColor() {
		if (selectedElement) {
			selectedElement.style.backgroundColor = backgroundColor;
		}
	}

	// Update border properties of selected element
	function updateBorder() {
		if (selectedElement) {
			selectedElement.style.borderWidth = `${borderWidth}px`;
			selectedElement.style.borderColor = borderColor;
			selectedElement.style.borderStyle = borderStyle;
		}
	}

	// Update border radius of selected element
	function updateBorderRadius() {
		if (selectedElement) {
			selectedElement.style.borderRadius = `${borderRadius}px`;
		}
	}

	// Update opacity of selected element
	function updateOpacity() {
		if (selectedElement) {
			selectedElement.style.opacity = (opacity / 100).toString();
		}
	}

	function deleteSelected() {
		if (selectedElement) {
			selectedElement.remove(); // remove the element from the DOM
			selectedElement = null; // clear selection
		}
	}

	async function createTheCert(html: string) {
		try {
			const response = await fetch('/api/add-cert', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					event_id: Number(webinarId),
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			return result;
		} catch (error) {
			console.error('Error uploading to backend:', error);
			throw error;
		}
	};

	// Function to handle file upload
	function uploadBgImage() {
		// Trigger file input click
		fileInputElement.click();
	}

	// Handle file selection
	async function handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;

		if (input.files && input.files.length > 0) {
			const file = input.files[0];

			try {
				// Read file as data URL
				const base64String = await readFileAsDataURL(file);

				// Extract the base64 part (remove data:image/...;base64,)
				const base64Data = base64String.split(',')[1];

				// Upload to backend
				const uploadedUrl = await uploadToBackend(base64Data);

				// Set as background
				if (uploadedUrl) {
					const noCacheUrl = `${uploadedUrl}?t=${Date.now()}`;
					backgroundURL = noCacheUrl;
					canvasElement.style.backgroundImage = `url('${backgroundURL}')`;
					canvasElement.style.backgroundSize = 'cover';
					canvasElement.style.backgroundPosition = 'center';
					canvasElement.style.backgroundRepeat = 'no-repeat';
				}
			} catch (error) {
				console.error('Error uploading image:', error);
				alert('Failed to upload image');
			}
		}
	}

	// Read file as Data URL
	function readFileAsDataURL(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					resolve(reader.result);
				} else {
					reject(new Error('Failed to read file'));
				}
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	async function uploadToBackend(base64Data: string): Promise<string> {
		try {
			const response = await fetch('/api/cert-edit-up', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: base64Data,
					event_id: webinarId
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.success && result.data && result.data.filename) {
				return result.data.filename;
			} else {
				throw new Error('Invalid response format');
			}
		} catch (error) {
			console.error('Error uploading to backend:', error);
			throw error;
		}
	}

	// Save the canvas as HTML
	function saveAsHTML() {
		// Get all elements on the canvas
		const dragables = document.querySelectorAll('.dragable') as NodeListOf<HTMLElement>;

		// Deselect all elements to remove the selection outline
		deselectAll();

		// Create HTML template
		let htmlContent = `<style>
        .template-canvas {
            width: 700px;
            height: 500px;
            background: #ff4444;
            ${backgroundURL ? `background-image: url(${backgroundURL});` : ''}
            position: relative;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            overflow: hidden;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        .template-object {
            position: absolute;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            word-wrap: break-word;
            text-align: center;
            box-sizing: border-box;
        }
    </style>
    <div class="template-canvas">`;

		// Add each element to the HTML
		dragables.forEach((element: HTMLElement) => {
			// Get the element style properties
			const left = element.style.left;
			const top = element.style.top;
			const width = element.style.width;
			const height = element.style.height;
			const fontSize = element.style.fontSize;
			const fontFamily = element.style.fontFamily;
			const color = element.style.color;
			const textAlign = element.style.textAlign !== '' ? element.style.textAlign : 'center';
			const backgroundColor = element.style.backgroundColor;
			const borderWidth = element.style.borderWidth;
			const borderColor = element.style.borderColor;
			const borderStyle = element.style.borderStyle;
			const borderRadius = element.style.borderRadius;
			const opacity = element.style.opacity;
			const padding = element.style.padding || '8px';
			const justifyContent =
				element.style.justifyContent !== '' ? element.style.justifyContent : 'center';
			const alignItems = 'center';
			const display = 'flex';

			// Get text content
			const textContent = element.textContent || '';

			// Create element HTML
			htmlContent += `
        <div class="template-object" style="left: ${left}; top: ${top}; width: ${width}; height: ${height}; 
            font-size: ${fontSize}; font-family: ${fontFamily}; color: ${color}; text-align: ${textAlign}; 
            background-color: ${backgroundColor}; border-width: ${borderWidth}; border-color: ${borderColor}; 
            border-style: ${borderStyle}; border-radius: ${borderRadius}; opacity: ${opacity}; padding: ${padding};
            justify-content: ${justifyContent}; align-items: ${alignItems}; display: ${display};">
            ${textContent}
        </div>`;
		});

		// Close HTML template
		htmlContent += `
    </div>`;

		// // Log to console
		// console.log(htmlContent);

		// Upload the HTML content to the backend
		uploadCertTemplate(btoa(htmlContent));

		// Optionally, create a download link
		// const blob = new Blob([htmlContent], { type: 'text/html' });
		// const url = URL.createObjectURL(blob);

		// const downloadLink = document.createElement('a');
		// downloadLink.href = url;
		// downloadLink.download = 'certificate.html';

		// // Trigger download
		// downloadLink.click();

		// Clean up
		// setTimeout(() => {
		// 	URL.revokeObjectURL(url);
		// }, 100);

		// Show a brief success message
		alert('Certificate HTML saved!');
		goto(`/webinar/${webinarId}`);
	}

	// Upload the certificate template to the backend
	async function uploadCertTemplate(base64HtmlData: string) {
		const res = await createTheCert(base64HtmlData);
		if (!res.success) console.log("Failed to create the cert maybe its already exist?")
		try {
			const response = await fetch('/api/cert-edit-up-html', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: base64HtmlData,
					event_id: webinarId
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (!result.success) {
				alert(result.message || 'Failed to upload template');
			}
		} catch (error) {
			alert(`Error uploading template to backend: ${error}`);
		}
	}

	let windowTooSmall = $state(false);
	function checkScreenSize() {
		const minWidth = 1024;
		const minHeight = 600;

		if (window.innerWidth < minWidth || window.innerHeight < minHeight) {
			windowTooSmall = true;
		} else {
			windowTooSmall = false;
		}
	}
</script>

<svelte:window
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onresize={checkScreenSize}
	onload={checkScreenSize}
/>

<Body>
	{#if !windowTooSmall}
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold text-sky-600">Edit Sertifikat</h1>
			<div class="flex space-x-2">
				{#if selectedElement}
					<button
						onclick={deleteSelected}
						class="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
					>
						Delete Selected
					</button>
				{/if}
				<button
					onclick={saveAsHTML}
					class="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
				>
					Save as HTML
				</button>
				<button
					onclick={uploadBgImage}
					class="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
				>
					Upload Image
				</button>
			</div>
		</div>
			<div class='mb-2'>
				<p>Note: </p>
				<p>{"Format username: {{ .UserName }}  ||  Format id: {{ .UniqueID }}  ||  Format webinar: {{ .EventName }}  ||  Format role: {{ .UserRole }} "}</p>
			</div>
		<div class="flex h-full flex-row flex-wrap justify-center gap-4">
			<Card width="w-fit" padding="p-5">
				<div
					id="canvas"
					class="h-[500px] w-[700px] rounded-xl bg-red-100"
					style={backgroundURL
						? `background-image: url('${backgroundURL}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
						: ''}
				>
				</div>
			</Card>
			<Card width="w-[450px]" padding="p-5">
				<div class="mb-6">
					<h3 class="mb-4 text-lg font-medium">Properties</h3>

					<!-- Add new element button -->
					<button
						onclick={addTextElement}
						class="w-full rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					>
						+ Add Text Element
					</button>
				</div>

				{#if selectedElement}
					<div class="max-h-[420px] overflow-y-auto pr-2">
						<!-- Text Content Section -->
						<div class="property-section">
							<h4 class="property-title">Text Content</h4>

							<!-- Text Content -->
							<div class="property-group">
								<p class="property-label block">Content</p>
								<input
									type="text"
									bind:value={textContent}
									oninput={updateTextContent}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
								/>
							</div>

							<!-- Font Family -->
							<div class="property-group">
								<p class="property-label block">Font Family</p>
								<select
									bind:value={fontFamily}
									onchange={updateFontFamily}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
								>
									{#each fontFamilies as family}
										<option value={family} style={`font-family: ${family}`}
											>{family.split(',')[0]}</option
										>
									{/each}
								</select>
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
										class="mr-2 w-2/3"
									/>
									<input
										type="number"
										bind:value={fontSize}
										oninput={updateFontSize}
										min="8"
										max="72"
										class="w-1/3 rounded-md border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-sky-500 focus:outline-none"
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
										class="h-10 w-10 cursor-pointer rounded-md border border-gray-300 p-0"
									/>
									<input
										type="text"
										bind:value={textColor}
										oninput={updateTextColor}
										class="ml-2 flex-grow rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Text Alignment -->
							<div class="property-group">
								<p class="property-label block">Text Alignment</p>
								<div class="flex items-center space-x-2">
									<button
										onclick={() => {
											textAlign = 'left';
											updateTextAlign();
										}}
										class={`flex-1 border px-3 py-2 ${textAlign === 'left' ? 'border-sky-500 bg-sky-100' : 'border-gray-300'} rounded-md focus:outline-none`}
									>
										Left
									</button>
									<button
										onclick={() => {
											textAlign = 'center';
											updateTextAlign();
										}}
										class={`flex-1 border px-3 py-2 ${textAlign === 'center' ? 'border-sky-500 bg-sky-100' : 'border-gray-300'} rounded-md focus:outline-none`}
									>
										Center
									</button>
									<button
										onclick={() => {
											textAlign = 'right';
											updateTextAlign();
										}}
										class={`flex-1 border px-3 py-2 ${textAlign === 'right' ? 'border-sky-500 bg-sky-100' : 'border-gray-300'} rounded-md focus:outline-none`}
									>
										Right
									</button>
								</div>
							</div>
						</div>

						<!-- Background Section -->
						<div class="property-section">
							<h4 class="property-title">Background</h4>

							<!-- Background Color -->
							<div class="property-group">
								<p class="property-label block">Background Color</p>
								<div class="flex items-center">
									<input
										type="color"
										bind:value={backgroundColor}
										oninput={updateBackgroundColor}
										class="h-10 w-10 cursor-pointer rounded-md border border-gray-300 p-0"
									/>
									<input
										type="text"
										bind:value={backgroundColor}
										oninput={updateBackgroundColor}
										class="ml-2 flex-grow rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Opacity -->
							<div class="property-group">
								<p class="property-label block">Opacity ({opacity}%)</p>
								<div class="flex items-center">
									<input
										type="range"
										bind:value={opacity}
										oninput={updateOpacity}
										min="0"
										max="100"
										step="1"
										class="w-full"
									/>
								</div>
							</div>
						</div>

						<!-- Border Section -->
						<div class="property-section">
							<h4 class="property-title">Border</h4>

							<!-- Border Width -->
							<div class="property-group">
								<p class="property-label block">Width (px)</p>
								<div class="flex items-center">
									<input
										type="range"
										bind:value={borderWidth}
										oninput={updateBorder}
										min="0"
										max="10"
										step="1"
										class="mr-2 w-2/3"
									/>
									<input
										type="number"
										bind:value={borderWidth}
										oninput={updateBorder}
										min="0"
										max="10"
										class="w-1/3 rounded-md border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-sky-500 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Border Color -->
							<div class="property-group">
								<p class="property-label block">Color</p>
								<div class="flex items-center">
									<input
										type="color"
										bind:value={borderColor}
										oninput={updateBorder}
										class="h-10 w-10 cursor-pointer rounded-md border border-gray-300 p-0"
									/>
									<input
										type="text"
										bind:value={borderColor}
										oninput={updateBorder}
										class="ml-2 flex-grow rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Border Style -->
							<div class="property-group">
								<p class="property-label block">Style</p>
								<select
									bind:value={borderStyle}
									onchange={updateBorder}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
								>
									{#each borderStyles as style}
										<option value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
									{/each}
								</select>
							</div>

							<!-- Border Radius -->
							<div class="property-group">
								<p class="property-label block">Radius (px)</p>
								<div class="flex items-center">
									<input
										type="range"
										bind:value={borderRadius}
										oninput={updateBorderRadius}
										min="0"
										max="50"
										step="1"
										class="mr-2 w-2/3"
									/>
									<input
										type="number"
										bind:value={borderRadius}
										oninput={updateBorderRadius}
										min="0"
										max="50"
										class="w-1/3 rounded-md border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-sky-500 focus:outline-none"
									/>
								</div>
							</div>
						</div>

						<!-- Position information -->
						<div class="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
							<p>
								<strong>Position:</strong>
								L: {parseInt(selectedElement.style.left) || 0}px, T: {parseInt(
									selectedElement.style.top
								) || 0}px
							</p>
							<p>
								<strong>Size:</strong>
								W: {selectedElement.offsetWidth}px, H: {selectedElement.offsetHeight}px
							</p>
						</div>
					</div>
				{:else}
					<p class="text-gray-500">Select an element to edit its properties</p>
				{/if}
			</Card>
		</div>
	{/if}
	{#if windowTooSmall}
		<div class="flex h-screen flex-col items-center justify-center p-6 text-center">
			<h1 class="mb-4 text-2xl font-bold text-red-600">Your device is not supported</h1>
			<p class="text-gray-600">
				Please use a larger screen (like a laptop or desktop) to edit certificates.
			</p>
		</div>
	{/if}
</Body>

<style>
	.dragable {
		overflow: hidden;
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

	.property-section {
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 1rem;
		margin-bottom: 1rem;
	}

	.property-section:last-child {
		border-bottom: none;
	}

	.property-title {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
		color: #374151;
	}

	.color-preview {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 1px solid #e5e7eb;
	}
</style>
