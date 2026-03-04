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
	handleIncreaseRotationClick,
	handleDecreaseRotationClick,
	currentPointsState,
	fetchShards,
	appState,
} from "./shards.js";

import { handleSubmitButtonClick } from "./sculptures.js";
import { guideManager } from "./guide.js";

// ----------------------------------------------------------------------------------------------------
// #region Sculpture Feed
// ----------------------------------------------------------------------------------------------------
function renderSculptureFeed(sculptures) {
	const feedContainer = document.getElementById("sculpture-feed");
	if (!feedContainer) return;
	feedContainer.innerHTML = "";

	sculptures.forEach((sculpture, index) => {
		const card = document.createElement("div");
		card.className = "liquid-glass feed-card";
		card.style.cssText = `display: flex; overflow: hidden;`;
		card.style.top = `calc(var(--header-height) + var(--padding) + ${index * 2}rem)`;
		card.style.zIndex = index + 1;

		const leftColumn = document.createElement("div");
		leftColumn.style.cssText = `flex: 1; display: flex; align-items: center; justify-content: center; background: rgba(var(--glass-rgb-dark)); overflow: hidden;`;

		if (sculpture.thumbnail_url) {
			const img = document.createElement("img");
			img.src = sculpture.thumbnail_url;
			img.alt = `Sculpture by ${sculpture.username}`;
			img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
			leftColumn.appendChild(img);
		} else {
			leftColumn.innerHTML = '<p style="color: rgba(var(--text-color), 0.5);">No Image</p>';
		}

		const rightColumn = document.createElement("div");
		rightColumn.style.cssText = `flex: 1; padding: var(--padding); display: flex; flex-direction: column; overflow: hidden;`;

		const metadata = document.createElement("p");
		metadata.style.cssText = `font-size: 0.875rem; color: rgba(var(--text-color), 0.7); margin-bottom: var(--padding-small); flex-shrink: 0;`;
		const formattedDate = new Date(sculpture.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
		metadata.textContent = `by ${sculpture.username} • ${formattedDate}`;
		rightColumn.appendChild(metadata);

		if (sculpture.personality_analysis) {
			const analysisContainer = document.createElement("div");
			analysisContainer.style.cssText = `flex: 1; overflow-y: auto; margin-bottom: var(--padding-small); line-height: 1.6;`;
			analysisContainer.textContent = sculpture.personality_analysis;
			rightColumn.appendChild(analysisContainer);
		}

		if (sculpture.model_url) {
			const link = document.createElement("a");
			link.href = sculpture.model_url;
			link.target = "_blank";
			link.className = "liquid-glass button-link";
			link.style.cssText = `display: inline-block; margin-top: auto; flex-shrink: 0;`;
			const span = document.createElement("span");
			span.className = "carved-glass";
			span.textContent = "View 3D Model";
			link.appendChild(span);
			rightColumn.appendChild(link);
		}

		card.appendChild(leftColumn);
		card.appendChild(rightColumn);
		feedContainer.appendChild(card);
	});
}

async function fetchSculptureFeed() {
	const feedContainer = document.getElementById("sculpture-feed");
	if (!feedContainer) return;
	try {
		const response = await fetch("/api/sculptures/feed");
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const sculptures = await response.json();
		if (!sculptures || sculptures.length === 0) {
			feedContainer.innerHTML =
				'<p style="text-align: center; color: rgba(var(--text-color), 0.7);">No sculptures yet. Be the first to create one!</p>';
			return;
		}
		renderSculptureFeed(sculptures);
	} catch (error) {
		console.error("Error fetching sculpture feed:", error);
		feedContainer.innerHTML = '<p style="text-align: center; color: rgba(var(--text-color), 0.7);">Failed to load sculptures.</p>';
	}
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Welcome Guide (Stage 1 — home page, once per browser)
// ----------------------------------------------------------------------------------------------------
function maybeShowWelcomeGuide() {
	const state = window.__HOME_PAGE_STATE__;
	if (!state || state.isLoggedIn) return;
	if (!state.showWelcome) return;

	const alreadySeen = localStorage.getItem("reflections_welcome_seen");
	if (alreadySeen) return;

	// Short delay so the feed has a chance to render first
	setTimeout(() => {
		guideManager.show("welcome", null, {
			continue: () => {
				localStorage.setItem("reflections_welcome_seen", "1");
				guideManager.hide();
			},
		});
	}, 800);
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Stage 2 Guide — Pattern Creation and Shard Creation
// ----------------------------------------------------------------------------------------------------
function initShardsPageGuide() {
	const state = window.__SHARDS_PAGE_STATE__;
	if (!state) return;

	const { stage, hasSculpture, patternLocked, isNewSignup, isFirstSculpture } = state;

	console.log(
		`Phase: ${
			hasSculpture ? "Sculpture view"
			: patternLocked ? "Shard creation"
			: "Pattern creation"
		}`,
	);

	// Stage 3 first time — sculpture just completed
	if (hasSculpture && isFirstSculpture) {
		setTimeout(() => {
			guideManager.show("sculptureComplete");
		}, 600);
		return;
	}

	// Stage 2 — no sculpture yet
	if (!hasSculpture) {
		if (!patternLocked) {
			// Stage 2a: pattern creation
			// Show on new signup, or if pattern not yet locked (always show until locked)
			setTimeout(() => {
				guideManager.show("patternCreation");
			}, 400);
		} else {
			// Stage 2b: shard creation — show if we just locked the pattern
			// This is triggered by the done-with-pattern flow, not on page load
			// (handled in handleDoneWithPattern below)
		}
	}
}

// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Done with Pattern Handler
// ----------------------------------------------------------------------------------------------------
async function handleDoneWithPattern() {
	const btn = document.getElementById("done-with-pattern-btn");
	if (!btn) return;

	btn.addEventListener("click", () => {
		// Show confirmation popup before locking
		guideManager.show("confirmPattern", null, {
			back: () => guideManager.hide(),
			ok: async () => {
				try {
					console.log("Pattern: Saving and locking pattern");

					const { points, rotationCount } = currentPointsState.get();

					const checkResponse = await fetch("/api/points");
					let saveResponse;
					if (checkResponse.ok) {
						saveResponse = await fetch("/api/points", {
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ rotationCount, points }),
						});
					} else {
						saveResponse = await fetch("/api/points", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ rotationCount, points }),
						});
					}

					if (!saveResponse.ok) throw new Error("Failed to save pattern");

					const lockResponse = await fetch("/shards/api/lock-pattern", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
					});
					if (!lockResponse.ok) throw new Error("Failed to lock pattern");

					// Hide shards section — popup is the only thing on screen
					const shardsSection = document.getElementById("shards-section");
					if (shardsSection) shardsSection.classList.add("hidden");

					// Update controls for shard-creation stage
					const patternControls = document.getElementById("pattern-controls");
					const showAndSubmit = document.getElementById("show-and-submit");
					if (patternControls) patternControls.classList.add("hidden");
					if (showAndSubmit) showAndSubmit.classList.remove("hidden");

					console.log("Phase: Pattern locked → transitioning to shard creation");
					appState.set.viewShards();

					// Show second popup explaining shard creation; Continue restores the section
					guideManager.show("patternLocked", null, {
						continue: () => {
							guideManager.hide();
							if (shardsSection) shardsSection.classList.remove("hidden");
						},
					});
				} catch (err) {
					console.error("Error in done-with-pattern:", err);
					guideManager.addStatus("Something went wrong saving your pattern. Please try again.");
				}
			},
		});
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Button Pressed Effect
// ----------------------------------------------------------------------------------------------------
function initButtonPressedEffect() {
	const pressables = document.querySelectorAll("button, .button-link");
	pressables.forEach((pressable) => {
		pressable.addEventListener("mousedown", () => pressable.classList.add("button-pressed"));
		pressable.addEventListener("mouseup", () => pressable.classList.remove("button-pressed"));
		pressable.addEventListener("mouseleave", () => pressable.classList.remove("button-pressed"));
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Header Scroll
// ----------------------------------------------------------------------------------------------------
function initHeaderScroll() {
	const header = document.querySelector("header");
	if (!header) return;
	window.addEventListener("scroll", () => {
		const doc = document.documentElement;
		const hasVerticalScroll = doc.scrollHeight > window.innerHeight;
		if (hasVerticalScroll && window.scrollY > 5) {
			header.classList.add("shifted-up");
		} else {
			header.classList.remove("shifted-up");
		}
	});
}
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region DOMContentLoaded
// ----------------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
	console.log("App: Initializing Reflections");

	// Initialize guide event listeners
	guideManager.init();

	fetchSculptureFeed();
	maybeShowWelcomeGuide();

	// Shards page init
	if (document.getElementById("shards-section")) {
		const shardCrudContainer = document.querySelector("#shard-crud-container");

		handleAddVoronoiPoint(); // Creates #voronoi-group synchronously via setupVoronoiSVG
		const shardContainer = document.querySelector("#voronoi-group");
		handleCreateShardClick();
		handleDeleteShardClick();
		handleShardHover(shardContainer, shardCrudContainer);
		handleHideShardCrudClick();
		handleEditShardClick();
		handleGlowClick();
		handleTintClick();
		handleSparkRefreshClick();
		handleShardClick();
		handleIncreaseRotationClick();
		handleDecreaseRotationClick();
		handleDoneWithPattern();
		handleSubmitButtonClick();
		initShardsPageGuide();
	}

	initButtonPressedEffect();
	initHeaderScroll();
});
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------
