const STORAGE_KEYS = {
  REVIEWS: "homestay_reviews_v1",
  VOTED_IDS: "homestay_helpful_votes_v1"
};

// Initial 6 seed reviews
const INITIAL_REVIEWS = [
  {
    id: "rev-101",
    name: "Ananya Kulkarni",
    date: "2026-11-12",
    tripType: "Couple",
    verified: true,
    rating: 5,
    title: "Quiet morning coffee in the courtyard",
    comment:
      "The lime-plastered walls keep the rooms naturally cool even in the afternoon. Our host shared homemade bebinca on arrival and mapped out a quiet morning walk through the Latin Quarter.",
    helpful: 14
  },
  {
    id: "rev-102",
    name: "Vikramaditya Nair",
    date: "2026-10-28",
    tripType: "Workation",
    verified: true,
    rating: 5,
    title: "Reliable fiber Wi-Fi and peaceful workspace",
    comment:
      "Stayed for six nights while working remotely. High-speed internet held up through back-to-back video calls, and the veranda desk overlooks mango trees. Cafes and bakeries are a two-minute stroll away.",
    helpful: 19
  },
  {
    id: "rev-103",
    name: "Meera & Siddharth",
    date: "2026-10-14",
    tripType: "Family",
    verified: true,
    rating: 4,
    title: "Charming heritage details, slight street noise",
    comment:
      "Loved the antique four-poster beds and spotless bathroom. Since the house sits on a historic lane, you do hear morning delivery scooters around 7:30 AM, so light sleepers may want earplugs.",
    helpful: 9
  },
  {
    id: "rev-104",
    name: "Daniel Fernandes",
    date: "2026-09-22",
    tripType: "Solo",
    verified: true,
    rating: 5,
    title: "Felt like staying with family",
    comment:
      "Warm hospitality without ever feeling intrusive. Breakfast poee with local ross omelette was the highlight of my trip. Will definitely return on my next visit.",
    helpful: 7
  },
  {
    id: "rev-105",
    name: "Priyanka Sharma",
    date: "2026-09-05",
    tripType: "Friends",
    verified: true,
    rating: 3,
    title: "Beautiful property, parking is tricky",
    comment:
      "The interiors look straight out of an architecture magazine and the host was very responsive. However, narrow lanes mean you have to park your rental car two blocks away on the main road.",
    helpful: 11
  },
  {
    id: "rev-106",
    name: "Kabir Malhotra",
    date: "2026-08-19",
    tripType: "Couple",
    verified: false,
    rating: 4,
    title: "Great location for exploring old Panjim",
    comment:
      "Walking distance to great taverns and galleries. Water pressure in the heritage shower took a minute to warm up, but everything else was immaculate.",
    helpful: 4
  }
];

// Application State
let reviews = loadReviews();
let votedIds = loadVotedIds();
let currentSort = "recent";
let starFilter = null; // null or 1..5
let selectedRating = 0;

// DOM References
const avgScoreEl = document.getElementById("avg-score");
const avgStarsEl = document.getElementById("avg-stars");
const totalReviewsEl = document.getElementById("total-reviews");
const distributionEl = document.getElementById("distribution-container");
const reviewsListEl = document.getElementById("reviews-list");
const sortSelectEl = document.getElementById("sort-select");
const filterStatusEl = document.getElementById("filter-status");
const clearFilterBtn = document.getElementById("clear-filter-btn");

// Form & Star Picker Elements
const toggleFormBtn = document.getElementById("toggle-form-btn");
const cancelFormBtn = document.getElementById("cancel-form-btn");
const reviewForm = document.getElementById("review-form");
const starButtons = Array.from(document.querySelectorAll(".star-btn"));
const ratingHintEl = document.getElementById("rating-hint");
const formErrorEl = document.getElementById("form-error");

const RATING_LABELS = {
  1: "1 — Poor",
  2: "2 — Fair",
  3: "3 — Good",
  4: "4 — Very Good",
  5: "5 — Exceptional"
};

// Storage Helpers
function loadReviews() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Could not read reviews from localStorage:", err);
  }
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  return [...INITIAL_REVIEWS];
}

function saveReviews() {
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
}

function loadVotedIds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.VOTED_IDS);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVotedIds() {
  localStorage.setItem(STORAGE_KEYS.VOTED_IDS, JSON.stringify([...votedIds]));
}

