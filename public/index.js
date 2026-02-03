"use strict";

/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

// Select the placeholder iframe we added to the HTML
const placeholder = document.getElementById("sj-iframe");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	// Wisp / Epoxy Transport Configuration
	// This is critical for unblocking on restrictive school networks
	let wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
		
	if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	}

	// --- IFRAME HANDLING FIX ---
	
	// 1. Create the Scramjet frame
	const frame = scramjet.createFrame();
	
	// 2. Assign the ID 'sj-iframe' so it picks up our CSS (black background, fixed position)
	frame.frame.id = "sj-iframe";
	
	// 3. Add the 'active' class to make it visible (display: block)
	frame.frame.classList.add("active");

	// 4. Swap the empty placeholder with the active proxy frame
	// This prevents duplicate iframes and ensures the UI transitions smoothly
	if (placeholder && placeholder.parentNode) {
		placeholder.replaceWith(frame.frame);
	} else {
		// Fallback: If the placeholder is missing, just append it
		// But first, remove any old frames to prevent stacking
		const oldFrame = document.getElementById("sj-iframe");
		if (oldFrame) oldFrame.remove();
		document.body.appendChild(frame.frame);
	}

	// 5. Navigate
	frame.go(url);
});
