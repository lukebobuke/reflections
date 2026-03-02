/** @format */

// ----------------------------------------------------------------------------------------------------
// #region Sculpture Feed for Home Page
// ----------------------------------------------------------------------------------------------------
function renderSculptureFeed(sculptures) {
	const feedContainer = document.getElementById("sculpture-feed");
	if (!feedContainer) return;

	// Clear existing content
	feedContainer.innerHTML = "";

	// Create and append each sculpture card
	sculptures.forEach((sculpture, index) => {
		// Create card container
		const card = document.createElement("div");
		card.className = "liquid-glass feed-card";
		card.style.cssText = `
			display: flex;
			overflow: hidden;
		`;

		// Left column: thumbnail
		const leftColumn = document.createElement("div");
		leftColumn.style.cssText = `
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(var(--glass-rgb-dark));
			overflow: hidden;
		`;

		if (sculpture.thumbnail_url) {
			const img = document.createElement("img");
			img.src = sculpture.thumbnail_url;
			img.alt = `Sculpture by ${sculpture.username}`;
			img.style.cssText = `
				width: 100%;
				height: 100%;
				object-fit: cover;
			`;
			leftColumn.appendChild(img);
		} else {
			leftColumn.innerHTML = '<p style="color: rgba(var(--text-color), 0.5);">No Image</p>';
		}

		// Right column: metadata and analysis
		const rightColumn = document.createElement("div");
		rightColumn.style.cssText = `
			flex: 1;
			padding: var(--padding);
			display: flex;
			flex-direction: column;
			overflow: hidden;
		`;

		// Username and date
		const metadata = document.createElement("p");
		metadata.style.cssText = `
			font-size: 0.875rem;
			color: rgba(var(--text-color), 0.7);
			margin-bottom: var(--padding-small);
			flex-shrink: 0;
		`;
		const formattedDate = new Date(sculpture.created_at).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		metadata.textContent = `by ${sculpture.username} • ${formattedDate}`;
		rightColumn.appendChild(metadata);

		// Personality analysis (scrollable)
		if (sculpture.personality_analysis) {
			const analysisContainer = document.createElement("div");
			analysisContainer.style.cssText = `
				flex: 1;
				overflow-y: auto;
				margin-bottom: var(--padding-small);
				line-height: 1.6;
			`;
			analysisContainer.textContent = sculpture.personality_analysis;
			rightColumn.appendChild(analysisContainer);
		}

		// View 3D Model link
		if (sculpture.model_url) {
			const link = document.createElement("a");
			link.href = sculpture.model_url;
			link.target = "_blank";
			link.className = "liquid-glass button-link";
			link.style.cssText = `
				display: inline-block;
				margin-top: auto;
				flex-shrink: 0;
			`;
			const span = document.createElement("span");
			span.className = "carved-glass";
			span.textContent = "View 3D Model";
			link.appendChild(span);
			rightColumn.appendChild(link);
		}

		// Assemble card
		card.appendChild(leftColumn);
		card.appendChild(rightColumn);
		feedContainer.appendChild(card);
	});
}

async function fetchSculptureFeed() {
	const feedContainer = document.getElementById("sculpture-feed");

	// Only run if feed container exists (on home page)
	if (!feedContainer) return;

	try {
		console.log("Fetching sculpture feed...");
		const response = await fetch("/api/sculptures/feed");

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const sculptures = await response.json();

		if (!sculptures || sculptures.length === 0) {
			feedContainer.innerHTML =
				'<p style="text-align: center; color: rgba(var(--text-color), 0.7);">No sculptures yet. Be the first to create one!</p>';
			return;
		}

		// Render the feed using the new function
		renderSculptureFeed(sculptures);
		console.log(`Loaded ${sculptures.length} sculptures to feed`);
	} catch (error) {
		console.error("Error fetching sculpture feed:", error);
		feedContainer.innerHTML =
			'<p style="text-align: center; color: rgba(var(--text-color), 0.7);">Failed to load sculptures. Please try again later.</p>';
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// Load feed on page load
document.addEventListener("DOMContentLoaded", () => {
	console.log("Index page loaded - fetching sculpture feed");
	fetchSculptureFeed();
});
