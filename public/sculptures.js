/** @format */

// ----------------------------------------------------------------------------------------------------
// #region API Calls
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Create & Fetch Operations
// ----------------------------------------------------------------------------------------------------
async function createSculptureRequest(prompt, artStyle = "realistic") {
	console.log("createSculptureRequest: sending POST to create sculpture");
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

async function fetchSculptures() {
	console.log("fetchSculptures: fetching user sculptures from API");
	const response = await fetch("/api/sculptures");

	if (!response.ok) {
		throw new Error("Failed to fetch sculptures");
	}

	return await response.json();
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Status Operations
// ----------------------------------------------------------------------------------------------------
async function getSculptureStatus(taskId) {
	console.log("getSculptureStatus: checking sculpture status");
	const response = await fetch(`/api/sculptures/status/${taskId}`);

	if (!response.ok) {
		throw new Error("Failed to get sculpture status");
	}

	return await response.json();
}

async function updateSculptureStatusRequest(sculptureId) {
	console.log("updateSculptureStatusRequest: sending PUT to update sculpture status");
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
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Modification Operations
// ----------------------------------------------------------------------------------------------------
async function refineSculptureRequest(sculptureId) {
	console.log("refineSculptureRequest: sending POST to refine sculpture");
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

async function deleteSculptureRequest(sculptureId) {
	console.log("deleteSculptureRequest: sending DELETE to remove sculpture");
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
// #endregion
// ----------------------------------------------------------------------------------------------------

// ...existing code for UI handling functions would go here...

export { createSculptureRequest, getSculptureStatus, fetchSculptures, refineSculptureRequest, deleteSculptureRequest, updateSculptureStatusRequest };
