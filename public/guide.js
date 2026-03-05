/** @format */

// ----------------------------------------------------------------------------------------------------
// #region Guide Messages
// ----------------------------------------------------------------------------------------------------

const GUIDE_MESSAGES = {
	// Stage 1: Home feed, shown for non-logged-in gallery visitors
	welcome: {
		text: `Each sculpture here is a crystallized portrait of a person's inner world — their memories, values, and tensions held together in glass.\n\nCreate an account to begin forging your own.`,
		buttons: { continue: true, back: false, submit: false, ok: false },
		continueAction: null,
	},

	// Stage 2a: Just signed up — pattern creation
	patternCreation: {
		text: `Before your shards can take form, the mosaic itself must be shaped.\n\nBelow you will find your empty pattern — an arrangement of cells that will hold each fragment of your self. Click anywhere within to place points. Use the plus and minus to rotate and mirror the pattern into something that feels like yours.\n\nWhen it is ready, press Done with Pattern.`,
		buttons: { continue: true, back: false, submit: false, ok: false },
		continueAction: null,
	},

	// Stage 2a: Confirm locking the pattern
	confirmPattern: {
		text: `Once you continue, this pattern cannot be changed.

You are about to lock the arrangement of cells that will hold your shards. This shape is permanent.

Are you ready?`,
		buttons: { continue: false, back: true, submit: false, ok: true },
	},

	// Stage 2a → 2b: Pattern locked, transition to shard creation
	patternLocked: {
		text: `The lattice is set. It will not shift again.\n\nNow the real work begins. Each cell in the pattern can hold a shard — a response to a question, a memory, a truth. Click a cell to place one. Choose its color. Toggle its glow.\n\nThere is no rush. When your shards feel complete, press Submit to fuse them into a sculpture.`,
		buttons: { continue: true, back: false, submit: false, ok: false },
		continueAction: null,
	},

	// Stage 2b: Confirmation before submitting
	confirmSubmit: {
		text: `Once submitted, your mosaic cannot be rebuilt.\n\nForging may take several minutes. You will not be able to return to shard editing.\n\nAre you ready to fuse your shards?`,
		buttons: { continue: true, back: true, submit: false, ok: false },
	},

	// Stage 2b → 3: Sculpture submitted, processing
	sculptureSubmitted: {
		text: `The fragments are entering the furnace.\n\nYour shards are being drawn together, their edges softening, their tensions resolving. What emerges cannot be untangled back into its parts.\n\nThis will take a few minutes. The sculpture will appear when it is ready.`,
		buttons: { continue: false, back: false, submit: false, ok: false },
		// progress bar is shown in the status area; OK button appears when done
	},

	// Stage 3: First time seeing completed sculpture
	sculptureComplete: {
		text: `The form has crystallized.\n\nWhat you see is not a rendering of your answers — it is what emerges when they are held together, under pressure, without separation. A lens ground from your own interior.\n\nIt is yours.`,
		buttons: { continue: false, back: false, submit: false, ok: true },
		continueAction: null,
	},
};

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Guide Manager
// ----------------------------------------------------------------------------------------------------

