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
	const shardsSection = document.getElementById("shards-section");
	if (!shardsSection) return;

	// Remove existing viewer if present
	const existingViewer = document.getElementById("sculpture-3d-viewer");
	if (existingViewer) existingViewer.remove();

	// Create and append the viewer div as the last child
	const viewerDiv = document.createElement("div");
	viewerDiv.id = "sculpture-3d-viewer";
	viewerDiv.className = "liquid-glass shifted-up";
	viewerDiv.innerHTML = `
		<p>Your sculpture is ready!</p>
		<!-- Example: <model-viewer src="${modelUrl}" ...></model-viewer> -->
	`;
	shardsSection.appendChild(viewerDiv);

	// Shrink and move the voronoi container
	const voronoiGroup = document.querySelector(".voronoi-svg");
	if (voronoiGroup) {
		voronoiGroup.style.transform = "scale(0.4) translateX(-95%)";
	}

	// Change the page title
	document.title = "Sculpture";

	// Change header text to "Sculpture"
	const headerTitle = document.querySelector("header h1, header .header-title");
	if (headerTitle) {
		headerTitle.textContent = "Sculpture";
	}

	// Change navbar link text to "Sculpture"
	const mosaicNavLink = document.querySelector('nav a[href="/shards"] .carved-glass, nav a[href="/shards"] span.carved-glass');
	if (mosaicNavLink) {
		mosaicNavLink.textContent = "Sculpture";
	}
}

// Example usage: call this after fetching sculpture data
async function checkAndRenderSculptureViewer() {
	const hasSculpture = document.body.getAttribute("data-has-sculpture") === "true";
	if (hasSculpture) {
		// Fetch sculpture data and get modelUrl
		const sculptures = await requestReadSculptures();
		if (sculptures && sculptures.length > 0 && sculptures[0].modelUrl) {
			renderSculptureViewer(sculptures[0].modelUrl);
		} else {
			renderSculptureViewer(""); // fallback if no modelUrl
		}
	}
}

// Call this on page load
document.addEventListener("DOMContentLoaded", checkAndRenderSculptureViewer);

export { handleSubmitButtonClick };
