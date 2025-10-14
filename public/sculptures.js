/** @format */

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
	const submitButton = document.querySelector("#submit-shards-btn");
	if (!submitButton) {
		console.error("Submit button not found");
		return;
	}

	submitButton.addEventListener("click", async (e) => {
		console.log("handleSubmitButtonClick: submit button clicked");
		e.preventDefault();

		try {
			submitButton.disabled = true;
			submitButton.textContent = "Creating...";

			// Call requestCreateSculpture instead of createSculptureFromShards
			const sculpture = await requestCreateSculpture();
			// Show success message
			alert("Sculpture creation started! Check your sculptures page for updates.");
		} catch (error) {
			console.error("Error creating sculpture:", error);
			alert(`Failed to create sculpture: ${error.message}`);
		} finally {
			submitButton.classList.add("hidden");
		}
	});
}

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

function renderSculptureViewer(modelUrl) {
	console.log("renderSculptureViewer: called with modelUrl =", modelUrl);
	const shardsSection = document.getElementById("shards-section");
	if (!shardsSection) {
		console.log("renderSculptureViewer: shards-section not found");
		return;
	}

	// Remove existing viewer if present
	const existingViewer = document.getElementById("sculpture-3d-viewer");
	if (existingViewer) {
		console.log("renderSculptureViewer: removing existing viewer");
		existingViewer.remove();
	}

	// Directly use modelUrl for displayUrl
	const displayUrl = modelUrl;

	// Check if model-viewer script is loaded
	if (!window.customElements || !customElements.get("model-viewer")) {
		console.warn("renderSculptureViewer: <model-viewer> script not loaded or not registered.");
	}

	// Create and append the viewer div as the last child
	const viewerDiv = document.createElement("div");
	viewerDiv.id = "sculpture-3d-viewer";
	viewerDiv.innerHTML = `
		${
			displayUrl
				? `<model-viewer src="${displayUrl}" alt="Your Sculpture" camera-controls style="width:100%;height:400px;display:block;"></model-viewer>`
				: `<p>Model not available yet.</p>`
		}
	`;
	shardsSection.appendChild(viewerDiv);
	console.log("renderSculptureViewer: viewer appended");

	// Shrink and move the voronoi container
	const voronoiGroup = document.querySelector(".voronoi-svg");
	if (voronoiGroup) {
		console.log("renderSculptureViewer: shrinking and moving voronoi group");
		voronoiGroup.style.transform = "scale(0.4) translateX(-95%)";
	}

	// Change the page title
	document.title = "Sculpture";
	console.log("renderSculptureViewer: page title set to Sculpture");

	// Change header text to "Sculpture"
	const headerTitle = document.querySelector("header h1, header .header-title");
	if (headerTitle) {
		console.log("renderSculptureViewer: updating header text");
		headerTitle.textContent = "Sculpture";
	}

	// Change navbar link text to "Sculpture"
	const mosaicNavLink = document.querySelector('nav a[href="/shards"] .carved-glass, nav a[href="/shards"] span.carved-glass');
	if (mosaicNavLink) {
		console.log("renderSculptureViewer: updating nav link text");
		mosaicNavLink.textContent = "Sculpture";
	}
}

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

export { handleSubmitButtonClick };
