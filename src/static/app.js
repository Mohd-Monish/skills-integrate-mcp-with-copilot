document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
    let allActivities = {};

    async function fetchActivities() {
      try {
        const response = await fetch("/activities");
        allActivities = await response.json();
        renderActivities();
      } catch (error) {
        activitiesList.innerHTML =
          "<p>Failed to load activities. Please try again later.</p>";
        console.error("Error fetching activities:", error);
      }
    }

    function getCategory(name) {
      if (name.includes("Club")) return "Club";
      if (name.includes("Team")) return "Team";
      if (name.includes("Class")) return "Class";
      return "Other";
    }

    function getTime(details) {
      // Extract first time from schedule string
      const match = details.schedule.match(/(\d{1,2}:\d{2} [AP]M)/);
      return match ? match[0] : "";
    }

    function renderActivities() {
      // Get filter values
      const category = document.getElementById("category-filter").value;
      const sortBy = document.getElementById("sort-filter").value;
      const search = document.getElementById("search-filter").value.toLowerCase();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";
      const optionDefault = document.createElement("option");
      optionDefault.value = "";
      optionDefault.textContent = "-- Select an activity --";
      activitySelect.appendChild(optionDefault);

      let filtered = Object.entries(allActivities)
        .filter(([name, details]) => {
          // Category filter
          if (category && getCategory(name) !== category) return false;
          // Search filter
          if (
            search &&
            !name.toLowerCase().includes(search) &&
            !details.description.toLowerCase().includes(search)
          )
            return false;
          return true;
        });

      // Sort
      if (sortBy === "name") {
        filtered.sort((a, b) => a[0].localeCompare(b[0]));
      } else if (sortBy === "time") {
        filtered.sort((a, b) => getTime(a[1]).localeCompare(getTime(b[1])));
      }

      filtered.forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-container">
              ${participantsHTML}
            </div>
          `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    }

    // Add filter listeners
    document.getElementById("category-filter").addEventListener("change", renderActivities);
    document.getElementById("sort-filter").addEventListener("change", renderActivities);
    document.getElementById("search-filter").addEventListener("input", renderActivities);

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
