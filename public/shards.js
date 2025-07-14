/** @format */

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
// #region Event Handlers
// ----------------------------------------------------------------------------------------------------

// Update UI when switching to edit mode
function handleShardClick() {
	const shardContainer = document.getElementById("shards-list-container");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const sparkText = document.querySelector("#spark-text");
	const tintPetals = document.querySelectorAll(".tint-petal");
	if (!shardContainer || !shardCrudContainer || !shardCrudForm) return;
	shardContainer.addEventListener("click", function (e) {
		if (shardCrudContainer.classList.contains("hidden")) {
			const shard = e.target.closest(".shard");
			if (shard && shardContainer.contains(shard)) {
				console.log("Shard clicked:", shard);
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
				console.log("Raw data for shard edit:", rawData);
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

function handleCreateShardClick() {
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	console.log("shardCrudForm:", shardCrudForm);
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
				console.log("Raw data for shard creation:", rawData);
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

function handleShardHover() {
	const container = document.getElementById("shards-list-container");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	if (!container || !shardCrudContainer) return;
	container.addEventListener("mouseover", function (e) {
		if (shardCrudContainer.classList.contains("hidden")) {
			const shardElem = e.target.closest(".shard");
			if (shardElem && container.contains(shardElem)) {
				const shardId = shardElem.dataset.shardId;
				if (!shardId) return;
				const infoElem = container.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
				if (infoElem) infoElem.classList.remove("hidden");
				shardElem.classList.add("popped");
			}
		}
	});
	container.addEventListener("mouseout", function (e) {
		const shardElem = e.target.closest(".shard");
		if (shardElem && container.contains(shardElem)) {
			const shardId = shardElem.dataset.shardId;
			if (!shardId) return;
			const infoElem = container.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
			if (infoElem) infoElem.classList.add("hidden");
			shardElem.classList.remove("popped");
		}
	});
}

function handleShowShardCrudClick() {
	const showButton = document.querySelector("#show-shard-crud");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const sparkText = document.querySelector("#spark-text");
	if (!showButton || !shardCrudContainer || !shardCrudForm || !sparkText) return;
	showButton.addEventListener("click", () => {
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

function handleSparkRefreshClick() {
	const sparkRefreshButton = document.querySelector("#spark-refresh");
	const sparkText = document.querySelector("#spark-text");
	if (!sparkRefreshButton || !sparkText) return;

	sparkRefreshButton.addEventListener("click", () => {
		sparkText.textContent = randomSpark();
		console.log("Spark text refreshed:", sparkText.textContent);
	});
}

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
};

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
};
