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
// Feed rendering is handled by index.js (home page only).
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Haiku Footer
// ----------------------------------------------------------------------------------------------------
const HAIKUS = [
	["Seen", "through a telescope:", "ten cents worth of fog."],
	["What a strange thing!", "to be alive", "beneath cherry blossoms."],
	["Blossoms at night,", "and the faces of people", "moved by music."],
	["morning glory gazing—", "so many false starts", "on my journey"],
	["a kimono for a sail", "rushing along...", "little boat"],
	["trying to pinch", "a bead of dew...", "a child"],
	["A confusing mix", "of rain and snow", "spring equinox"],
];

function initHaikuFooter() {
	const display = document.getElementById("haiku-display");
	const line1 = document.getElementById("haiku-line-1");
	const line2 = document.getElementById("haiku-line-2");
	const line3 = document.getElementById("haiku-line-3");
	if (!display || !line1 || !line2 || !line3) return;

	let index = Math.floor(Math.random() * HAIKUS.length);

	function setHaiku([l1, l2, l3]) {
		line1.textContent = l1;
		line2.textContent = l2;
		line3.textContent = l3;
	}

	setHaiku(HAIKUS[index]);

	setInterval(() => {
		display.classList.add("fading");
		setTimeout(() => {
			index = (index + 1) % HAIKUS.length;
			setHaiku(HAIKUS[index]);
			display.classList.remove("fading");
		}, 800);
	}, 7000);
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
				const shardsSection = document.getElementById("shards-section");
				if (shardsSection) shardsSection.classList.add("hidden");
				guideManager.show("patternCreation", null, {
					continue: () => {
						guideManager.hide();
						if (shardsSection) shardsSection.classList.remove("hidden");
					},
				});
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
// #region Footer Scroll
// ----------------------------------------------------------------------------------------------------
function initFooterScroll() {
	const footer = document.querySelector("footer");
	if (!footer) return;

	function updateFooter() {
		const doc = document.documentElement;
		const hasVerticalScroll = doc.scrollHeight > window.innerHeight + 5;
		const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 20;
		footer.classList.toggle("visible", !hasVerticalScroll || atBottom);
	}

	window.addEventListener("scroll", updateFooter);
	updateFooter();
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

	maybeShowWelcomeGuide();
	initHaikuFooter();

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
	initFooterScroll();
});
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------
