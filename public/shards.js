/** @format */

async function editShard(shardId, shardData) {
	const response = await fetch(`/shard/${shardId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	return response.json();
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

function handleCreateShardClick() {
	const shardCreationForm = document.querySelector("#shard-creation-form");
	if (shardCreationForm) {
		shardCreationForm.addEventListener("submit", async function (e) {
			e.preventDefault();
			const formData = new FormData(shardCreationForm);
			const rawData = Object.fromEntries(formData.entries()); // Convert to plain object
			try {
				const validatedData = validateShardData(rawData);
				const html = await createShard(validatedData); // returns HTML partial
				document.getElementById("shards-list-container").innerHTML = html;
				shardCreationForm.reset();
			} catch (error) {
				alert(error.message);
			}
		});
	}
}

function handleDeleteShardClick() {
	const container = document.querySelector(".shard-list");
	console.log("Shard list container:", container);
	if (!container) {
		console.error("Shard list container not found.");
		return;
	}
	container.addEventListener("click", async function (e) {
		const button = e.target.closest(".delete-button");
		if (!button) {
			console.log("No button found in container.");
			return;
		}
		const shardId = button.dataset.shardId;
		console.log("Delete button clicked for shard ID:", shardId);
		if (!shardId) {
			alert("Shard ID is missing.");
			return;
		}
		try {
			const html = await deleteShard(shardId);
			container.innerHTML = html;
		} catch (error) {
			alert(error.message);
		}
	});
}

export { handleCreateShardClick, handleDeleteShardClick };
