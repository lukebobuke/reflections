/** @format */

import { fetchShards } from "./shards.js";

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
// #region Shard Assembly
// ----------------------------------------------------------------------------------------------------
async function assembleShardsIntoPrompt() {
	console.log("assembleShardsIntoPrompt: fetching and assembling user shards");

	try {
		// Use the imported fetchShards function instead of direct fetch
		const shards = await fetchShards();

		if (!shards || shards.length === 0) {
			throw new Error("No shards found to assemble into sculpture prompt");
		}

		// Assemble shards into a coherent prompt
		const assembledPrompt = shards
			.filter((shard) => shard.text && shard.text.trim()) // Only include shards with text
			.map((shard) => shard.text.trim())
			.join(". "); // Join with periods for coherent sentences

		console.log("Assembled prompt:", assembledPrompt);
		return assembledPrompt;
	} catch (error) {
		console.error("Error assembling shards:", error);
		throw error;
	}
}

async function createSculptureFromShards(artStyle = "realistic", enhancePrompt = true) {
	console.log("createSculptureFromShards: creating sculpture from assembled shards");

	try {
		let assembledPrompt = await assembleShardsIntoPrompt();

		if (!assembledPrompt || assembledPrompt.trim().length === 0) {
			throw new Error("Assembled prompt is empty - cannot create sculpture");
		}

		// Optionally enhance the prompt with template-based generation
		if (enhancePrompt) {
			assembledPrompt = enhancePromptWithTemplate(assembledPrompt);
		}

		// Use existing createSculptureRequest function
		const sculpture = await createSculptureRequest(assembledPrompt, artStyle);
		console.log("Sculpture created from shards:", sculpture);
		return sculpture;
	} catch (error) {
		console.error("Error creating sculpture from shards:", error);
		throw error;
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Text Generation Enhancement
// ----------------------------------------------------------------------------------------------------
function enhancePromptWithTemplate(assembledPrompt) {
	console.log("enhancePromptWithTemplate: enhancing prompt with descriptive elements");

	const artDescriptors = ["sculptural", "organic", "flowing", "geometric", "textured", "elegant", "bold", "intricate", "minimalist", "dynamic"];

	const materialHints = [
		"marble-like",
		"bronze finish",
		"ceramic texture",
		"crystalline",
		"smooth surface",
		"rough hewn",
		"polished",
		"matte finish",
	];

	const formSuggestions = [
		"abstract form",
		"figurative elements",
		"architectural details",
		"natural curves",
		"angular planes",
		"twisted structure",
	];

	// Randomly select enhancement elements
	const descriptor = artDescriptors[Math.floor(Math.random() * artDescriptors.length)];
	const material = materialHints[Math.floor(Math.random() * materialHints.length)];
	const form = formSuggestions[Math.floor(Math.random() * formSuggestions.length)];

	// Enhance the prompt with 3D sculpture context
	const enhancedPrompt = `Create a ${descriptor} 3D sculpture with ${material} that captures: ${assembledPrompt}. The piece should have ${form} and be suitable for display.`;

	console.log("Enhanced prompt:", enhancedPrompt);
	return enhancedPrompt;
}

function generateVariationPrompt(basePrompt) {
	console.log("generateVariationPrompt: creating prompt variation");

	const variations = [
		"Reimagine this as",
		"Transform this into",
		"Create an interpretation of",
		"Express this concept through",
		"Visualize this as",
	];

	const styles = ["modern abstract sculpture", "classical figurative piece", "contemporary installation", "minimalist form", "expressive artwork"];

	const variation = variations[Math.floor(Math.random() * variations.length)];
	const style = styles[Math.floor(Math.random() * styles.length)];

	return `${variation} a ${style}: ${basePrompt}`;
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Workflow Integration
// ----------------------------------------------------------------------------------------------------
async function handleCreateSculptureFromShards(artStyle = "realistic") {
	console.log("handleCreateSculptureFromShards: initiating sculpture creation workflow");

	try {
		// Show loading state to user
		console.log("Starting sculpture creation process...");

		// Create sculpture from assembled shards
		const sculpture = await createSculptureFromShards(artStyle);

		// Success - sculpture creation initiated
		console.log("Sculpture creation initiated successfully:", sculpture);
		return sculpture;
	} catch (error) {
		console.error("Failed to create sculpture from shards:", error);
		throw error;
	}
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

			// Create sculpture from shards
			const sculpture = await handleCreateSculptureFromShards(artStyle);

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
	createSculptureRequest,
	getSculptureStatus,
	fetchSculptures,
	refineSculptureRequest,
	deleteSculptureRequest,
	updateSculptureStatusRequest,
	assembleShardsIntoPrompt,
	createSculptureFromShards,
	enhancePromptWithTemplate,
	generateVariationPrompt,
	handleCreateSculptureFromShards,
	handleCreateSculptureButtonClick,
	handleSculptureStatusUpdate,
};
