/** @format */
import { Delaunay } from "https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm";
// import { createSculpturePrompt } from "./sculptures.js";

// ----------------------------------------------------------------------------------------------------
// #region Loading Spinner
// ----------------------------------------------------------------------------------------------------
function showLoadingSpinner() {
	const shardsSection = document.querySelector("#shards-section");
	if (!shardsSection) return;

	// Remove existing spinner if present
	hideLoadingSpinner();

	const spinner = document.createElement("div");
	spinner.id = "shards-loading-spinner";
	spinner.className = "shards-loading-spinner";
	spinner.innerHTML = `
		<div class="spinner-ring"></div>
		<p class="spinner-text">Loading shards...</p>
	`;
	shardsSection.appendChild(spinner);
}

function hideLoadingSpinner() {
	const spinner = document.querySelector("#shards-loading-spinner");
	if (!spinner) return;

	// Fade out smoothly
	spinner.style.opacity = "0";
	setTimeout(() => {
		spinner.remove();
	}, 600); // Match --transition-fast
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region App State
// ----------------------------------------------------------------------------------------------------
const createAppState = () => {
	let state = null;
	let shardFormTimeout = null; // Add timeout tracking
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const editPointsActions = document.querySelector("#edit-points-actions");
	const shardInfoPopup = document.querySelector("#shard-info-popup");

	return {
		get: function () {
			return state;
		},
		set: {
			viewShards: async () => {
				if (!shardCrudContainer) return;

				// Show loading spinner
				showLoadingSpinner();

				// Clear any pending form show timeout
				if (shardFormTimeout) {
					clearTimeout(shardFormTimeout);
					shardFormTimeout = null;
				}

				shardCrudContainer.classList.remove("active");
				state = "viewShards";
				if (editPointsActions) editPointsActions.classList.remove("active");
				// Fetch and update shards when returning to viewShards
				try {
					const pointsData = await fetchPointArray();
					if (!pointsData) {
						try {
							// Start new patterns with 4 random points spread across the canvas
							const randomPoints = Array.from({ length: 4 }, () => [
								(Math.random() * 2 - 1) * 0.65,
								(Math.random() * 2 - 1) * 0.65,
							]);
							await createPointArray(randomPoints, currentPointsState.get().rotationCount);
							currentPointsState.set(randomPoints, currentPointsState.get().rotationCount);
						} catch (createError) {
							console.error("Error creating empty point array:", createError);
							// Continue anyway - don't block the app from loading
						}
					} else {
						// Destructure the response
						const { points, rotation_count } = pointsData;
						currentPointsState.set(points, rotation_count);
					}
					updateVoronoiPaths(
						currentPointsState.get().points.length,
						currentPointsState.get().points,
						// Remove width and height - let the function calculate them
					);
					currentShards = await fetchShards();
					updateVoronoiWithShards(currentShards);
					updateRotationPreview();
					// Hide loading spinner after everything is ready
					hideLoadingSpinner();
				} catch (error) {
					console.error("Error in viewShards state:", error);
					// Hide spinner even on error
					hideLoadingSpinner();
				}
			},
			shardCreation: () => {
				state = "shardCreation";
				currentShardState.clear();
				randomSpark();
				updateShardFormUI();
				loadShardFormInfo();
				shardInfoPopup.classList.remove("active");

				// Add timeout before showing the form
				shardFormTimeout = setTimeout(() => {
					shardCrudContainer.classList.add("active");
					shardFormTimeout = null;
				}, 600);
			},
			shardEditing: () => {
				state = "shardEditing";
				updateShardFormUI();
				loadShardFormInfo();
				shardInfoPopup.classList.remove("active");

				// Add timeout before showing the form
				shardFormTimeout = setTimeout(() => {
					shardCrudContainer.classList.add("active");
					shardFormTimeout = null;
				}, 600);
			},
			pointsEditing: () => {
				state = "pointsEditing";
				if (editPointsActions) editPointsActions.classList.add("active");

				// Clear any pending form show timeout
				if (shardFormTimeout) {
					clearTimeout(shardFormTimeout);
					shardFormTimeout = null;
				}

				shardCrudContainer.classList.remove("active");
				updateRotationPreview();
				updateClickHint();
			},
		},
	};
};
const currentPointsState = createCurrentPointsState();
currentPointsState.set([], 5);
const appState = createAppState();
appState.set.viewShards();
// On stage 2a (pattern not yet locked), the canvas is always in points-editing mode
if (window.__SHARDS_PAGE_STATE__ && !window.__SHARDS_PAGE_STATE__.hasSculpture && !window.__SHARDS_PAGE_STATE__.patternLocked) {
	appState.set.pointsEditing();
}
// Store shards globally for state management
let currentShards = [];

function handleHideShardCrudClick() {
	const crudContainer = document.querySelector("#shard-crud-container");
	if (!crudContainer) return;
	document.addEventListener("click", (e) => {
		// Check if we're in a state where we should close the form
		if (appState.get() === "shardCreation" || appState.get() === "shardEditing") {
			// If the click is outside the container, close the form
			if (!crudContainer.contains(e.target)) {
				appState.set.viewShards();
			}
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region API Calls
// ----------------------------------------------------------------------------------------------------
async function createShardRequest(data) {
	const response = await fetch("/vault", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("From shards.js, failed to create shard");
	}
	const shards = await response.json();
	return shards;
}
async function editShardRequest(shardId, data) {
	const response = await fetch(`/vault/${shardId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("From shards.js, failed to update shard");
	}
	const shards = await response.json();
	return shards;
}
async function deleteShardRequest(shardId) {
	const response = await fetch(`/vault/${shardId}`, { method: "DELETE" });
	if (!response.ok) {
		throw new Error("From shards.js, failed to delete shard");
	}
	const shards = await response.json();
	return shards;
}
async function fetchShards() {
	const response = await fetch("/vault/api/user-shards");
	if (!response.ok) {
		throw new Error("Failed to fetch shards");
	}
	return await response.json();
}
async function fetchPointArray() {
	const response = await fetch("/api/points");
	if (response.status === 404) {
		// No point arrays found for this user
		return null;
	}
	if (!response.ok) {
		throw new Error("Failed to fetch points");
	}
	return await response.json();
}
async function createPointArray(points, rotationCount) {
	const response = await fetch("/api/points", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			rotationCount,
			points,
		}),
	});
	if (!response.ok) {
		throw new Error("Failed to save Voronoi pattern");
	}
}
async function editPointArray(points, rotationCount) {
	try {
		const response = await fetch("/api/points", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				rotationCount,
				points,
			}),
		});
		if (!response.ok) {
			throw new Error("Failed to update Voronoi pattern");
		}
		// Handle the response if needed
		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Error updating points:", error);
		throw error;
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Validation
// ----------------------------------------------------------------------------------------------------
function validateShardData(data) {
	const { spark, text, tint, glow, point } = data;
	if (!spark || typeof spark !== "string") {
		throw new Error("ValidateShardData in shards.js: Invalid spark text");
	}
	if (!text || typeof text !== "string") {
		throw new Error("ValidateShardData in shards.js: Invalid shard text");
	}
	if (isNaN(tint) || tint < 0 || tint > 8) {
		throw new Error("validateShardData in shards.js:  Tint must be a number between 0 and 8.");
	}
	if (glow < 0 || glow > 1) {
		throw new Error("validateShardData in shards.js:  Glow must be a number between 0 and 1.");
	}
	if (isNaN(point) || point < 0 || point > 128) {
		throw new Error("validateShardData in shards.js:  Point must be a number between 0 and 128.");
	}
	return {
		spark: spark.trim(),
		text: text.trim(),
		tint: parseInt(tint, 10) || 0,
		glow: parseInt(glow, 10) || 0,
		point: parseInt(point, 10) || 0,
	};
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Handle Shard Click
// ----------------------------------------------------------------------------------------------------
const hasSculpture = document.body.getAttribute("data-has-sculpture") === "true";

function handleShardClick() {
	const shardContainer = document.querySelector("#voronoi-group");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!shardContainer || !shardCrudContainer || !shardCrudForm) {
		return;
	}
	shardContainer.addEventListener("click", function (e) {
		if (appState.get() === "viewShards") {
			e.stopPropagation();
			const voronoiCell = e.target.closest(".voronoi-cell");
			// display create shard CRUD form
			if (voronoiCell && shardContainer.contains(voronoiCell) && !voronoiCell.dataset.shardId) {
				appState.set.shardCreation();
				currentShardState.set({ point: voronoiCell.dataset.originalIndex });
			}
			// display edit shard CRUD form
			else if (voronoiCell && voronoiCell.dataset.shardId) {
				// Find the shard data from currentShards array
				const shardId = voronoiCell.dataset.shardId;
				const shardData = currentShards.find((shard) => shard.id == shardId);

				if (shardData) {
					currentShardState.set({
						id: shardData.id,
						spark: shardData.spark,
						text: shardData.text,
						tint: shardData.tint,
						glow: shardData.glow,
						point: shardData.point,
					});
				} else {
					currentShardState.set({
						id: shardId,
						point: voronoiCell.dataset.originalIndex,
					});
				}
				appState.set.shardEditing();
				console.log("form:", shardCrudForm);
			}
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Handle Shard CRUD
// ----------------------------------------------------------------------------------------------------
function createCurrentShardState() {
	let state = {
		id: null,
		text: "",
		tint: 0,
		glow: 0,
		spark: null,
		point: 0,
	};

	return {
		get: function () {
			return { ...state };
		},
		set: function (data) {
			state = { ...state, ...data };
		},
		clear: function () {
			state = {
				id: null,
				text: "",
				tint: 0,
				glow: 0,
				spark: null,
				point: 0,
			};
		},
	};
}
const currentShardState = createCurrentShardState();

function handleCreateShardClick() {
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!shardCrudForm || !shardCrudContainer) return;
	shardCrudForm.addEventListener("submit", async function (e) {
		if (appState.get() === "shardCreation") {
			e.preventDefault();
			try {
				currentShardState.set({ text: shardCrudForm.elements["text"].value });
				const spark = currentShardState.get().spark;
				const text = currentShardState.get().text;
				const tint = currentShardState.get().tint;
				const glow = currentShardState.get().glow;
				const point = currentShardState.get().point;
				const rawData = { spark, text, tint, glow, point };
				const validatedData = validateShardData(rawData);
				currentShards = await createShardRequest(validatedData);
				appState.set.viewShards();
			} catch (error) {
				alert(error.message);
			}
		}
	});
}

function handleEditShardClick() {
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	if (!shardCrudForm || !shardCrudContainer) return;
	shardCrudForm.addEventListener("submit", async function (e) {
		if (appState.get() === "shardEditing") {
			const shardId = currentShardState.get().id;
			if (!shardId) throw new Error("Shard ID is missing.");
			e.preventDefault();
			try {
				currentShardState.set({ text: shardCrudForm.elements["text"].value });
				const spark = currentShardState.get().spark;
				const text = currentShardState.get().text;
				const tint = currentShardState.get().tint;
				const glow = currentShardState.get().glow;
				const point = currentShardState.get().point;
				const rawData = { spark, text, tint, glow, point };
				const validatedData = validateShardData(rawData);
				const shards = await editShardRequest(shardId, validatedData);
				currentShards = shards;
				updateVoronoiWithShards(shards);
				appState.set.viewShards();
			} catch (error) {
				alert(error.message);
			}
		}
	});
}

function handleDeleteShardClick() {
	const formDeleteButton = document.getElementById("shard-form-delete-btn");
	if (!formDeleteButton) return;
	formDeleteButton.addEventListener("click", async function () {
		const shardId = currentShardState.get().id;
		if (!shardId) {
			alert("No shard selected for deletion.");
			return;
		}
		try {
			const shards = await deleteShardRequest(shardId);
			currentShards = shards;
			updateVoronoiWithShards(shards);
			appState.set.viewShards();
		} catch (error) {
			alert(error.message);
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Handle Points Crud
// ----------------------------------------------------------------------------------------------------
function createCurrentPointsState() {
	let currentPoints = [];
	let currentRotationCount = 0;
	return {
		get: function () {
			return {
				points: currentPoints,
				rotationCount: currentRotationCount,
			};
		},
		set: function (points, rotationCount) {
			currentPoints = points;
			currentRotationCount = rotationCount;
		},
		push: function (point) {
			currentPoints.push(point);
		},
	};
}
function enterPointsEditingState(pressable) {
	if (!pressable) {
		console.error("Edit Points button not found.");
		return;
	}
	pressable.addEventListener("click", () => {
		if (appState.get() === "pointsEditing") {
			return;
		}
		appState.set.pointsEditing();
	});
}
function exitPointsEditingState(pressable) {
	if (!pressable) {
		console.error("Finish edit button not found.");
		return;
	}
	pressable.addEventListener("click", () => {
		if (appState.get() !== "pointsEditing") {
			return;
		}
		editPointArray(currentPointsState.get().points, currentPointsState.get().rotationCount);
		appState.set.viewShards();
	});
}
// -----------------------------------------------------------------------------------------------------
// #endregion
// -----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Shard Hover
// ----------------------------------------------------------------------------------------------------
function handleShardHover(shardContainer, shardCrudContainer) {
	if (!shardContainer || !shardCrudContainer) {
		return;
	}

	let currentHoveredIndex = null;
	let transitionTimeout = null;

	shardContainer.addEventListener("mouseover", function (e) {
		if (appState.get() === "viewShards") {
			const voronoiCell = e.target.closest(".voronoi-cell");
			const shardInfoPopup = document.querySelector("#shard-info-popup");
			const shardInfoSpark = document.querySelector("#shard-info-spark");
			const shardInfoText = document.querySelector("#shard-info-text");

			if (!voronoiCell || !shardInfoPopup) return;
			if (shardContainer.contains(voronoiCell) && appState.get() !== "pointsEditing") {
				const originalIndex = voronoiCell.dataset.originalIndex;

				// If hovering over the same shard, don't restart animation
				if (currentHoveredIndex === originalIndex) return;

				// Clear any pending transition
				if (transitionTimeout) {
					clearTimeout(transitionTimeout);
					transitionTimeout = null;
				}

				// Find all corresponding elements with the same original index
				const allVoronoiCells = shardContainer.querySelectorAll(`[data-original-index="${originalIndex}"]`);

				allVoronoiCells.forEach((cell) => {
					cell.classList.add("popped");
					cell.classList.add("hovered");
				});

				// Find shard data for this cell
				const shardData = currentShards.find((shard) => shard.point == originalIndex);

				// Update content immediately

				// If popup is already visible, hide it first then show with delay
				if (shardInfoPopup.classList.contains("active")) {
					shardInfoPopup.classList.remove("active");

					// Short delay to allow hide animation, then show immediately
					transitionTimeout = setTimeout(() => {
						shardInfoPopup.classList.add("active");
						transitionTimeout = null;
					}, 1); // Very short delay
				} else {
					// Popup not visible, show with slight delay for smooth entry
					transitionTimeout = setTimeout(() => {
						shardInfoPopup.classList.add("active");
						if (shardData) {
							shardInfoSpark.textContent = shardData.spark || "";
							shardInfoText.textContent = shardData.text || "";
						} else {
							shardInfoSpark.textContent = "Empty shard";
							shardInfoText.textContent = "Click to create a memory";
						}
						transitionTimeout = null;
					}, 600);
				}

				currentHoveredIndex = originalIndex;
			}
		}
	});

	shardContainer.addEventListener("mouseout", function (e) {
		const voronoiCell = e.target.closest(".voronoi-cell");
		const shardInfoPopup = document.querySelector("#shard-info-popup");

		if (!voronoiCell || !shardInfoPopup) return;

		// Check if we're actually leaving the shard area
		const relatedTarget = e.relatedTarget;
		if (relatedTarget && shardContainer.contains(relatedTarget)) {
			const relatedCell = relatedTarget.closest(".voronoi-cell");
			if (relatedCell && relatedCell.dataset.originalIndex === voronoiCell.dataset.originalIndex) {
				return; // Still hovering over same shard
			}
		}

		if (shardContainer.contains(voronoiCell)) {
			// Find all corresponding elements with the same original index
			const originalIndex = voronoiCell.dataset.originalIndex;
			const allVoronoiCells = shardContainer.querySelectorAll(`[data-original-index="${originalIndex}"]`);

			allVoronoiCells.forEach((cell) => {
				cell.classList.remove("popped");
				cell.classList.remove("hovered");
			});

			// Clear any pending transition
			if (transitionTimeout) {
				clearTimeout(transitionTimeout);
				transitionTimeout = null;
			}

			// Hide popup immediately - no delay on exit
			shardInfoPopup.classList.remove("active");
			currentHoveredIndex = null;
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Shard Form State
// ----------------------------------------------------------------------------------------------------
function updateShardFormUI() {
	const shardCrudFormTitle = document.getElementById("shard-crud-form-title");
	const sparkRefreshButton = document.getElementById("spark-refresh");
	const submitText = document.getElementById("shard-form-submit-text");
	const deleteBtn = document.getElementById("shard-form-delete-btn");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!shardCrudFormTitle || !sparkRefreshButton || !submitText || !deleteBtn) return;
	if (appState.get() === "shardEditing") {
		shardCrudForm.reset();
		submitText.textContent = "Update Shard";
		deleteBtn.classList.remove("hidden");
		shardCrudFormTitle.textContent = "Edit Shard";
		sparkRefreshButton.classList.add("hidden");
	} else if (appState.get() === "shardCreation") {
		shardCrudForm.reset();
		submitText.textContent = "Create Shard";
		deleteBtn.classList.add("hidden");
		shardCrudFormTitle.textContent = "Create New Shard";
		sparkRefreshButton.classList.remove("hidden");
	}
}
function loadShardFormInfo() {
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const sparkText = document.querySelector("#spark-text");
	const tintPetals = document.querySelectorAll(".tint-petal");
	const glowButton = document.querySelector("#shard-form-glow-btn");

	sparkText.textContent = currentShardState.get().spark;
	if (currentShardState.get().text) {
		shardCrudForm.elements["text"].value = currentShardState.get().text;
	}
	tintPetals.forEach((tintPetal) => {
		if (tintPetal.dataset.tint == currentShardState.get().tint) {
			tintPetal.classList.add("tint-selected");
		} else {
			tintPetal.classList.remove("tint-selected");
		}
	});
	if (currentShardState.get().glow === 0) {
		glowButton.classList.add("glow-clicked");
	} else {
		glowButton.classList.remove("glow-clicked");
	}
}
function handleGlowClick() {
	const glowButton = document.querySelector("#shard-form-glow-btn");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!glowButton || !shardCrudForm) {
		return;
	}
	glowButton.addEventListener("click", () => {
		if (currentShardState.get().glow === 0) {
			currentShardState.set({ glow: 1 });
		} else {
			currentShardState.set({ glow: 0 });
		}
		loadShardFormInfo();
	});
}
function handleTintClick() {
	const tintPetals = document.querySelectorAll(".tint-petal");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!tintPetals || !shardCrudForm) {
		return;
	}
	tintPetals.forEach((tintPetal) => {
		tintPetal.addEventListener("click", () => {
			tintPetals.forEach((tintPetal) => {
				if (tintPetal.classList.contains("tint-selected")) {
					tintPetals.forEach((tintPetal) => {
						tintPetal.classList.remove("tint-selected");
					});
					currentShardState.set({ tint: 1 });
				}
			});
			tintPetal.classList.add("tint-selected");
			currentShardState.set({ tint: tintPetal.dataset.tint });
			loadShardFormInfo();
		});
	});
}
function randomSpark() {
	const sparks = [
		// Emotion & inner life
		"Which hue best reflects the emotion you carry today?",
		"Name a moment that cracked your heart.",
		"What makes you glow?",
		"Which part of you is fragile like glass?",
		"What feeling do you keep returning to, like a tongue on a loose tooth?",
		"Is there an emotion you’ve never let anyone see?",
		"What does quiet feel like in your body?",
		"When did you last feel completely at peace?",
		"Name something that fills you with inexplicable longing.",
		"What emotion do you carry that has no name?",

		// Memory
		"Years later, what memory is still just as clear?",
		"Which moment do you reflect on daily?",
		"Name a smell that pulls you somewhere else entirely.",
		"What is the earliest thing you remember wanting?",
		"Which conversation do you wish you could replay differently?",
		"What place do you return to only in memory?",
		"Name a day you’d live again if you could.",
		"What did childhood sound like?",
		"Which person from your past do you still carry with you?",
		"What memory lives in your hands, not your mind?",

		// Relationships
		"Has anyone ever made you melt? Are they still in your life?",
		"With whom are you comfortable being transparent?",
		"Who taught you how to love?",
		"Who showed you what it looks like to be broken and survive?",
		"What do you wish someone had said to you when you were young?",
		"Is there someone you’ve never properly thanked?",
		"Who sees the version of you that you hide from everyone else?",
		"What do you give freely that you’ve never been given?",
		"Name a friendship that changed the shape of your life.",
		"Have you ever loved someone you couldn’t keep?",

		// Identity & self
		"Describe a part of yourself that’s been reforged by pressure.",
		"Some people have a hard exterior, what about you?",
		"Have you ever broken something beyond repair?",
		"What part of yourself are you still trying to understand?",
		"What would your shadow self confess?",
		"Which version of yourself do you miss?",
		"What do people assume about you that is completely wrong?",
		"What are you becoming, slowly, without trying?",
		"Name something you’ve outgrown but still mourn.",
		"What does your body know that your mind hasn’t admitted?",

		// Aspiration & meaning
		"What is your deepest aspiration?",
		"If you could etch one truth forever, what would it say?",
		"What moment made your path clear?",
		"What are you building, even if no one can see it yet?",
		"What would you do if fear had no vote?",
		"Name the thing you keep circling but never starting.",
		"What does a life well-lived look like to you?",
		"If you left something behind, what would you want it to be?",
		"What question are you living inside of right now?",
		"What do you want to be remembered for?",

		// Texture & sensation
		"Is your home full of light, or dark and moody?",
		"Name a ritual that smooths your furrowed brow.",
		"What does comfort feel like to you?",
		"Describe a texture that takes you back somewhere.",
		"What time of day belongs to you alone?",
		"What small thing restores you when everything else fails?",
		"Where in the world do you breathe the deepest?",
		"What does your ideal silence look like?",

		// Challenge & growth
		"What have you survived that you rarely speak about?",
		"Name a belief you’ve had to unlearn.",
		"What is the hardest thing you’ve ever chosen?",
		"When did you disappoint yourself and forgive yourself anyway?",
		"What wound turned into a window?",
		"Name something that broke you open in a good way.",
		"What have you been wrong about for a long time?",
	];
	const randomIndex = Math.floor(Math.random() * sparks.length);
	const randomSpark = sparks[randomIndex];
	currentShardState.set({ spark: randomSpark });
}
function handleSparkRefreshClick() {
	const sparkRefreshButton = document.querySelector("#spark-refresh");
	const sparkText = document.querySelector("#spark-text");
	if (!sparkRefreshButton || !sparkText) return;

	sparkRefreshButton.addEventListener("click", () => {
		randomSpark();
		loadShardFormInfo();
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Handle Points Actions
// ----------------------------------------------------------------------------------------------------

function updateRotationPreview() {
	const svg = document.getElementById("rotation-preview");
	if (!svg) return;
	const arms = currentPointsState.get().rotationCount + 1;
	const r = 10;
	let lines = "";
	for (let i = 0; i < arms; i++) {
		const angle = (i / arms) * 2 * Math.PI - Math.PI / 2;
		const x = (Math.cos(angle) * r).toFixed(2);
		const y = (Math.sin(angle) * r).toFixed(2);
		lines += `<line x1="0" y1="0" x2="${x}" y2="${y}"/>`;
	}
	svg.innerHTML = lines;
}

function updateClickHint() {
	const hint = document.getElementById("voronoi-hint");
	if (!hint) return;
	const hasPoints = currentPointsState.get().points.length > 0;
	const isEditing = appState.get() === "pointsEditing";
	hint.classList.toggle("hidden", !isEditing || hasPoints);
}

function ensureClickHint() {
	if (document.getElementById("voronoi-hint")) return;
	const voronoiArea = document.getElementById("voronoi-area");
	if (!voronoiArea) return;
	const hint = document.createElement("p");
	hint.id = "voronoi-hint";
	hint.className = "hidden";
	hint.textContent = "Click anywhere";
	voronoiArea.appendChild(hint);
}

function handleIncreaseRotationClick() {
	const increaseRotationButton = document.querySelector("#increase-rotation");
	if (!increaseRotationButton) return;
	increaseRotationButton.addEventListener("click", () => {
		const currentState = currentPointsState.get();
		const newRotationCount = Math.min(currentState.rotationCount + 1, 9);
		currentPointsState.set(currentState.points, newRotationCount);
		updateVoronoiPaths(currentPointsState.get().points.length, currentPointsState.get().points);
		updateRotationPreview();
	});
}

function handleDecreaseRotationClick() {
	const decreaseRotationButton = document.querySelector("#decrease-rotation");
	if (!decreaseRotationButton) return;
	decreaseRotationButton.addEventListener("click", () => {
		const currentState = currentPointsState.get();
		const newRotationCount = Math.max(currentState.rotationCount - 1, 1);
		currentPointsState.set(currentState.points, newRotationCount);
		updateVoronoiPaths(currentPointsState.get().points.length, currentPointsState.get().points);
		updateRotationPreview();
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Voronoi Rendering
// ----------------------------------------------------------------------------------------------------

// Helper function to calculate the original index from a duplicated index
function calculateOriginalIndex(duplicatedIndex, originalLength) {
	console.log("calculateOriginalIndex: calculating original point index");
	if (originalLength <= 0) throw new Error("Invalid original length");
	// Original index is duplicatedIndex modulo originalLength
	return duplicatedIndex % originalLength;
}

// Setup the SVG structure for Voronoi rendering
function setupVoronoiSVG() {
	const voronoiContainer = document.getElementById("voronoi-area");
	if (!voronoiContainer) {
		console.error("Voronoi container not found.");
		return null;
	}

	// Check if SVG already exists
	let voronoiSvg = voronoiContainer.querySelector(".voronoi-svg");
	if (!voronoiSvg) {
		voronoiSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		voronoiContainer.style.position = "relative";
		voronoiContainer.appendChild(voronoiSvg);
		voronoiSvg.classList.add("voronoi-svg");
	}

	// Check if group already exists
	let voronoiGroup = voronoiSvg.querySelector("#voronoi-group");
	if (!voronoiGroup) {
		voronoiGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
		voronoiGroup.id = "voronoi-group";
		voronoiSvg.appendChild(voronoiGroup);
	}

	return { voronoiContainer, voronoiSvg, voronoiGroup };
}

// Update Voronoi paths - can be called from anywhere
function updateVoronoiPaths(originalLength, points, width, height) {
	console.log("updateVoronoiPaths: rendering voronoi diagram");

	const center = [0, 0];
	const svgElements = setupVoronoiSVG();
	if (!svgElements) return;

	const { voronoiContainer, voronoiGroup } = svgElements;

	// Use container dimensions if not provided
	if (!width || !height) {
		width = voronoiContainer.clientWidth;
		height = voronoiContainer.clientHeight;
	}

	// Use the smaller dimension to create a circular viewport
	const minDimension = Math.min(width, height);
	const radius = minDimension / 2;

	// Convert normalized points (-1 to 1) to pixel coordinates
	const pixelPoints = points.map(([normalizedX, normalizedY]) => {
		const pixelX = normalizedX * (radius * 0.8);
		const pixelY = normalizedY * (radius * 0.8);
		return [pixelX, pixelY];
	});

	// Batch DOM operations to reduce reflows
	const fragment = document.createDocumentFragment();

	// Remove only the old Voronoi cell paths - more efficient selection
	const oldPaths = voronoiGroup.querySelectorAll("path");
	oldPaths.forEach((p) => p.remove());

	const newPoints = duplicateAndRotatePoints(pixelPoints, currentPointsState.get().rotationCount, center);

	if (newPoints.length < 2) return;

	// Use rectangular bounds for Voronoi generation, but clip with circle
	const voronoiWidth = minDimension;
	const voronoiHeight = minDimension;
	const delaunay = Delaunay.from(newPoints);
	const voronoi = delaunay.voronoi([-1 * (voronoiWidth / 2), -1 * (voronoiHeight / 2), voronoiWidth / 2, voronoiHeight / 2]);

	// Set the transform on the group
	voronoiGroup.setAttribute("transform", `translate(${width / 2}, ${height / 2})`);

	// Helper function to check if a cell intersects with the circular boundary
	function cellIntersectsCircle(cellPolygon, radius) {
		const tolerance = 1; // Small tolerance for floating point comparison

		return cellPolygon.some(([x, y]) => {
			const distanceFromCenter = Math.sqrt(x * x + y * y);
			return distanceFromCenter >= radius - tolerance;
		});
	}

	// Function to clip a polygon against a circle
	function clipPolygonToCircle(polygon, radius) {
		// Simple approach: filter out vertices outside the circle
		// For more precise clipping, you'd need a more complex algorithm
		const clippedVertices = [];

		for (let i = 0; i < polygon.length; i++) {
			const [x, y] = polygon[i];
			const distanceFromCenter = Math.sqrt(x * x + y * y);

			// If vertex is inside circle, keep it
			if (distanceFromCenter <= radius) {
				clippedVertices.push([x, y]);
			} else {
				// Find intersection points with circle
				const prevIndex = (i - 1 + polygon.length) % polygon.length;
				const nextIndex = (i + 1) % polygon.length;
				const prev = polygon[prevIndex];
				const next = polygon[nextIndex];

				// Check intersection with previous edge
				const prevDist = Math.sqrt(prev[0] * prev[0] + prev[1] * prev[1]);
				if (prevDist <= radius) {
					const intersection = findCircleLineIntersection(prev, [x, y], radius);
					if (intersection) clippedVertices.push(intersection);
				}

				// Check intersection with next edge
				const nextDist = Math.sqrt(next[0] * next[0] + next[1] * next[1]);
				if (nextDist <= radius) {
					const intersection = findCircleLineIntersection([x, y], next, radius);
					if (intersection) clippedVertices.push(intersection);
				}
			}
		}

		return clippedVertices.length >= 3 ? clippedVertices : null;
	}

	// Helper function to find intersection between line segment and circle
	function findCircleLineIntersection([x1, y1], [x2, y2], radius) {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const dr = Math.sqrt(dx * dx + dy * dy);
		const D = x1 * y2 - x2 * y1;

		const discriminant = radius * radius * (dr * dr) - D * D;
		if (discriminant < 0) return null; // No intersection

		const sqrtDiscriminant = Math.sqrt(discriminant);
		const sign = dy < 0 ? -1 : 1;

		// Two possible intersection points, choose the one closer to the segment
		const x_1 = (D * dy + sign * dx * sqrtDiscriminant) / (dr * dr);
		const y_1 = (-D * dx + Math.abs(dy) * sqrtDiscriminant) / (dr * dr);

		const x_2 = (D * dy - sign * dx * sqrtDiscriminant) / (dr * dr);
		const y_2 = (-D * dx - Math.abs(dy) * sqrtDiscriminant) / (dr * dr);

		// Choose the intersection point that's within the line segment
		const t1 = dx !== 0 ? (x_1 - x1) / dx : (y_1 - y1) / dy;
		const t2 = dx !== 0 ? (x_2 - x1) / dx : (y_2 - y1) / dy;

		if (t1 >= 0 && t1 <= 1) return [x_1, y_1];
		if (t2 >= 0 && t2 <= 1) return [x_2, y_2];

		return null;
	}

	// Proper polygon offset function - moves each edge perpendicular to itself
	function offsetPolygon(polygon, offsetDistance) {
		if (!polygon || polygon.length < 3) return polygon;

		const offsetVertices = [];
		const numVertices = polygon.length;

		for (let i = 0; i < numVertices; i++) {
			const prevIndex = (i - 1 + numVertices) % numVertices;
			const nextIndex = (i + 1) % numVertices;

			const prev = polygon[prevIndex];
			const current = polygon[i];
			const next = polygon[nextIndex];

			// Calculate edge vectors
			const edge1 = [current[0] - prev[0], current[1] - prev[1]];
			const edge2 = [next[0] - current[0], next[1] - current[1]];

			// Calculate normal vectors (perpendicular to edges, pointing inward for negative offset)
			const normal1 = [-edge1[1], edge1[0]];
			const normal2 = [-edge2[1], edge2[0]];

			// Normalize the normal vectors
			const length1 = Math.sqrt(normal1[0] * normal1[0] + normal1[1] * normal1[1]);
			const length2 = Math.sqrt(normal2[0] * normal2[0] + normal2[1] * normal2[1]);

			if (length1 > 0) {
				normal1[0] /= length1;
				normal1[1] /= length1;
			}
			if (length2 > 0) {
				normal2[0] /= length2;
				normal2[1] /= length2;
			}

			// Calculate the average normal (bisector)
			const bisector = [(normal1[0] + normal2[0]) / 2, (normal1[1] + normal2[1]) / 2];

			// Normalize the bisector
			const bisectorLength = Math.sqrt(bisector[0] * bisector[0] + bisector[1] * bisector[1]);
			if (bisectorLength > 0) {
				bisector[0] /= bisectorLength;
				bisector[1] /= bisectorLength;
			}

			// Calculate the angle between the edges to determine offset scaling
			const dot = normal1[0] * normal2[0] + normal1[1] * normal2[1];
			const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
			const scale = angle > 0 ? 1 / Math.sin(angle / 2) : 1;

			// Apply the offset
			const scaledOffset = Math.min(scale, 5) * offsetDistance; // Limit scaling to prevent extreme values
			offsetVertices.push([current[0] + bisector[0] * scaledOffset, current[1] + bisector[1] * scaledOffset]);
		}

		return offsetVertices;
	}

	for (let i = 0; i < newPoints.length; i++) {
		const cellPolygon = voronoi.cellPolygon(i);
		if (!cellPolygon) continue;

		// Skip cells that extend beyond the circular boundary
		if (cellIntersectsCircle(cellPolygon, radius)) {
			continue;
		}

		const originalIndex = calculateOriginalIndex(i, originalLength);

		// Create multiple paths for each cell
		const pathConfigs = [
			{
				offset: 0,
				className: "voronoi-cell-border",
				className2: "embossed-glass",
			},
			{
				offset: 0.5,
				className: "voronoi-cell",
			},
		];

		pathConfigs.forEach((config) => {
			// Get the appropriate path data
			let cellPath;
			if (config.offset === 0) {
				cellPath = voronoi.renderCell(i);
			} else {
				const offsetPoly = offsetPolygon(cellPolygon, config.offset);
				cellPath = offsetPoly.map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x},${y}`).join(" ") + "Z";
			}

			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

			// Batch class operations
			path.className.baseVal = config.className + (config.className2 ? ` ${config.className2}` : "");
			path.setAttribute("d", cellPath);
			path.dataset.index = i;
			path.dataset.originalIndex = originalIndex;

			// Add to fragment instead of directly to DOM
			fragment.appendChild(path);
		});
	}

	// Single DOM insertion
	voronoiGroup.appendChild(fragment);
}

// Debounce function for resize events
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Setup event handling for adding points during editing
function handleAddVoronoiPoint() {
	console.log("handleAddVoronoiPoint: setting up voronoi point adding");

	const svgElements = setupVoronoiSVG();
	if (!svgElements) return;

	const { voronoiContainer } = svgElements;
	ensureClickHint();

	// Debounce the update function to prevent excessive re-rendering
	const debouncedUpdate = debounce((points, length, width, height) => {
		updateVoronoiPaths(length, points, width, height);
	}, 16); // ~60fps

	voronoiContainer.addEventListener("click", (e) => {
		if (appState.get() === "pointsEditing") {
			requestAnimationFrame(() => {
				const rect = voronoiContainer.getBoundingClientRect();
				const width = voronoiContainer.clientWidth;
				const height = voronoiContainer.clientHeight;

				// Calculate click position relative to center
				const clickX = e.clientX - rect.left - rect.width / 2;
				const clickY = e.clientY - rect.top - rect.height / 2;

				// Convert pixel coordinates to normalized coordinates (-1 to 1)
				const minDimension = Math.min(width, height);
				const radius = minDimension / 2;
				const maxCoordinate = radius * 0.8;

				const normalizedX = Math.max(-1, Math.min(1, clickX / maxCoordinate));
				const normalizedY = Math.max(-1, Math.min(1, clickY / maxCoordinate));

				currentPointsState.push([normalizedX, normalizedY]);
				updateClickHint();

				// Use debounced update
				debouncedUpdate(currentPointsState.get().points, currentPointsState.get().points.length, width, height);
			});
		}
	});
}

// Creates a kaleidoscopic effect by duplicating and rotating points around the center of the container div.
// This has no effect on the points array stored in the backend.
function duplicateAndRotatePoints(points, duplicatesCount, center) {
	console.log("duplicateAndRotatePoints: creating kaleidoscopic pattern");
	console.log("Points:", points.length, "Duplicates count:", duplicatesCount);

	if (duplicatesCount === 0) {
		console.log("No rotation duplicates, returning original points");
		return [...points];
	}

	const angleStep = 360 / (duplicatesCount + 1); // degrees
	const radians = (angle) => (angle * Math.PI) / 180;

	// Helper to rotate a point [x, y] around center [cx, cy]
	function rotatePoint([x, y], angleDeg, [cx, cy]) {
		const angleRad = radians(angleDeg);
		const dx = x - cx;
		const dy = y - cy;
		const cos = Math.cos(angleRad);
		const sin = Math.sin(angleRad);
		const rx = dx * cos - dy * sin + cx;
		const ry = dx * sin + dy * cos + cy;
		return [rx, ry];
	}

	// Start with a shallow copy of original points
	const result = [...points];

	for (let i = 1; i <= duplicatesCount; i++) {
		const angle = angleStep * i;
		points.forEach((pt) => {
			const rotatedPt = rotatePoint(pt, angle, center);
			result.push(rotatedPt);
		});
	}

	console.log(`Total points after rotation: ${result.length} (original: ${points.length})`);
	return result;
}
function updateVoronoiWithShards(shards = []) {
	console.log("updateVoronoiWithShards: applying shard data to voronoi cells.  Shards: ", shards);

	// Use more efficient selector and batch operations
	const voronoiCells = document.querySelectorAll(".voronoi-cell");

	// Create a Map for faster shard lookup
	const shardMap = new Map();
	shards.forEach((shard) => {
		if (!shardMap.has(shard.point)) {
			shardMap.set(shard.point, []);
		}
		shardMap.get(shard.point).push(shard);
	});

	// Batch DOM updates
	voronoiCells.forEach((cell) => {
		// Clear existing shard data
		delete cell.dataset.shardId;
		delete cell.dataset.shardTint;
		cell.classList.remove("glow");

		// Apply shard data if exists
		const originalIndex = cell.dataset.originalIndex;
		const cellShards = shardMap.get(parseInt(originalIndex));

		if (cellShards && cellShards.length > 0) {
			const shard = cellShards[0]; // Use first shard if multiple
			cell.dataset.shardId = shard.id;
			cell.dataset.shardTint = shard.tint;

			if (shard.glow > 0) {
				cell.classList.add("glow");
			}
		}
	});

	// Re-scan for FxFilter effects now that content is rendered and has dimensions
	if (window.FxFilter) {
		window.FxFilter.scanElements();
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

export {
	handleCreateShardClick,
	handleDeleteShardClick,
	handleEditShardClick,
	handleShardHover,
	handleHideShardCrudClick,
	handleShardClick,
	handleGlowClick,
	handleTintClick,
	handleSparkRefreshClick,
	handleAddVoronoiPoint,
	handleIncreaseRotationClick,
	handleDecreaseRotationClick,
	fetchShards,
	currentPointsState,
	appState,
};
