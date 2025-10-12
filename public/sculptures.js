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
			submitButton.disabled = false;
			submitButton.textContent = "Create Sculpture";
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

export { handleSubmitButtonClick };
