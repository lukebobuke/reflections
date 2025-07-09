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
	const { text, tint, glow } = data;
	if (!text || typeof text !== "string") {
		throw new Error("Invalid shard text");
	}
	if (isNaN(tint) || tint < 0 || tint > 8) {
		throw new Error("validateShardData in shards.js:  Tint must be a number between 0 and 8.");
	}
	if (glow < 0 || glow > 1) {
		throw new Error("validateShardData in shards.js:  Glow must be a number between 0 and 1.");
	}
	return {
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
	const submitText = document.getElementById("shard-form-submit-text");
	const deleteBtn = document.getElementById("shard-form-delete-btn");
	const glowIcon = document.querySelector("#shard-form-glow-icon");
	if (!form || !submitText || !deleteBtn) return;
	const type = form.dataset.shardFormType;
	if (type === "edit") {
		submitText.textContent = "Update Shard";
		deleteBtn.classList.remove("hidden");
		shardCrudFormTitle.textContent = "Edit Shard";
	} else if (type === "create") {
		submitText.textContent = "Create Shard";
		deleteBtn.classList.add("hidden");
		shardCrudFormTitle.textContent = "Create New Shard";
	}
	if (form.dataset.glow === "1" || form.dataset.glow === 1) {
		glowIcon.classList.add("fa-solid");
		glowIcon.classList.remove("fa-regular");
	} else {
		glowIcon.classList.remove("fa-solid");
		glowIcon.classList.add("fa-regular");
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
	const formContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!shardContainer || !formContainer || !shardCrudForm) return;
	shardContainer.addEventListener("click", function (e) {
		const shard = e.target.closest(".shard");
		if (shard && shardContainer.contains(shard)) {
			console.log("Shard clicked:", shard);
			shardCrudForm.dataset.shardFormType = "edit";
			const shardId = shard.dataset.shardId;
			shardCrudForm.classList.remove("hidden");
			formContainer.classList.remove("hidden");
			shardCrudForm.dataset.currentShardId = shardId;
			shardCrudForm.elements["text"].value = shard.dataset.shardText;
			shardCrudForm.elements["tint"].value = shard.dataset.shardTint;
			shardCrudForm.dataset.glow = shard.dataset.shardGlow;
			console.log("form:", shardCrudForm);
			updateShardFormUI();
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
				const text = shardCrudForm.elements["text"].value;
				const tint = shardCrudForm.elements["tint"].value;
				const glow = shardCrudForm.dataset.glow || "0";
				const rawData = { text, tint, glow };
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
				const text = document.querySelector("#shard-form-text").value;
				const tint = document.querySelector("#shard-form-tint").value;
				const glow = shardCrudForm.dataset.glow || "0";
				const rawData = { text, tint, glow };
				console.log("Raw data for shard creation:", rawData);
				const validatedData = validateShardData(rawData);
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
	if (!container) return;

	container.addEventListener("mouseover", function (e) {
		const shardElem = e.target.closest(".shard");
		if (shardElem && container.contains(shardElem)) {
			const shardId = shardElem.dataset.shardId;
			if (!shardId) return;
			const infoElem = container.querySelector(`.shard-info[data-shard-id="${shardId}"]`);
			if (infoElem) infoElem.classList.remove("hidden");
			shardElem.classList.add("popped");
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
	const crudContainer = document.querySelector("#shard-crud-container");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!showButton || !crudContainer || !shardCrudForm) return;
	showButton.addEventListener("click", () => {
		shardCrudForm.dataset.shardFormType = "create";
		shardCrudForm.dataset.currentShardId = "";
		shardCrudForm.reset();
		shardCrudForm.dataset.glow = "0"; // Reset glow state
		crudContainer.classList.remove("hidden");
		updateShardFormUI();
	});
}

function handleGlowClick() {
	const glowButton = document.querySelector("#shard-form-glow-btn");
	const glowIcon = document.querySelector("#shard-form-glow-icon");
	const shardCrudForm = document.querySelector("#shard-crud-form");
	if (!glowButton || !glowIcon || !shardCrudForm) {
		console.log("Glow button or icon or form not found.");
		return;
	}
	glowButton.addEventListener("click", () => {
		let glow = parseInt(shardCrudForm.dataset.glow, 10) || 0;
		if (glow === 0) {
			glow = 1;
			glowIcon.classList.add("fa-solid");
			glowIcon.classList.remove("fa-regular");
		} else {
			glow = 0;
			glowIcon.classList.remove("fa-solid");
			glowIcon.classList.add("fa-regular");
		}
		console.log("Updated glow state:", glow);
		shardCrudForm.dataset.glow = glow;
	});
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
	handleShardClick,
	handleGlowClick,
};
