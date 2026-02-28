/** @format */

import {
	handleCreateShardClick,
	handleShardHover,
	handleDeleteShardClick,
	handleHideShardCrudClick,
	handleShardClick,
	handleEditShardClick,
	handleGlowClick,
	handleTintClick,
	handleSparkRefreshClick,
	handleAddVoronoiPoint,
	enterPointsEditingState,
	exitPointsEditingState,
	handleIncreaseRotationClick,
	handleDecreaseRotationClick,
} from "./shards.js";

import { handleSubmitButtonClick } from "./sculptures.js";

// ----------------------------------------------------------------------------------------------------
// #region Sculpture Feed
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

		// Set sticky positioning and z-index for stacking effect
		card.style.top = `calc(var(--header-height) + var(--padding) + ${index * 2}rem)`;
		card.style.zIndex = index + 1;

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

// Runs when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
	console.log("Frontend JS loaded.");

	// Fetch and display sculpture feed (only on home page)
	fetchSculptureFeed();

	const editButton = document.querySelector("#show-shard-crud");
	const hideButton = document.querySelector("#hide-shard-crud");
	handleAddVoronoiPoint();
	const shardContainer = document.querySelector("#voronoi-group");
	const shardCrudContainer = document.querySelector("#shard-crud-container");

	handleCreateShardClick();
	handleDeleteShardClick();
	handleShardHover(shardContainer, shardCrudContainer);
	handleHideShardCrudClick();
	handleEditShardClick();
	handleGlowClick();
	handleTintClick();
	handleSparkRefreshClick();
	enterPointsEditingState(editButton);
	exitPointsEditingState(hideButton);
	handleShardClick();
	handleIncreaseRotationClick();
	handleDecreaseRotationClick();

	handleSubmitButtonClick();
	//----------------------------------------------------------------------------------------------------
	// #region Menu/Nav Setup
	// Get references to menu button, nav popup, and main content
	//----------------------------------------------------------------------------------------------------

	const menuButton = document.querySelector(".menu-button");
	const navPopup = document.getElementById("navPopup");
	const main = document.querySelector("main");
	const header = document.querySelector("header");
	// #endregion

	//----------------------------------------------------------------------------------------------------
	// #region Nav Popup Toggle
	// Toggle navigation popup on menu button click
	//----------------------------------------------------------------------------------------------------

	// If navigation elements exist, set up menu and navigation event listeners
	if (menuButton && navPopup && main) {
		console.log("Menu button, navigation popup, and main element found.");

		menuButton.addEventListener("click", () => {
			console.log("Menu button clicked.");
			navPopup.classList.toggle("active");
			updateFooterScrollState();
			if (navPopup.classList.contains("active")) {
				console.log("Navigation popup activated.");
				main.classList.add("slide-right");
				main.classList.remove("slide-left");
			} else {
				console.log("Navigation popup deactivated.");
				main.classList.remove("slide-right");
			}
		});

		// #region Nav Popup Outside Click
		// Close navigation popup when clicking outside of it
		document.addEventListener("click", (e) => {
			if (!navPopup.contains(e.target) && !menuButton.contains(e.target) && navPopup.classList.contains("active")) {
				console.log("Clicked outside navigation popup. Closing popup.");
				navPopup.classList.remove("active");
				main.classList.remove("slide-right");
				setTimeout(() => {
					updateFooterScrollState();
				}, 2000);
			}
		});
		// #endregion

		// #region Nav Link Animation
		// Animate main content and navigate on nav link click
		navPopup.querySelectorAll("a").forEach((link) => {
			link.addEventListener("click", function (e) {
				const href = this.getAttribute("href");
				// Prevent navigation to /dashboard or /shards if user is not logged in
				// const userIsLoggedIn = !!document.body.getAttribute("data-user-logged-in");
				// if (
				// 	(href === "/dashboard" || href === "/shards") &&
				// 	!userIsLoggedIn
				// ) {
				// 	e.preventDefault();
				// 	alert("You must be logged in to access this page.");
				// 	return;
				// }
				e.preventDefault();
				console.log(`Navigation link clicked: ${href}`);
				navPopup.classList.remove("active");
				main.classList.remove("slide-right");
				main.classList.add("slide-left");
				setTimeout(() => {
					if (header) {
						header.classList.remove("shifted-up");
					}
					setTimeout(() => {
						console.log(`Navigating to: ${href}`);
						window.location.href = href;
					}, 500);
				}, 2000);
			});
		});
		// #endregion
	}
	// #endregion

	//----------------------------------------------------------------------------------------------------
	// #region Header Scroll
	// Shift header up on scroll, return to normal at top
	//----------------------------------------------------------------------------------------------------
	window.addEventListener("scroll", () => {
		if (header) {
			// Only shift header if there's meaningful content to scroll
			const doc = document.documentElement;
			const hasVerticalScroll = doc.scrollHeight > window.innerHeight;

			if (hasVerticalScroll && window.scrollY > 5) {
				header.classList.add("shifted-up");
			} else {
				header.classList.remove("shifted-up");
			}
		}
	});
	// #endregion

	//----------------------------------------------------------------------------------------------------
	// #region Footer Scroll State
	// Updates the footer's scroll state based on nav popup and scroll position
	//----------------------------------------------------------------------------------------------------
	function updateFooterScrollState() {
		const footer = document.querySelector("footer");
		if (!footer) {
			console.log("Footer element not found.");
			return;
		}
		if (navPopup.classList.contains("active")) {
			footer.classList.add("shifted-down");
			return;
		}

		const doc = document.documentElement;
		const hasVerticalScroll = doc.scrollHeight > window.innerHeight;

		// Only apply scroll-based footer logic if there's actually scrollable content
		if (hasVerticalScroll) {
			const atBottom = Math.abs(window.innerHeight + window.pageYOffset - doc.scrollHeight) < 5;
			if (atBottom) {
				footer.classList.remove("shifted-down");
			} else {
				footer.classList.add("shifted-down");
			}
		} else {
			// No scroll needed, keep footer visible
			footer.classList.remove("shifted-down");
		}
	}
	// #endregion

	//----------------------------------------------------------------------------------------------------
	// #region Footer Event Listeners
	// Listen for scroll and resize to update footer state
	//----------------------------------------------------------------------------------------------------
	window.addEventListener("scroll", updateFooterScrollState);
	window.addEventListener("resize", updateFooterScrollState);
	updateFooterScrollState();
	// #endregion

	//----------------------------------------------------------------------------------------------------
	// #region Button Pressed Effect
	// Add pressed effect to all buttons and .button-link links on mousedown/up
	//----------------------------------------------------------------------------------------------------
	const pressables = document.querySelectorAll("button, .button-link");

	// Add .button-pressed class on mousedown
	pressables.forEach((pressable) => {
		pressable.addEventListener("mousedown", () => {
			pressable.classList.add("button-pressed");
		});
	});
	// Remove .button-pressed class on mouseup and mouseleave
	pressables.forEach((pressable) => {
		pressable.addEventListener("mouseup", () => {
			pressable.classList.remove("button-pressed");
		});
		pressable.addEventListener("mouseleave", () => {
			pressable.classList.remove("button-pressed");
		});
	});
	// #endregion
});
