/** @format */

// ----------------------------------------------------------------------------------------------------
// #region Progress Bar Configuration
// ----------------------------------------------------------------------------------------------------
const SCULPTURE_STAGES = {
	ANALYZING: { label: "Analyzing your reflections...", duration: 18000, apiStatus: null },
	SCULPTING: { label: "Sculpting your form...", duration: 600000, apiStatus: "processing" },
	REFINING: { label: "Refining your sculpture...", duration: 540000, apiStatus: "refining" },
};

let currentStage = null;
let progressTimer = null;
let stageStartTime = null;
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region CRUD Requests
// ----------------------------------------------------------------------------------------------------
async function requestCreateSculpture(prompt, artStyle = "realistic") {
	console.log("requestCreateSculpture: sending POST to create sculpture");
	const response = await fetch("/api/sculptures", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include", // <-- Add this line
		body: JSON.stringify({ prompt, artStyle }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to create sculpture");
	}

	const sculpture = await response.json();
	console.log("Sculpture creation response:", sculpture);
	return sculpture;
}

async function requestCreateRefinedSculpture(sculptureId) {
	console.log("requestCreateRefinedSculpture: sending POST to refine sculpture");
	const response = await fetch(`/api/sculptures/${sculptureId}/refine`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to refine sculpture");
	}

	const refinedSculpture = await response.json();
	console.log("Sculpture refine response:", refinedSculpture);
	return refinedSculpture;
}

async function requestReadSculptures() {
	console.log("requestReadSculptures: fetching user sculptures from API");
	const response = await fetch("/api/sculptures");

	if (!response.ok) {
		throw new Error("Failed to fetch sculptures");
	}

	return await response.json();
}

async function requestReadSculptureStatus(taskId) {
	console.log("requestReadSculptureStatus: checking sculpture status");
	const response = await fetch(`/api/sculptures/status/${taskId}`);

	if (!response.ok) {
		throw new Error("Failed to get sculpture status");
	}

	return await response.json();
}

async function requestUpdateSculptureStatus(sculptureId) {
	console.log("requestUpdateSculptureStatus: sending PUT to update sculpture status");
	const response = await fetch(`/api/sculptures/${sculptureId}/status`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to update sculpture status");
	}

	const updatedSculpture = await response.json();
	console.log("Sculpture status update response:", updatedSculpture);
	return updatedSculpture;
}

async function requestDeleteSculpture(sculptureId) {
	console.log("requestDeleteSculpture: sending DELETE to remove sculpture");
	const response = await fetch(`/api/sculptures/${sculptureId}`, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to delete sculpture");
	}

	const result = await response.json();
	console.log("Sculpture delete response:", result);
	return result;
}

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region UI Event Handlers
// ----------------------------------------------------------------------------------------------------
function handleSubmitButtonClick() {
	// replace previous confirm flow with popup+process flow
	const submitButton = document.querySelector("#submit-shards-btn");
	if (!submitButton) {
		console.error("Submit button not found");
		return;
	}

	// Attach global popup button handlers once (if popup exists)
	const popupEls = getMainPopupElements();
	if (popupEls) {
		// Back button: hide popup (cancel)
		popupEls.btnBack.addEventListener("click", () => {
			hideMainPopup();
		});

		// OK button: hide popup (finish)
		popupEls.btnOk.addEventListener("click", () => {
			hideMainPopup();
		});

		// Submit button handler will be attached when user opens the popup (to avoid duplicate listeners)
	}

	submitButton.addEventListener("click", async (e) => {
		console.log("handleSubmitButtonClick: submit button clicked");
		e.preventDefault();

		// Show popup asking for confirmation
		const shown = showMainPopup("Submit shards to create a sculpture? This will start the creation process, which may take several minutes.", {
			showSubmit: true,
			showBack: true,
			showOk: false,
		});
		if (!shown) {
			// fallback to modal confirm if popup not present
			const confirmed = window.confirm("Submit shards to create a sculpture? This will start the creation process.");
			if (!confirmed) return;
			// proceed with direct creation flow below (reuse same code)
		}

		// Attach a one-time submit handler to the main-popup submit button
		const els = getMainPopupElements();
		if (!els) return;
		// Remove any previous handler by cloning the node
		const newSubmit = els.btnSubmit.cloneNode(true);
		els.btnSubmit.parentNode.replaceChild(newSubmit, els.btnSubmit);
		// Update reference
		const updatedEls = getMainPopupElements();

		newSubmit.addEventListener("click", async () => {
			// hide action buttons while processing
			updatedEls.btnBack.classList.add("hidden");
			newSubmit.classList.add("hidden");

			// Create progress bar UI
			createProgressBarUI();

			// Start first stage immediately
			startProgressStage("ANALYZING");

			try {
				// Start sculpture creation request
				const sculptureResponse = await requestCreateSculpture();

				const taskId = sculptureResponse.task_id || sculptureResponse.taskId || sculptureResponse.task || null;
				const sculptureId = sculptureResponse.id || sculptureResponse.sculpture_id || null;

				// Polling
				let attempts = 0;
				const maxAttempts = 120;
				const pollMs = 5000;
				let pollHandle = setInterval(async () => {
					attempts++;
					try {
						let statusObj = null;
						if (taskId) {
							statusObj = await requestReadSculptureStatus(taskId);
						} else if (sculptureId) {
							const all = await requestReadSculptures();
							statusObj = all.find((s) => (s.id || s.sculpture_id) == sculptureId) || null;
						} else {
							const all = await requestReadSculptures();
							statusObj = all && all.length ? all[0] : null;
						}

						const statusText =
							statusObj && (statusObj.status || statusObj.state || statusObj.task_status) ?
								statusObj.status || statusObj.state || statusObj.task_status
							:	"pending";

						// Update progress based on status
						updateProgressFromStatus(statusText);

						if (statusText === "completed" || statusText === "done" || statusText === "finished") {
							showProgressComplete(true);
							clearInterval(pollHandle);
							// show OK button
							const okBtn = getMainPopupElements().btnOk;
							if (okBtn) okBtn.classList.remove("hidden");
						} else if (attempts >= maxAttempts) {
							showProgressComplete(false);
							addMainPopupStatus("⏱ Taking longer than expected. Check back soon.");
							clearInterval(pollHandle);
							const okBtn = getMainPopupElements().btnOk;
							if (okBtn) okBtn.classList.remove("hidden");
						}
					} catch (err) {
						console.error("Error polling sculpture status:", err);
						addMainPopupStatus("⚠ Error checking status: " + (err.message || err));
						clearInterval(pollHandle);
						const okBtn = getMainPopupElements().btnOk;
						if (okBtn) okBtn.classList.remove("hidden");
					}
				}, pollMs);
				// run first check immediately
				setTimeout(() => {
					// no-op; first scheduled tick will run soon
				}, 0);
			} catch (err) {
				console.error("Error during sculpture creation:", err);
				addMainPopupStatus("⚠ Failed to start sculpture creation: " + (err.message || err));
				const okBtn = getMainPopupElements().btnOk;
				if (okBtn) okBtn.classList.remove("hidden");
			}
		});
	});
}

// small transient toast for submission confirmation
function showSubmissionConfirmation(message, duration = 4000) {
	const existing = document.getElementById("submission-confirmation-toast");
	if (existing) existing.remove();
	const toast = document.createElement("div");
	toast.id = "submission-confirmation-toast";
	toast.textContent = message;
	Object.assign(toast.style, {
		position: "fixed",
		bottom: "1.5rem",
		left: "50%",
		transform: "translateX(-50%)",
		background: "rgba(0,0,0,0.8)",
		color: "#fff",
		padding: "0.6rem 1rem",
		borderRadius: "8px",
		zIndex: 9999,
	});
	document.body.appendChild(toast);
	setTimeout(() => {
		toast.remove();
	}, duration);
}

// --- NEW: main-popup helpers (uses #main-popup in shardsPage.ejs) ---
function getMainPopupElements() {
	const popup = document.getElementById("main-popup");
	if (!popup) return null;
	return {
		popup,
		text: popup.querySelector("#main-popup-text"),
		status: popup.querySelector("#main-popup-status"),
		btnBack: popup.querySelector("#main-popup-back"),
		btnSubmit: popup.querySelector("#main-popup-submit"),
		btnOk: popup.querySelector("#main-popup-ok"),
	};
}

function showMainPopup(message, { showSubmit = true, showBack = true, showOk = false } = {}) {
	const el = getMainPopupElements();
	if (!el) return false;
	el.text.textContent = message;
	el.status.innerHTML = ""; // clear status
	el.btnBack.classList.toggle("hidden", !showBack);
	el.btnSubmit.classList.toggle("hidden", !showSubmit);
	el.btnOk.classList.toggle("hidden", !showOk);
	el.popup.classList.remove("hidden");
	return true;
}

function hideMainPopup() {
	const el = getMainPopupElements();
	if (!el) return;
	el.popup.classList.add("hidden");
}

// append a status line to the popup
function addMainPopupStatus(msg) {
	const el = getMainPopupElements();
	if (!el) return;
	const line = document.createElement("div");
	line.textContent = `• ${msg}`;
	el.status.appendChild(line);
	el.status.scrollTop = el.status.scrollHeight;
}

// ----------------------------------------------------------------------------------------------------
// #region Progress Bar UI Helpers
// ----------------------------------------------------------------------------------------------------
function createProgressBarUI() {
	const el = getMainPopupElements();
	if (!el) return;

	// Clear existing status content
	el.status.innerHTML = "";

	// Create progress container
	const progressContainer = document.createElement("div");
	progressContainer.id = "sculpture-progress-container";
	progressContainer.className = "sculpture-progress-container";

	// Create three stage rows
	Object.entries(SCULPTURE_STAGES).forEach(([key, stage], index) => {
		const stageRow = document.createElement("div");
		stageRow.className = "progress-stage";
		stageRow.id = `progress-stage-${index + 1}`;

		const label = document.createElement("div");
		label.className = "progress-label";
		label.textContent = stage.label;

		const barContainer = document.createElement("div");
		barContainer.className = "progress-bar-container";

		const barFill = document.createElement("div");
		barFill.className = "progress-bar-fill";
		barFill.style.width = "0%";

		barContainer.appendChild(barFill);
		stageRow.appendChild(label);
		stageRow.appendChild(barContainer);
		progressContainer.appendChild(stageRow);
	});

	el.status.appendChild(progressContainer);
}

function startProgressStage(stageKey) {
	const stages = Object.keys(SCULPTURE_STAGES);
	const stageIndex = stages.indexOf(stageKey);
	if (stageIndex === -1) return;

	currentStage = stageKey;
	stageStartTime = Date.now();

	// Mark this stage as active
	const stageRow = document.getElementById(`progress-stage-${stageIndex + 1}`);
	if (stageRow) {
		stageRow.classList.add("active");
	}

	// Animate the progress bar
	const stage = SCULPTURE_STAGES[stageKey];
	animateProgressBar(stageIndex + 1, stage.duration);
}

function animateProgressBar(stageNumber, duration) {
	const stageRow = document.getElementById(`progress-stage-${stageNumber}`);
	if (!stageRow) return;

	const barFill = stageRow.querySelector(".progress-bar-fill");
	if (!barFill) return;

	// Clear any existing timer
	if (progressTimer) {
		clearInterval(progressTimer);
	}

	const startTime = Date.now();
	const updateInterval = 100; // Update every 100ms

	progressTimer = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const progress = Math.min((elapsed / duration) * 100, 100);
		barFill.style.width = `${progress}%`;

		if (progress >= 100) {
			clearInterval(progressTimer);
			progressTimer = null;
		}
	}, updateInterval);
}

