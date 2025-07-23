/** @format */
import { Delaunay } from "https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm";

const createAppState = () => {
	let state = null;
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	return {
		get: function () {
			return state;
		},
		set: {
			mainView: async () => {
				state = "mainView";
				console.log("App state set to mainView");
				if (!shardCrudContainer) return;
				shardCrudContainer.classList.add("hidden");
				// Fetch and update shards when returning to main view
				try {
					currentShards = await fetchShards();
					updateVoronoiWithShards(currentShards);
					FxFilter.scanElements();
				} catch (error) {
					console.error("Error fetching shards:", error);
				}
			},
			shardCreation: () => {
				state = "shardCreation";
				currentShardState.clear();
				randomSpark();
				updateShardFormUI();
				loadShardFormInfo();
				shardCrudContainer.classList.remove("hidden");
				console.log("App state set to shardCreation");
			},
			shardEditing: () => {
				state = "shardEditing";
				updateShardFormUI();
				loadShardFormInfo();
				shardCrudContainer.classList.remove("hidden");
				console.log("App state set to shardEditing");
			},
			voronoiEditing: () => {
				state = "voronoiEditing";
				shardCrudContainer.classList.add("hidden");
				console.log("App state set to voronoiEditing");
			},
		},
	};
};
const appState = createAppState();
appState.set.mainView();
// Store shards globally for state management
let currentShards = [];

