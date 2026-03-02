/** @format */

// ----------------------------------------------------------------------------------------------------
// #region Guide Messages
// ----------------------------------------------------------------------------------------------------

const GUIDE_MESSAGES = {
	// Stage 1: Home feed, first visit only (tracked in localStorage)
	welcome: {
		text: `Each sculpture you see here began as scattered fragments — questions answered honestly, memories held up to the light.\n\nThis is Reflections. A place where the shards of your inner world are gathered, shaped, and fused into something that endures.\n\nCreate an account to begin forging your own.`,
		buttons: { continue: true, back: false, submit: false, ok: false },
		continueAction: null, // just dismiss
	},

	// Stage 2a: Just signed up — pattern creation
	patternCreation: {
		text: `Before your shards can take form, the mosaic itself must be shaped.\n\nBelow you will find your empty pattern — an arrangement of cells that will hold each fragment of your self. Click anywhere within to place points. Use the plus and minus to rotate and mirror the pattern into something that feels like yours.\n\nWhen it is ready, press Done with Pattern.`,
		buttons: { continue: true, back: false, submit: false, ok: false },
		continueAction: null,
	},

	// Stage 2a → 2b: Pattern locked, transition to shard creation
	patternLocked: {
		text: `The lattice is set. It will not shift again.\n\nNow the real work begins. Each cell in the pattern can hold a shard — a response to a question, a memory, a truth. Click a cell to place one. Choose its color. Toggle its glow.\n\nThere is no rush. When your shards feel complete, press Submit to fuse them into a sculpture.`,
		buttons: { continue: true, back: false, submit: false, ok: false },
		continueAction: null,
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

	function show(messageKey, overrideText = null) {
		const el = getElements();
		if (!el) return false;

		const msg = GUIDE_MESSAGES[messageKey];
		if (!msg) return false;

		console.log(`Guide: Showing "${messageKey}" popup`);

		el.text.textContent = overrideText || msg.text;
		el.status.innerHTML = "";

		el.btnBack.classList.toggle("hidden", !msg.buttons.back);
		el.btnContinue.classList.toggle("hidden", !msg.buttons.continue);
		el.btnSubmit.classList.toggle("hidden", !msg.buttons.submit);
		el.btnOk.classList.toggle("hidden", !msg.buttons.ok);

		// Re-wire continue button to dismiss by default on every show() (only if button is shown)
		if (el.btnContinue && msg.buttons.continue) {
			const newBtn = el.btnContinue.cloneNode(true);
			el.btnContinue.parentNode.replaceChild(newBtn, el.btnContinue);
			el.btnContinue = newBtn; // Update reference to point to new button
			newBtn.addEventListener("click", () => {
				console.log("Guide: Continue button clicked");
				hide();
			});
		}

		el.popup.classList.remove("hidden");
		return true;
	}

	function hide() {
		const el = getElements();
		if (!el) return;
		console.log("Guide: Popup dismissed");
		el.popup.classList.add("hidden");
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
		if (!el) return;
		const fill = el.querySelector(".progress-bar-fill");
		if (fill) fill.style.width = "100%";
		el.classList.remove("active");
		el.classList.add("complete");
	}

	function activateProgressStage(stageNumber, durationMs) {
		const el = document.getElementById(`progress-stage-${stageNumber}`);
		if (!el) return;
		el.classList.add("active");
		const fill = el.querySelector(".progress-bar-fill");
		if (!fill) return;

		const start = Date.now();
		const tick = setInterval(() => {
			const elapsed = Date.now() - start;
			const pct = Math.min((elapsed / durationMs) * 100, 99);
			fill.style.width = `${pct}%`;
			if (elapsed >= durationMs) clearInterval(tick);
		}, 100);
	}

	function showOkButton() {
		const el = getElements();
		if (!el) return;
		el.btnOk.classList.remove("hidden");
	}

	return { show, hide, addStatus, showProgressBar, getProgressElements, completeProgressStage, activateProgressStage, showOkButton, getElements };
}

const guideManager = createGuideManager();

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

export { guideManager, GUIDE_MESSAGES };