function completeProgressStage(stageNumber) {
	const stageRow = document.getElementById(`progress-stage-${stageNumber}`);
	if (!stageRow) return;

	const barFill = stageRow.querySelector(".progress-bar-fill");
	if (barFill) {
		barFill.style.width = "100%";
	}
	stageRow.classList.remove("active");
	stageRow.classList.add("complete");
}

function updateProgressFromStatus(status) {
	if (!status) return;

	// Map API status to stages
	if (status === "processing" && currentStage !== "SCULPTING") {
		// Complete analyzing stage, start sculpting
		completeProgressStage(1);
		startProgressStage("SCULPTING");
	} else if (status === "refining" && currentStage !== "REFINING") {
		// Complete sculpting stage, start refining
		completeProgressStage(2);
		startProgressStage("REFINING");
	} else if (status === "completed") {
		// Complete all stages
		if (progressTimer) {
			clearInterval(progressTimer);
			progressTimer = null;
		}
		completeProgressStage(1);
		completeProgressStage(2);
		completeProgressStage(3);
	}
}

function showProgressComplete(success = true) {
	const el = getMainPopupElements();
	if (!el) return;

	const container = document.getElementById("sculpture-progress-container");
	if (!container) return;

	const message = document.createElement("div");
	message.className = "progress-complete-message";
	message.textContent = success ? "✓ Sculpture creation completed!" : "Sculpture creation in progress...";
	container.appendChild(message);
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Automatic Status Polling
// ----------------------------------------------------------------------------------------------------
function startSculptureStatusPolling(intervalMs = 5000) {
	// Poll every intervalMs milliseconds
	setInterval(async () => {
		try {
			const sculptures = await requestReadSculptures();
			for (const sculpture of sculptures) {
				// Only poll status for sculptures that are not completed
				if (sculpture.status !== "completed") {
					await requestUpdateSculptureStatus(sculpture.id);
				}
			}
			// Optionally, refresh the UI here if needed
		} catch (error) {
			console.error("Error polling sculpture status:", error);
		}
	}, intervalMs);
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Sculpture Viewer Rendering
// ----------------------------------------------------------------------------------------------------

function renderSculptureViewer(modelUrl) {
	console.log("renderSculptureViewer: called with modelUrl =", modelUrl);
	const sculptureContainer = document.getElementById("sculpture-container");
	const modelEl = document.getElementById("sculpture-model");

	if (!sculptureContainer) {
		console.warn("renderSculptureViewer: sculpture-container not found — aborting render.");
		return;
	}
	if (!modelEl) {
		console.warn("renderSculptureViewer: model-viewer element (#sculpture-model) not found — aborting render.");
		return;
	}

	// If there's a modelUrl, set it and ensure the container is visible.
	// If no URL, remove src and optionally hide the container.
	if (modelUrl) {
		// Set or update the viewer source
		modelEl.setAttribute("src", modelUrl);
		// Ensure the container is visible
		sculptureContainer.classList.remove("hidden");
		console.log("renderSculptureViewer: model src set and container shown");
	} else {
		// No model available
		modelEl.removeAttribute("src");
		sculptureContainer.classList.add("hidden");
		console.log("renderSculptureViewer: model removed and container hidden");
	}

	// Informational UI updates
	document.title = "Sculpture";
	const headerTitle = document.querySelector("header h1, header .header-title");
	if (headerTitle) headerTitle.textContent = "Sculpture";

	const mosaicNavLink = document.querySelector('nav a[href="/shards"] .carved-glass, nav a[href="/shards"] span.carved-glass');
	if (mosaicNavLink) mosaicNavLink.textContent = "Sculpture";
}

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Fetch and Display Sculpture on Page Load
// ----------------------------------------------------------------------------------------------------

async function fetchAndDisplaySculpture() {
	console.log("fetchAndDisplaySculpture: fetching sculpture(s) from backend");
	try {
		const sculptures = await requestReadSculptures();
		console.log("fetchAndDisplaySculpture: sculptures fetched", sculptures);
		if (sculptures && sculptures.length > 0) {
			const sculpture = sculptures[0];
			console.log("fetchAndDisplaySculpture: sculpture object:", sculpture);
			// Always use /api/user-model for Meshy models
			let modelUrl = "";
			if (sculpture.model_url && sculpture.model_url.includes("assets.meshy.ai")) {
				modelUrl = "/api/user-model";
			} else {
				modelUrl = sculpture.model_url || "";
			}
			console.log("fetchAndDisplaySculpture: modelUrl variable before passing to renderSculptureViewer:", modelUrl);
			renderSculptureViewer(modelUrl);
		} else {
			console.log("fetchAndDisplaySculpture: no sculpture found, rendering fallback viewer");
			renderSculptureViewer(""); // fallback if no sculpture
		}
	} catch (error) {
		console.error("fetchAndDisplaySculpture: error fetching sculpture", error);
		renderSculptureViewer(""); // fallback if error
	}
}

// Call this on page load instead of checkAndRenderSculptureViewer
document.addEventListener("DOMContentLoaded", () => {
	console.log("DOMContentLoaded: calling fetchAndDisplaySculpture");
	fetchAndDisplaySculpture();
});

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

export { handleSubmitButtonClick };
