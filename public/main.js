/** @format */

import {
	handleCreateShardClick,
	handleShardHover,
	handleDeleteShardClick,
	handleShowShardCrudClick,
	handleHideShardCrudClick,
	handleShardClick,
	handleEditShardClick,
	handleGlowClick,
	handleTintClick,
	handleSparkRefreshClick,
} from "./shards.js";

// Runs when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
	console.log("Frontend JS loaded.");
	handleCreateShardClick();
	handleDeleteShardClick();
	handleShardHover();
	handleShowShardCrudClick();
	handleHideShardCrudClick();
	handleShardClick();
	handleEditShardClick();
	handleGlowClick();
	handleTintClick();
	handleSparkRefreshClick();
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
			if (window.scrollY > 0) {
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
		const atBottom = Math.abs(window.innerHeight + window.pageYOffset - doc.scrollHeight - 0.1) < 2;
		if (atBottom && !navPopup.classList.contains("active")) {
			footer.classList.remove("shifted-down");
		} else {
			footer.classList.add("shifted-down");
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
