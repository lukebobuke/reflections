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

	submitButton.addEventListener("click", async (e) => {
		e.preventDefault();

		// Show sculpture submitted guide message
		guideManager.show("sculptureSubmitted");
		guideManager.showProgressBar();

		// Start analyzing stage immediately
		guideManager.activateProgressStage(1, 18000);

		const el = guideManager.getElements();

		try {
			const sculptureResponse = await requestCreateSculpture();

			const taskId = sculptureResponse.task_id || sculptureResponse.taskId || sculptureResponse.task || null;
			const sculptureId = sculptureResponse.id || sculptureResponse.sculpture_id || null;

			// Move to sculpting stage
			guideManager.completeProgressStage(1);
			guideManager.activateProgressStage(2, 600000);

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

					const statusText = statusObj ? statusObj.status || statusObj.state || statusObj.task_status || "pending" : "pending";

					// Update progress stages based on API status
					if (statusText === "refining") {
						guideManager.completeProgressStage(2);
						guideManager.activateProgressStage(3, 540000);
					} else if (statusText === "completed" || statusText === "done") {
						guideManager.completeProgressStage(2);
						guideManager.completeProgressStage(3);
						clearInterval(pollHandle);

						// Mark session as first sculpture for the guide
						await fetch("/api/sculptures/mark-first-sculpture", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
						}).catch(() => {}); // non-critical

						// Show OK to reload and see sculpture
						const line = document.createElement("div");
						line.style.cssText = "text-align: center; margin-top: 1rem; font-size: 1rem;";
						line.textContent = "The form has crystallized.";
						el.status.appendChild(line);
						guideManager.showOkButton();
						guideManager.setHandlers({
							ok: () => window.location.reload(),
						});
					} else if (attempts >= maxAttempts) {
						clearInterval(pollHandle);
						guideManager.addStatus("This is taking longer than expected. Check back soon.");
						guideManager.showOkButton();
						guideManager.setHandlers({ ok: () => guideManager.hide() });
					}
				} catch (err) {
					console.error("Error polling sculpture status:", err);
					guideManager.addStatus("Error checking status: " + (err.message || err));
					clearInterval(pollHandle);
					guideManager.showOkButton();
					guideManager.setHandlers({ ok: () => guideManager.hide() });
				}
			}, pollMs);
		} catch (err) {
			console.error("Error during sculpture creation:", err);
			guideManager.addStatus("Failed to start: " + (err.message || err));
			guideManager.showOkButton();
			guideManager.setHandlers({ ok: () => guideManager.hide() });
		}
	});
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
