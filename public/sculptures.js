/** @format */

// ----------------------------------------------------------------------------------------------------
// #region CRUD Requests
// ----------------------------------------------------------------------------------------------------
async function requestCreateSculpture(prompt, artStyle = "realistic") {
	console.log("requestCreateSculpture: sending POST to create sculpture");
	const response = await fetch("/api/sculptures", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
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
	const submitButton = document.querySelector("#submit-shard-btn");
	if (!submitButton) {
		console.error("Submit button not found");
		return;
	}

	submitButton.addEventListener("click", async (e) => {
		console.log("handleSubmitButtonClick: submit button clicked");
		e.preventDefault();

		try {
			// Disable button and show loading state
			submitButton.disabled = true;
			submitButton.textContent = "Creating...";

			// Get art style from form if available
			const artStyleSelect = document.querySelector("#sculpture-art-style");
			const artStyle = artStyleSelect ? artStyleSelect.value : "realistic";

			// Call requestCreateSculpture instead of createSculptureFromShards
			const sculpture = await requestCreateSculpture("assembled prompt from shards", artStyle);
			// Show success message
			alert("Sculpture creation started! Check your sculptures page for updates.");
		} catch (error) {
			console.error("Error creating sculpture:", error);
			alert(`Failed to create sculpture: ${error.message}`);
		} finally {
			// Re-enable button
			submitButton.disabled = false;
			submitButton.textContent = "Create Sculpture";
		}
	});
}

function handleSculptureStatusUpdate() {
	const updateButtons = document.querySelectorAll(".update-sculpture-status-btn");

	updateButtons.forEach((button) => {
		button.addEventListener("click", async (e) => {
			console.log("handleSculptureStatusUpdate: update status button clicked");
			e.preventDefault();

			const sculptureId = button.dataset.sculptureId;
			if (!sculptureId) {
				console.error("No sculpture ID found");
				return;
			}

			try {
				button.disabled = true;
				button.textContent = "Updating...";

				const updatedSculpture = await updateSculptureStatusRequest(sculptureId);
				console.log("Sculpture status updated:", updatedSculpture);

				// Refresh the page or update UI as needed
				location.reload();
			} catch (error) {
				console.error("Error updating sculpture status:", error);
				alert(`Failed to update sculpture: ${error.message}`);
			} finally {
				button.disabled = false;
				button.textContent = "Update Status";
			}
		});
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

export {
	requestCreateSculpture,
	requestCreateRefinedSculpture,
	requestGetSculptureStatus,
	requestFetchSculptures,
	requestRefineSculpture,
	requestDeleteSculpture,
	requestUpdateSculptureStatus,
	handleCreateSculptureButtonClick,
	handleSculptureStatusUpdate,
};
