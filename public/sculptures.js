/** @format */

import { guideManager } from "./guide.js";

// ----------------------------------------------------------------------------------------------------
// #region CRUD Requests
// ----------------------------------------------------------------------------------------------------
async function requestCreateSculpture() {
	const response = await fetch("/api/sculptures", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({}),
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || "Failed to create sculpture");
	}
	return await response.json();
}

async function requestReadSculptures() {
	const response = await fetch("/api/sculptures");
	if (!response.ok) throw new Error("Failed to fetch sculptures");
	return await response.json();
}

async function requestReadSculptureStatus(taskId) {
	const response = await fetch(`/api/sculptures/status/${taskId}`);
	if (!response.ok) throw new Error("Failed to get sculpture status");
	return await response.json();
}

async function requestUpdateSculptureStatus(sculptureId) {
	const response = await fetch(`/api/sculptures/${sculptureId}/status`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || "Failed to update sculpture status");
	}
	return await response.json();
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Submit Button Handler
// ----------------------------------------------------------------------------------------------------
function handleSubmitButtonClick() {
	const submitButton = document.querySelector("#submit-shards-btn");
	if (!submitButton) return;

	submitButton.addEventListener("click", (e) => {
		e.preventDefault();
		// Show confirmation popup — actual submission starts only if user confirms
		guideManager.show("confirmSubmit", null, {
			continue: () => {
				guideManager.hide();
				startSculptureSubmission();
			},
			back: () => guideManager.hide(),
		});
	});
}

async function startSculptureSubmission() {
	// Hide shards section immediately
	const shardsSection = document.getElementById("shards-section");
	if (shardsSection) shardsSection.classList.add("hidden");

	// Show progress popup
	guideManager.show("sculptureSubmitted");
	guideManager.showProgressBar();
	guideManager.activateProgressStage(1, 18000);

	const el = guideManager.getElements();

	// Guard against duplicate stage transitions from polling
	const activated = new Set();
	const completed = new Set();

	function safeActivate(stage, ms) {
		if (activated.has(stage)) return;
		activated.add(stage);
		guideManager.activateProgressStage(stage, ms);
	}
	function safeComplete(stage) {
		if (completed.has(stage)) return;
		completed.add(stage);
		guideManager.completeProgressStage(stage);
	}

	try {
		console.log("Sculpture: Sending creation request...");
		const sculptureResponse = await requestCreateSculpture();

		const taskId = sculptureResponse.task_id || sculptureResponse.taskId || sculptureResponse.task || null;
		const sculptureId = sculptureResponse.id || sculptureResponse.sculpture_id || null;
		console.log("Sculpture: Creation request succeeded", { taskId, sculptureId, status: sculptureResponse.status });

		safeComplete(1);
		safeActivate(2, 240000); // 4 minutes
		console.log("Sculpture: Analysis complete — sculpting stage started");

		let attempts = 0;
		const maxAttempts = 120;
		const pollMs = 5000;

		const pollHandle = setInterval(async () => {
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

				const statusText = statusObj
					? statusObj.status || statusObj.state || statusObj.task_status || "pending"
					: "pending";

				console.log(`Sculpture: Poll #${attempts}/${maxAttempts} — status="${statusText}"`, {
					taskId,
					sculptureId,
					raw: statusObj,
				});

				if (statusText === "refining") {
					safeComplete(2);
					safeActivate(3, 240000); // 4 minutes
					console.log("Sculpture: Sculpting complete — refining stage started");
				} else if (statusText === "completed" || statusText === "done") {
					clearInterval(pollHandle);
					safeComplete(2);
					safeComplete(3);
					console.log("Sculpture: All stages complete");

					await fetch("/api/sculptures/mark-first-sculpture", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
					}).catch((err) => console.warn("Sculpture: mark-first-sculpture failed (non-critical):", err));

					console.log("Sculpture: Marked as first sculpture — reloading on OK");

					const line = document.createElement("div");
					line.style.cssText = "text-align: center; margin-top: 1rem; font-size: 1rem;";
					line.textContent = "The form has crystallized.";
					el.status.appendChild(line);
					guideManager.showOkButton();
					guideManager.setHandlers({ ok: () => window.location.reload() });
				} else if (attempts >= maxAttempts) {
					clearInterval(pollHandle);
					console.warn("Sculpture: Max poll attempts reached without completion");
					guideManager.addStatus("This is taking longer than expected. Check back soon.");
					guideManager.showOkButton();
					guideManager.setHandlers({ ok: () => guideManager.hide() });
				}
			} catch (err) {
				console.error("Sculpture: Poll error:", err);
				guideManager.addStatus("Error checking status: " + (err.message || err));
				clearInterval(pollHandle);
				guideManager.showOkButton();
				guideManager.setHandlers({ ok: () => guideManager.hide() });
			}
		}, pollMs);
	} catch (err) {
		console.error("Sculpture: Creation request failed:", err);
		guideManager.addStatus("Failed to start: " + (err.message || err));
		guideManager.showOkButton();
		guideManager.setHandlers({ ok: () => guideManager.hide() });
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Sculpture Viewer
// ----------------------------------------------------------------------------------------------------
function renderSculptureViewer(modelUrl) {
	const sculptureContainer = document.getElementById("sculpture-container");
	const modelEl = document.getElementById("sculpture-model");
	if (!sculptureContainer || !modelEl) return;

	if (modelUrl) {
		modelEl.setAttribute("src", modelUrl);
		sculptureContainer.classList.remove("hidden");
	} else {
		modelEl.removeAttribute("src");
		sculptureContainer.classList.add("hidden");
	}
}

async function fetchAndDisplaySculpture() {
	try {
		const sculptures = await requestReadSculptures();
		if (sculptures && sculptures.length > 0) {
			const sculpture = sculptures[0];
			let modelUrl = "";
			if (sculpture.model_url && sculpture.model_url.includes("assets.meshy.ai")) {
				modelUrl = "/api/user-model";
			} else {
				modelUrl = sculpture.model_url || "";
			}
			renderSculptureViewer(modelUrl);
		} else {
			renderSculptureViewer("");
		}
	} catch (error) {
		console.error("fetchAndDisplaySculpture error:", error);
		renderSculptureViewer("");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	fetchAndDisplaySculpture();
});
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

export { handleSubmitButtonClick };
