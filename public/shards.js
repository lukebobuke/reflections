/** @format */

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

function validateShardData(data) {
	const { text, tint, glow } = data;
	if (!text || typeof text !== "string") {
		throw new Error("Invalid shard text");
	}
	if (isNaN(tint) || tint < 0 || tint > 8) {
		throw new Error("Tint must be a number between 0 and 8.");
	}
	if (isNaN(glow) || glow < 0 || glow > 13) {
		throw new Error("Glow must be a number between 0 and 13.");
	}
	return {
		text: text.trim(),
		tint: parseInt(tint, 10) || 0,
		glow: parseInt(glow, 10) || 0,
	};
}

function updateShardFormUI() {
	const form = document.getElementById("shard-crud-form");
	const submitText = document.getElementById("shard-form-submit-text");
	const deleteBtn = document.getElementById("shard-form-delete-btn");
	if (!form || !submitText || !deleteBtn) return;
	const type = form.dataset.shardFormType;
	if (type === "edit") {
		submitText.textContent = "Update Shard";
		deleteBtn.classList.remove("hidden");
	} else {
		submitText.textContent = "Create Shard";
		deleteBtn.classList.add("hidden");
	}
}

// Update UI when switching to edit mode
function handleShardClick() {
	const shardContainer = document.getElementById("shards-list-container");
	const formContainer = document.querySelector("#shard-crud-container");
	const form = document.querySelector("#shard-crud-form");
	if (!shardContainer || !formContainer || !form) return;

	shardContainer.addEventListener("click", function (e) {
		const shard = e.target.closest(".shard");
		console.log("Shard clicked:", shard);
		if (shard && shardContainer.contains(shard)) {
			const shardId = shard.dataset.shardId;
			form.classList.remove("hidden");
			formContainer.classList.remove("hidden");
			form.dataset.shardFormType = "edit";
			form.dataset.currentShardId = shardId;
			form.elements["text"].value = shard.dataset.shardText;
			form.elements["tint"].value = shard.dataset.shardTint;
			form.elements["glow"].value = shard.dataset.shardGlow;
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
			const formData = new FormData(shardCrudForm);
			const rawData = Object.fromEntries(formData.entries());
			try {
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
	const shardCrudForm = document.querySelector("#shard-crud-form");
	const shardCrudContainer = document.querySelector("#shard-crud-container");
	console.log("shardCrudForm:", shardCrudForm);
	if (!shardCrudForm || !shardCrudContainer) return;
	shardCrudForm.addEventListener("submit", async function (e) {
		if (shardCrudForm && shardCrudForm.dataset.shardFormType == "create") {
			e.preventDefault();
			const formData = new FormData(shardCrudForm);
			const rawData = Object.fromEntries(formData.entries());
			try {
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
	console.log("Show shard crud button:", showButton);
	const crudContainer = document.querySelector("#shard-crud-container");
	if (!showButton || !crudContainer) return;
	showButton.addEventListener("click", () => {
		crudContainer.classList.remove("hidden");
	});
}

export { handleCreateShardClick, handleDeleteShardClick, handleEditShardClick, handleShardHover, handleShowShardCrudClick, handleShardClick };