function createGuideManager() {
	// Track current state for event delegation
	let currentMessageKey = null;
	let customHandlers = {}; // Store custom handlers per message key and button type

	function getElements() {
		const popup = document.getElementById("main-popup");
		if (!popup) return null;
		return {
			popup,
			text: popup.querySelector("#main-popup-text"),
			status: popup.querySelector("#main-popup-status"),
			btnBack: popup.querySelector("#main-popup-back"),
			btnContinue: popup.querySelector("#main-popup-continue"),
			btnSubmit: popup.querySelector("#main-popup-submit"),
			btnOk: popup.querySelector("#main-popup-ok"),
		};
	}

	// Initialize persistent event listeners once
	function init() {
		const el = getElements();
		if (!el) {
			console.warn("Guide: Could not initialize - popup elements not found");
			return;
		}

		// Continue button - check for custom handler or just dismiss
		el.btnContinue.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log(`Guide: Continue clicked for "${currentMessageKey}"`);

			const handler = customHandlers[currentMessageKey]?.continue;
			if (handler) {
				handler();
			} else {
				hide();
			}
		});

		// OK button - check for custom handler or just dismiss
		el.btnOk.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log(`Guide: OK clicked for "${currentMessageKey}"`);

			const handler = customHandlers[currentMessageKey]?.ok;
			if (handler) {
				handler();
			} else {
				hide();
			}
		});

		// Back button - handle based on current state
		el.btnBack.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log(`Guide: Back clicked for "${currentMessageKey}"`);

			const handler = customHandlers[currentMessageKey]?.back;
			if (handler) {
				handler();
			} else {
				hide();
			}
		});

		// Submit button - handle based on current state
		el.btnSubmit.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log(`Guide: Submit clicked for "${currentMessageKey}"`);

			const handler = customHandlers[currentMessageKey]?.submit;
			if (handler) {
				handler();
			} else {
				hide();
			}
		});

		console.log("Guide: Event listeners initialized");
	}

	function show(messageKey, overrideText = null, handlers = null) {
		const el = getElements();
		if (!el) return false;

		const msg = GUIDE_MESSAGES[messageKey];
		if (!msg) return false;

		// Update current state
		currentMessageKey = messageKey;

		// Register custom handlers if provided
		if (handlers) {
			customHandlers[messageKey] = handlers;
		}

		console.log(`Guide: Showing "${messageKey}" popup`);

		// Update UI
		el.text.textContent = overrideText || msg.text;
		el.status.innerHTML = "";

		// Toggle button visibility based on message configuration
		el.btnBack.classList.toggle("hidden", !msg.buttons.back);
		el.btnContinue.classList.toggle("hidden", !msg.buttons.continue);
		el.btnSubmit.classList.toggle("hidden", !msg.buttons.submit);
		el.btnOk.classList.toggle("hidden", !msg.buttons.ok);

		// Show popup
		el.popup.classList.remove("hidden");
		return true;
	}

	function hide() {
		const el = getElements();
		if (!el) return;
		console.log("Guide: Popup dismissed");
		el.popup.classList.add("hidden");
	}

	function setHandlers(handlers) {
		if (currentMessageKey && handlers) {
			customHandlers[currentMessageKey] = {
				...customHandlers[currentMessageKey],
				...handlers,
			};
		}
	}

	function addStatus(msg) {
		const el = getElements();
		if (!el) return;
		const line = document.createElement("div");
		line.textContent = `• ${msg}`;
		el.status.appendChild(line);
		el.status.scrollTop = el.status.scrollHeight;
	}

	function showProgressBar() {
		const el = getElements();
		if (!el) return;
		el.status.innerHTML = "";

		const stages = [
			{ label: "Analyzing your reflections..." },
			{ label: "Sculpting your form..." },
			{ label: "Refining the crystallized whole..." },
		];

		const container = document.createElement("div");
		container.id = "sculpture-progress-container";
		container.className = "sculpture-progress-container";

		stages.forEach((s, i) => {
			const row = document.createElement("div");
			row.className = "progress-stage";
			row.id = `progress-stage-${i + 1}`;

			const label = document.createElement("div");
			label.className = "progress-label";
			label.textContent = s.label;

			const barContainer = document.createElement("div");
			barContainer.className = "progress-bar-container";
			const barFill = document.createElement("div");
			barFill.className = "progress-bar-fill";
			barFill.style.width = "0%";
			barContainer.appendChild(barFill);

			row.appendChild(label);
			row.appendChild(barContainer);
			container.appendChild(row);
		});

		el.status.appendChild(container);
	}

	function getProgressElements() {
		return {
			stage1: document.getElementById("progress-stage-1"),
			stage2: document.getElementById("progress-stage-2"),
			stage3: document.getElementById("progress-stage-3"),
		};
	}

	function completeProgressStage(stageNumber) {
		const el = document.getElementById(`progress-stage-${stageNumber}`);
		if (!el || el.classList.contains("complete")) return;
		const fill = el.querySelector(".progress-bar-fill");
		if (fill) {
			fill.style.transition = "width 0.4s ease-out";
			fill.style.width = "100%";
		}
		el.classList.remove("active");
		el.classList.add("complete");
	}

	function activateProgressStage(stageNumber, durationMs) {
		const el = document.getElementById(`progress-stage-${stageNumber}`);
		if (!el || el.classList.contains("active") || el.classList.contains("complete")) return;
		el.classList.add("active");
		const fill = el.querySelector(".progress-bar-fill");
		if (!fill) return;
		// Reset without transition, then use a single long CSS transition to 99%.
		// The browser handles smooth animation natively — no setInterval jitter.
		fill.style.transition = "none";
		fill.style.width = "0%";
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				fill.style.transition = `width ${durationMs}ms linear`;
				fill.style.width = "99%";
			});
		});
	}

	function showOkButton() {
		const el = getElements();
		if (!el) return;
		el.btnOk.classList.remove("hidden");
	}

	return {
		init,
		show,
		hide,
		setHandlers,
		addStatus,
		showProgressBar,
		getProgressElements,
		completeProgressStage,
		activateProgressStage,
		showOkButton,
		getElements,
	};
}

const guideManager = createGuideManager();

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

export { guideManager, GUIDE_MESSAGES };