// ----------------------------------------------------------------------------------------------------
// #region API Calls
// ----------------------------------------------------------------------------------------------------
async function createShardRequest(data) {
	const response = await fetch("/shards", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	console.log("response:", response);
	if (!response.ok) {
		throw new Error("From shards.js, failed to create shard");
	}
	const shards = await response.json();
	console.log("Shard creation response:", shards);
	return shards;
}

async function editShardRequest(shardId, data) {
	const response = await fetch(`/shards/${shardId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	console.log("Edit shard response status:", response.status);
	if (!response.ok) {
		throw new Error("From shards.js, failed to update shard");
	}
	const shards = await response.json();
	return shards;
}

async function deleteShardRequest(shardId) {
	const response = await fetch(`/shards/${shardId}`, { method: "DELETE" });
	if (!response.ok) {
		throw new Error("From shards.js, failed to delete shard");
	}
	console.log("Delete shard response:", response);
	const shards = await response.json();
	return shards;
}

async function fetchShards() {
	const response = await fetch("/shards/api/user-shards");
	if (!response.ok) {
		throw new Error("Failed to fetch shards");
	}
	return await response.json();
}

async function createVoronoiPattern(points, rotationCount) {
	const payload = {
		rotationCount,
		points,
	};

	const response = await fetch("/api/voronoi-patterns", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error("Failed to save Voronoi pattern");
	}

	return await response.json(); // or response.text() based on your backend response
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
// #region UI Helpers
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
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Handle Shard Click
// ----------------------------------------------------------------------------------------------------
function handleShardClick() {
	const shardContainer = document.querySelector("#voronoi-group");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!shardContainer || !shardCrudContainer || !shardCrudForm) {
		console.log("One or more required elements are missing.");
		return;
	}
	shardContainer.addEventListener("click", function (e) {
		if (appState.get() === "mainView") {
			e.stopPropagation();
			const voronoiCell = e.target.closest(".voronoi-cell");
			console.log("Voronoi Cell clicked:", voronoiCell);
			// display create shard CRUD form
			if (voronoiCell && shardContainer.contains(voronoiCell) && !voronoiCell.dataset.shardId) {
				console.log("shard CRUD form initialized");
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
// #region Hide Shard CRUD
// ----------------------------------------------------------------------------------------------------

function handleHideShardCrudClick() {
	const crudContainer = document.querySelector("#shard-crud-container");
	if (!crudContainer) return;
	// Listen for clicks on the document
	document.addEventListener("click", (e) => {
		// Check if we're in a state where we should close the form
		if (appState.get() === "shardCreation" || appState.get() === "shardEditing") {
			// If the click is outside the container, close the form
			if (!crudContainer.contains(e.target)) {
				console.log("Clicked outside shardCrudContainer. Hiding shard CRUD container");
				appState.set.mainView();
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
			console.log("Current shard state updated:", state);
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
			console.log("Current shard state cleared.");
		},
	};
}
const currentShardState = createCurrentShardState();

function updateVoronoiWithShards(shards = []) {
	const voronoiCells = document.querySelectorAll(".voronoi-cell");

	voronoiCells.forEach((cell) => {
		// Clear existing shard data
		delete cell.dataset.shardId;
		delete cell.dataset.shardTint;
		cell.classList.remove("glow");
	});

	// Apply shard data to corresponding cells
	shards.forEach((shard) => {
		const cells = document.querySelectorAll(`[data-original-index="${shard.point}"]`);
		cells.forEach((cell) => {
			cell.dataset.shardId = shard.id;
			cell.dataset.shardTint = shard.tint;

			// Apply visual styling
			if (shard.glow > 0) {
				cell.classList.add("glow");
			}
		});
	});
}

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
				console.log("Validated data for shard creation:", validatedData);
				currentShards = await createShardRequest(validatedData);
				appState.set.mainView();
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
				appState.set.mainView();
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
			appState.set.mainView();
		} catch (error) {
			alert(error.message);
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Shard Hover
// ----------------------------------------------------------------------------------------------------
function handleShardHover(shardContainer, shardCrudContainer) {
	if (!shardContainer || !shardCrudContainer) {
		console.log("Shard container or shard CRUD container not found.");
		return;
	}
	shardContainer.addEventListener("mouseover", function (e) {
		if (appState.get() === "mainView") {
			const voronoiCell = e.target.closest(".voronoi-cell");
			if (voronoiCell && shardContainer.contains(voronoiCell) && isVoronoiEditEnabled() === false) {
				// const shardId = voronoiCell.dataset.shardId;
				// if (!shardId) return;
				// const infoElem = shardContainer.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
				// if (infoElem) infoElem.classList.remove("hidden");
				voronoiCell.classList.add("popped");
				voronoiCell.classList.add("hovered");
			}
		}
	});
	shardContainer.addEventListener("mouseout", function (e) {
		const voronoiCell = e.target.closest(".voronoi-cell");
		if (voronoiCell && shardContainer.contains(voronoiCell)) {
			// const shardId = voronoiCell.dataset.shardId;
			// if (!shardId) return;
			// const infoElem = shardContainer.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
			// if (infoElem) infoElem.classList.add("hidden");
			voronoiCell.classList.remove("popped");
			voronoiCell.classList.remove("hovered");
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Glow and Tint Handlers
// ----------------------------------------------------------------------------------------------------
function handleGlowClick() {
	const glowButton = document.querySelector("#shard-form-glow-btn");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!glowButton || !shardCrudForm) {
		console.log("Glow button or form not found.");
		return;
	}
	glowButton.addEventListener("click", () => {
		if (currentShardState.get().glow === 0) {
			currentShardState.set({ glow: 1 });
		} else {
			currentShardState.set({ glow: 0 });
		}
		console.log("Updated glow state:", currentShardState.get().glow);
		loadShardFormInfo();
	});
}
function handleTintClick() {
	const tintPetals = document.querySelectorAll(".tint-petal");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!tintPetals || !shardCrudForm) {
		console.log("tintPetal or shardCrudForm not found.");
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

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Sparks
// ----------------------------------------------------------------------------------------------------
function randomSpark() {
	const sparks = [
		"Which hue best reflects the emotion you carry today?",
		"Name a moment that cracked your heart.",
		"Years later, what memory is still just as clear?",
		"What is your deepest aspiration?",
		"Describe a part of yourself that’s been reforged by pressure.",
		"What makes you glow?",
		"Which moment do you reflect on daily?",
		"Has anyone ever made you melt? Are they still in your life?",
		"If you could etch one truth forever, what would it say?",
		"Is your home full of light, or dark and moody?",
		"Which part of you is fragile like glass?",
		"Name a ritual that smooths your furrowed brow.",
		"Have you ever broken something beyond repair?",
		"Some people have a hard exterior, what about you?",
		"What moment made your path clear?",
		"With whom are you comfortable being transparent?",
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
		console.log("Spark text refreshed:", currentShardState.get().spark);
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Voronoi Handlers
// ----------------------------------------------------------------------------------------------------
// Encapsulate voronoiEdit state using a closure and expose handlers
function createVoronoiEditState() {
	let voronoiEdit = false;
	function voronoiEditTrue() {
		voronoiEdit = true;
	}
	function voronoiEditFalse() {
		voronoiEdit = false;
	}
	function isVoronoiEditEnabled() {
		return voronoiEdit;
	}

	return { voronoiEditTrue, voronoiEditFalse, isVoronoiEditEnabled };
}
const { voronoiEditTrue, voronoiEditFalse, isVoronoiEditEnabled } = createVoronoiEditState();
function getOriginalIndex(duplicatedIndex, originalLength) {
	if (originalLength <= 0) throw new Error("Invalid original length");
	// Original index is duplicatedIndex modulo originalLength
	return duplicatedIndex % originalLength;
}
function updateVoronoi(voronoiGroup, originalLength, points, width, height) {
	// Remove only the old Voronoi cell paths, not the group itself or its event listeners
	const oldPaths = voronoiGroup.querySelectorAll("path.voronoi-cell");
	oldPaths.forEach((p) => p.remove());
	if (points.length < 2) return;
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([-1 * (width / 2), -1 * (height / 2), width / 2, height / 2]);
	for (let i = 0; i < points.length; i++) {
		const cellPath = voronoi.renderCell(i);
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		const originalIndex = getOriginalIndex(i, originalLength);
		path.classList.add("liquid-glass");
		path.classList.add("voronoi-cell");
		// set the path data for the Voronoi cell
		path.setAttribute("d", cellPath);
		path.dataset.index = i;
		path.dataset.originalIndex = originalIndex;
		voronoiGroup.appendChild(path);
	}
}
function handleAddVoronoiPoint() {
	const voronoiContainer = document.getElementById("shards-section");
	const voronoiSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const points = [];
	if (!voronoiContainer) {
		console.error("Voronoi container not found.");
		return;
	}
	voronoiContainer.style.position = "relative";
	voronoiContainer.appendChild(voronoiSvg);
	voronoiSvg.classList.add("voronoi-svg");
	const voronoiGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
	voronoiGroup.id = "voronoi-group";
	voronoiSvg.appendChild(voronoiGroup);
	voronoiContainer.addEventListener("click", (e) => {
		if (isVoronoiEditEnabled()) {
			requestAnimationFrame(() => {
				const rect = voronoiContainer.getBoundingClientRect();
				const width = voronoiContainer.clientWidth;
				const height = voronoiContainer.clientHeight;
				voronoiGroup.setAttribute("transform", `translate(${rect.width / 2}, ${rect.height / 2})`);
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				points.push([x, y]);

				const center = [0, 0];
				const duplicates = 5; // for example, 7 duplicates + original = 8 total rotational segments
				const newPoints = duplicateAndRotatePoints(points, duplicates, center);

				updateVoronoi(voronoiGroup, points.length, newPoints, width, height);
			});
		}
	});
}
// Example: call enableVoronoiEdit() from a button handler
function editVoronoi(pressable) {
	if (!pressable) {
		console.error("Edit Voronoi button not found.");
		return;
	}
	pressable.addEventListener("click", () => {
		if (isVoronoiEditEnabled() === true) {
			console.log("Voronoi edit is already enabled.");
			return;
		}
		console.log("Edit button clicked.");
		voronoiEditTrue();
		appState.set.voronoiEditing();
	});
}
function finishEditVoronoi(pressable) {
	if (!pressable) {
		console.error("Finish edit button not found.");
		return;
	}
	pressable.addEventListener("click", () => {
		if (isVoronoiEditEnabled() === false) {
			console.log("Voronoi edit is not enabled.");
			return;
		}
		console.log("Finish edit button clicked.");
		voronoiEditFalse();
		appState.set.mainView();
	});
}
function duplicateAndRotatePoints(points, duplicatesCount, center) {
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

	return result;
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
	editVoronoi,
	finishEditVoronoi,
};
