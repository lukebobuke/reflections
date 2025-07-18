/** @format */
import { Delaunay } from "https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm";

// ----------------------------------------------------------------------------------------------------
// #region API Calls
// ----------------------------------------------------------------------------------------------------
async function editShard(shardId, data) {
	const response = await fetch(`/shards/${shardId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	// Debugging: log the response status and body
	console.log("Edit shard response status:", response.status);
	const respText = await response.text();
	if (!response.ok) {
		throw new Error("From shards.js, failed to update shard");
	}
	return respText;
}

async function deleteShard(shardId) {
	const response = await fetch(`/shards/${shardId}`, { method: "DELETE" });
	if (!response.ok) {
		throw new Error("From shards.js, failed to delete shard");
	}
	console.log("Delete shard response:", response);
	return response.text();
}

async function createShard(data) {
	const response = await fetch("/shards", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("From shards.js, failed to create shard");
	}
	console.log("Shard creation response:", response);
	return response.text();
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Validation
// ----------------------------------------------------------------------------------------------------
function validateShardData(data) {
	const { spark, text, tint, glow } = data;
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
	return {
		spark: spark.trim(),
		text: text.trim(),
		tint: parseInt(tint, 10) || 0,
		glow: parseInt(glow, 10) || 0,
	};
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region UI Helpers
// ----------------------------------------------------------------------------------------------------
function updateShardFormUI() {
	const form = document.getElementById("shard-crud-form");
	const shardCrudFormTitle = document.getElementById("shard-crud-form-title");
	const sparkRefresh = document.getElementById("spark-refresh");
	const submitText = document.getElementById("shard-form-submit-text");
	const deleteBtn = document.getElementById("shard-form-delete-btn");
	const glowButton = document.querySelector("#shard-form-glow-btn");
	if (!form || !submitText || !deleteBtn) return;
	const type = form.dataset.shardFormType;
	if (type === "edit") {
		submitText.textContent = "Update Shard";
		deleteBtn.classList.remove("hidden");
		shardCrudFormTitle.textContent = "Edit Shard";
		sparkRefresh.classList.add("hidden");
	} else if (type === "create") {
		submitText.textContent = "Create Shard";
		deleteBtn.classList.add("hidden");
		shardCrudFormTitle.textContent = "Create New Shard";
		sparkRefresh.classList.remove("hidden");
	}
	if (form.dataset.glow === "1" || form.dataset.glow === 1) {
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
	const sparkText = document.querySelector("#spark-text");
	const tintPetals = document.querySelectorAll(".tint-petal");
	if (!shardContainer || !shardCrudContainer || !shardCrudForm) {
		console.log("One or more required elements are missing.");
		return;
	}
	shardContainer.addEventListener("click", function (e) {
		if (shardCrudContainer.classList.contains("hidden") && isVoronoiEditEnabled() === false) {
			const shard = e.target.closest(".shard");
			console.log("Shard clicked:", shard);
			if (shard && shardContainer.contains(shard)) {
				shardCrudForm.dataset.shardFormType = "edit";
				const shardId = shard.dataset.shardId;
				shardCrudForm.classList.remove("hidden");
				shardCrudContainer.classList.remove("hidden");
				shardCrudForm.dataset.currentShardId = shardId;
				sparkText.textContent = shard.dataset.shardSpark;
				shardCrudForm.elements["text"].value = shard.dataset.shardText;
				shardCrudForm.dataset.tint = shard.dataset.shardTint;
				tintPetals.forEach((tintPetal) => {
					if (tintPetal.dataset.tint == shardCrudForm.dataset.tint) {
						tintPetal.classList.add("tint-selected");
					} else {
						tintPetal.classList.remove("tint-selected");
					}
				});
				shardCrudForm.dataset.glow = shard.dataset.shardGlow;
				console.log("form:", shardCrudForm);
				updateShardFormUI();
			}
		}
	});
}

// ----------------------------------------------------------------------------------------------------
// #region Show/Hide Shard CRUD
// ----------------------------------------------------------------------------------------------------
function handleShowShardCrudClick(pressable) {
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const sparkText = document.querySelector("#spark-text");
	if (!pressable || !shardCrudContainer || !shardCrudForm || !sparkText) return;
	pressable.addEventListener("click", () => {
		shardCrudForm.dataset.shardFormType = "create";
		shardCrudForm.dataset.currentShardId = "";
		shardCrudForm.reset();
		sparkText.textContent = randomSpark(); // Set initial spark text
		shardCrudForm.dataset.glow = "0"; // Reset glow state
		shardCrudContainer.classList.remove("hidden");
		updateShardFormUI();
	});
}
function handleHideShardCrudClick() {
	const crudContainer = document.querySelector("#shard-crud-container");
	if (!crudContainer) return;
	document.addEventListener("click", (e) => {
		if (
			!crudContainer.contains(e.target) &&
			!e.target.closest("#show-shard-crud") &&
			!e.target.closest("#shard-crud-form") &&
			!e.target.closest(".shard")
		) {
			crudContainer.classList.add("hidden");
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Edit Shard Click
// ----------------------------------------------------------------------------------------------------
function handleEditShardClick() {
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	if (!shardCrudForm || !shardCrudContainer) return;
	shardCrudForm.addEventListener("submit", async function (e) {
		if (shardCrudForm && shardCrudForm.dataset.shardFormType == "edit") {
			const shardId = shardCrudForm.dataset.currentShardId;
			if (!shardId) throw new Error("Shard ID is missing.");
			e.preventDefault();
			try {
				const spark = document.querySelector("#spark-text").textContent;
				const text = shardCrudForm.elements["text"].value;
				const tint = shardCrudForm.dataset.tint;
				const glow = shardCrudForm.dataset.glow || "0";
				const rawData = { spark, text, tint, glow };
				const validatedData = validateShardData(rawData);
				const html = await editShard(shardId, validatedData);
				document.getElementById("shards-list-container").innerHTML = html;
				shardCrudForm.reset();
				shardCrudContainer.classList.add("hidden");
				shardCrudForm.dataset.shardFormType = "create";
				delete shardCrudForm.dataset.currentShardId;
				updateShardFormUI();
			} catch (error) {
				alert(error.message);
			}
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Create Shard Click
// ----------------------------------------------------------------------------------------------------
function handleCreateShardClick() {
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!shardCrudForm || !shardCrudContainer) return;
	shardCrudForm.addEventListener("submit", async function (e) {
		if (shardCrudForm && shardCrudForm.dataset.shardFormType == "create") {
			e.preventDefault();
			try {
				const spark = document.querySelector("#spark-text").textContent;
				const text = document.querySelector("#shard-form-text").value;
				const tint = shardCrudForm.dataset.tint || "0";
				const glow = shardCrudForm.dataset.glow || "0";
				const rawData = { spark, text, tint, glow };
				const validatedData = validateShardData(rawData);
				console.log("Validated data for shard creation:", validatedData);
				const html = await createShard(validatedData);
				document.getElementById("shards-list-container").innerHTML = html;
				shardCrudForm.reset();
				shardCrudContainer.classList.add("hidden");
				updateShardFormUI();
			} catch (error) {
				alert(error.message);
			}
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Delete Shard Click
// ----------------------------------------------------------------------------------------------------
function handleDeleteShardClick() {
	const formDeleteButton = document.getElementById("shard-form-delete-btn");
	const form = document.getElementById("shard-crud-form");
	const formContainer = document.getElementById("shard-crud-container");
	if (!formDeleteButton || !form || !formContainer) return;
	formDeleteButton.addEventListener("click", async function () {
		const formType = form.dataset.shardFormType;
		const shardId = form.dataset.currentShardId;
		if (formType !== "edit" || !shardId) {
			alert("No shard selected for deletion.");
			return;
		}
		try {
			const html = await deleteShard(shardId);
			document.getElementById("shards-list-container").innerHTML = html;
			form.reset();
			formContainer.classList.add("hidden");
			form.dataset.shardFormType = "create";
			delete form.dataset.currentShardId;
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
		if (shardCrudContainer.classList.contains("hidden")) {
			const shardElem = e.target.closest(".shard");
			if (shardElem && shardContainer.contains(shardElem) && isVoronoiEditEnabled() === false) {
				// const shardId = shardElem.dataset.shardId;
				// if (!shardId) return;
				// const infoElem = shardContainer.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
				// if (infoElem) infoElem.classList.remove("hidden");
				shardElem.classList.add("popped");
			}
		}
	});
	shardContainer.addEventListener("mouseout", function (e) {
		const shardElem = e.target.closest(".shard");
		if (shardElem && shardContainer.contains(shardElem)) {
			// const shardId = shardElem.dataset.shardId;
			// if (!shardId) return;
			// const infoElem = shardContainer.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
			// if (infoElem) infoElem.classList.add("hidden");
			shardElem.classList.remove("popped");
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
		let glow = parseInt(shardCrudForm.dataset.glow, 10) || 0;
		if (glow === 0) {
			glow = 1;
			glowButton.classList.add("glow-clicked");
		} else {
			glow = 0;
			glowButton.classList.remove("glow-clicked");
		}
		console.log("Updated glow state:", glow);
		shardCrudForm.dataset.glow = glow;
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
					shardCrudForm.dataset.tint = 1;
				}
			});
			tintPetal.classList.add("tint-selected");
			shardCrudForm.dataset.tint = tintPetal.dataset.tint;
		});
	});
	updateShardFormUI();
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
	return randomSpark;
}
function handleSparkRefreshClick() {
	const sparkRefreshButton = document.querySelector("#spark-refresh");
	const sparkText = document.querySelector("#spark-text");
	if (!sparkRefreshButton || !sparkText) return;

	sparkRefreshButton.addEventListener("click", () => {
		sparkText.textContent = randomSpark();
		console.log("Spark text refreshed:", sparkText.textContent);
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

function updateVoronoi(voronoiGroup, points, width, height) {
	// Remove only the old Voronoi cell paths, not the group itself or its event listeners
	const oldPaths = voronoiGroup.querySelectorAll("path.shard");
	oldPaths.forEach((p) => p.remove());
	if (points.length < 2) return;
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([-1 * (width / 2), -1 * (height / 2), width / 2, height / 2]);
	for (let i = 0; i < points.length; i++) {
		const cellPath = voronoi.renderCell(i);
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.classList.add("shard");
		// set the path data for the Voronoi cell
		path.setAttribute("d", cellPath);
		path.dataset.index = i;
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

				updateVoronoi(voronoiGroup, newPoints, width, height);
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
	handleShowShardCrudClick,
	handleHideShardCrudClick,
	handleShardClick,
	handleGlowClick,
	handleTintClick,
	handleSparkRefreshClick,
	handleAddVoronoiPoint,
	editVoronoi,
	finishEditVoronoi,
};