// Formatting Helpers
function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(isoDate) {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function renderStarsString(rating) {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

// Summary & Distribution Calculation
function renderSummary() {
  const total = reviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((rev) => {
    sum += rev.rating;
    if (counts[rev.rating] !== undefined) {
      counts[rev.rating] += 1;
    }
  });

  const average = total > 0 ? sum / total : 0;
  avgScoreEl.textContent = average.toFixed(1);
  avgStarsEl.textContent = renderStarsString(average);
  avgStarsEl.setAttribute("aria-label", `${average.toFixed(1)} out of 5 stars`);
  totalReviewsEl.textContent = `Based on ${total} ${total === 1 ? "review" : "reviews"}`;

  // Build 5-to-1 distribution bars
  distributionEl.innerHTML = "";
  [5, 4, 3, 2, 1].forEach((star) => {
    const count = counts[star];
    const percentage = total > 0 ? (count / total) * 100 : 0;

    const row = document.createElement("button");
    row.type = "button";
    row.className = `bar-row${starFilter === star ? " selected" : ""}`;
    row.setAttribute("aria-pressed", starFilter === star ? "true" : "false");
    row.title = `Filter by ${star}-star reviews`;

    row.innerHTML = `
      <span class="bar-label">${star} star</span>
      <div class="bar-track" role="progressbar" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${total}">
        <div class="bar-fill" style="width: ${percentage}%"></div>
      </div>
      <span class="bar-count">${count}</span>
    `;

    row.addEventListener("click", () => {
      starFilter = starFilter === star ? null : star;
      renderAll();
    });

    distributionEl.appendChild(row);
  });
}

// Render Review Cards
function renderReviews() {
  let visible = [...reviews];

  // Apply star filter if active
  if (starFilter !== null) {
    visible = visible.filter((r) => r.rating === starFilter);
    filterStatusEl.textContent = `Showing ${visible.length} ${starFilter}-star ${
      visible.length === 1 ? "review" : "reviews"
    }`;
    clearFilterBtn.classList.remove("hidden");
  } else {
    filterStatusEl.textContent = `Showing all ${visible.length} reviews`;
    clearFilterBtn.classList.add("hidden");
  }

  // Apply sorting
  visible.sort((a, b) => {
    if (currentSort === "helpful") {
      if (b.helpful !== a.helpful) return b.helpful - a.helpful;
      return new Date(b.date) - new Date(a.date);
    }
    // Default: most recent
    return new Date(b.date) - new Date(a.date);
  });

  reviewsListEl.innerHTML = "";

  if (visible.length === 0) {
    reviewsListEl.innerHTML = `<p class="review-meta">No reviews match this filter yet.</p>`;
    return;
  }

  visible.forEach((rev) => {
    const hasVoted = votedIds.has(rev.id);
    const card = document.createElement("article");
    card.className = "review-card";

    card.innerHTML = `
      <div class="card-header">
        <div class="reviewer-info">
          <div class="avatar" aria-hidden="true">${getInitials(rev.name)}</div>
          <div>
            <div class="reviewer-name-row">
              <span class="reviewer-name">${escapeHTML(rev.name)}</span>
              ${
                rev.verified
                  ? `<span class="verified-badge">✓ Verified Stay</span>`
                  : ""
              }
            </div>
            <div class="review-meta">${escapeHTML(rev.tripType)} · ${formatDate(rev.date)}</div>
          </div>
        </div>
        <div class="card-stars" aria-label="${rev.rating} out of 5 stars">
          ${renderStarsString(rev.rating)}
        </div>
      </div>
      <h4 class="review-title">${escapeHTML(rev.title)}</h4>
      <p class="review-body">${escapeHTML(rev.comment)}</p>
      <div class="card-footer">
        <button
          type="button"
          class="helpful-btn${hasVoted ? " voted" : ""}"
          data-id="${rev.id}"
          ${hasVoted ? "disabled" : ""}
          aria-label="Mark review by ${escapeHTML(rev.name)} as helpful"
        >
          👍 Helpful (${rev.helpful})
        </button>
      </div>
    `;

    const helpfulBtn = card.querySelector(".helpful-btn");
    helpfulBtn.addEventListener("click", () => handleHelpfulVote(rev.id));

    reviewsListEl.appendChild(card);
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function handleHelpfulVote(reviewId) {
  if (votedIds.has(reviewId)) return;

  const target = reviews.find((r) => r.id === reviewId);
  if (!target) return;

  target.helpful += 1;
  votedIds.add(reviewId);

  saveReviews();
  saveVotedIds();
  renderReviews();
}

// Interactive Star Picker (Mouse + Keyboard)
function updateStarPickerUI(previewValue = 0) {
  const activeValue = previewValue || selectedRating;
  starButtons.forEach((btn) => {
    const val = Number(btn.dataset.value);
    btn.classList.toggle("active", val <= selectedRating);
    btn.classList.toggle("hover", previewValue > 0 && val <= previewValue);
    btn.setAttribute("aria-checked", val === selectedRating ? "true" : "false");
    btn.tabIndex = val === (selectedRating || 1) ? 0 : -1;
  });

  ratingHintEl.textContent = activeValue
    ? RATING_LABELS[activeValue]
    : "Select a rating (1 to 5 stars)";
}

function setRating(value) {
  selectedRating = Math.min(5, Math.max(1, value));
  updateStarPickerUI();
}

starButtons.forEach((btn) => {
  const val = Number(btn.dataset.value);

  // Mouse interactions
  btn.addEventListener("mouseenter", () => updateStarPickerUI(val));
  btn.addEventListener("mouseleave", () => updateStarPickerUI(0));
  btn.addEventListener("click", () => setRating(val));

  // Keyboard interactions (Arrows, Home, End, Space/Enter)
  btn.addEventListener("keydown", (e) => {
    let nextVal = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      nextVal = (selectedRating || val) < 5 ? (selectedRating || val) + 1 : 5;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      nextVal = (selectedRating || val) > 1 ? (selectedRating || val) - 1 : 1;
    } else if (e.key === "Home") {
      nextVal = 1;
    } else if (e.key === "End") {
      nextVal = 5;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setRating(val);
      return;
    }

    if (nextVal !== null) {
      e.preventDefault();
      setRating(nextVal);
      starButtons[nextVal - 1].focus();
    }
  });
});

// Form Toggle & Submission
toggleFormBtn.addEventListener("click", () => {
  reviewForm.classList.toggle("hidden");
  if (!reviewForm.classList.contains("hidden")) {
    document.getElementById("reviewer-name").focus();
  }
});

cancelFormBtn.addEventListener("click", () => {
  reviewForm.reset();
  selectedRating = 0;
  updateStarPickerUI();
  formErrorEl.textContent = "";
  reviewForm.classList.add("hidden");
});

reviewForm.addEventListener("submit", (e) => {
  e.preventDefault();
  formErrorEl.textContent = "";

  const name = document.getElementById("reviewer-name").value.trim();
  const tripType = document.getElementById("trip-type").value;
  const title = document.getElementById("review-title").value.trim();
  const comment = document.getElementById("review-comment").value.trim();

  if (!name || !title || !comment) {
    formErrorEl.textContent = "Please fill in your name, headline, and review.";
    return;
  }

  if (selectedRating < 1 || selectedRating > 5) {
    formErrorEl.textContent = "Please select a star rating between 1 and 5.";
    return;
  }

  const todayISO = new Date().toISOString().split("T")[0];

  const newReview = {
    id: `rev-${Date.now()}`,
    name,
    date: todayISO,
    tripType,
    verified: true,
    rating: selectedRating,
    title,
    comment,
    helpful: 0
  };

  reviews.unshift(newReview);
  saveReviews();

  // Reset filter so user immediately sees their newly added review
  starFilter = null;
  currentSort = "recent";
  sortSelectEl.value = "recent";

  reviewForm.reset();
  selectedRating = 0;
  updateStarPickerUI();
  reviewForm.classList.add("hidden");

  renderAll();
});

// Sort & Filter Listeners
sortSelectEl.addEventListener("change", (e) => {
  currentSort = e.target.value;
  renderReviews();
});

clearFilterBtn.addEventListener("click", () => {
  starFilter = null;
  renderAll();
});

function renderAll() {
  renderSummary();
  renderReviews();
}

// Initialize
updateStarPickerUI();
renderAll();