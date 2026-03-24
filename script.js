(function () {
  const namespace = (window.ManagerDashboard = window.ManagerDashboard || {});

  const state = {
    manager: null,
    navItems: [],
    stats: [],
    rating: null,
    progress: [],
    quickActions: [],
    teamMembers: [],
    leaveRequests: [],
    recentActivity: [],
    activeTasks: [],
    activeNavId: "overview",
    openModalId: null,
    isSidebarOpen: false,
    toastTimer: null,
    lastFocusedElement: null
  };

  const dom = {};
  const accentPalette = ["#c8efe3", "#fde5bd", "#d8e7fb", "#f7d6df", "#dcefd9", "#f1ddfb"];
  const focusableSelector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    bindEvents();
    syncTaskDeadlineMin();
    loadDashboard();
  }

  function cacheDom() {
    dom.body = document.body;
    dom.sidebar = document.querySelector("[data-sidebar]");
    dom.sidebarToggle = document.querySelector("[data-sidebar-toggle]");
    dom.sidebarOverlay = document.querySelector("[data-sidebar-overlay]");
    dom.navList = document.querySelector("[data-nav-list]");
    dom.statsGrid = document.querySelector("[data-stats-grid]");
    dom.ratingCard = document.querySelector("[data-rating-card]");
    dom.progressGrid = document.querySelector("[data-progress-grid]");
    dom.quickActions = document.querySelector("[data-quick-actions]");
    dom.teamMembers = document.querySelector("[data-team-members]");
    dom.activityFeed = document.querySelector("[data-activity-feed]");
    dom.activeTasks = document.querySelector("[data-active-tasks]");
    dom.leaveRequests = document.querySelector("[data-leave-requests]");
    dom.modalOverlay = document.querySelector("[data-modal-overlay]");
    dom.memberForm = document.getElementById("member-form");
    dom.taskForm = document.getElementById("task-form");
    dom.assigneeSelect = document.querySelector("[data-assignee-select]");
    dom.reportsTable = document.querySelector("[data-reports-table]");
    dom.toast = document.querySelector("[data-toast]");
    dom.profileMenu = document.querySelector("[data-profile-menu]");
    dom.profileToggle = document.querySelector("[data-profile-toggle]");
    dom.profileDropdown = document.querySelector("[data-profile-dropdown]");
    dom.managerName = document.querySelector("[data-manager-name]");
    dom.managerSubtitle = document.querySelector("[data-manager-subtitle]");
    dom.profileFullName = document.querySelector("[data-profile-full-name]");
    dom.profileRole = document.querySelector("[data-profile-role]");
    dom.profileInitials = document.querySelector("[data-profile-initials]");
  }

  function bindEvents() {
    if (dom.sidebarToggle) {
      dom.sidebarToggle.addEventListener("click", function () {
        if (state.isSidebarOpen) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (dom.sidebarOverlay) {
      dom.sidebarOverlay.addEventListener("click", closeSidebar);
    }

    if (dom.modalOverlay) {
      dom.modalOverlay.addEventListener("click", function () {
        if (state.openModalId) {
          closeModal(state.openModalId);
        }
      });
    }

    if (dom.memberForm) {
      dom.memberForm.addEventListener("submit", handleMemberSubmit);
      dom.memberForm.addEventListener("input", handleFieldInteraction);
      dom.memberForm.addEventListener("change", handleFieldInteraction);
    }

    if (dom.taskForm) {
      dom.taskForm.addEventListener("submit", handleTaskSubmit);
      dom.taskForm.addEventListener("input", handleFieldInteraction);
      dom.taskForm.addEventListener("change", handleFieldInteraction);
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
  }

  async function loadDashboard() {
    try {
      const dashboardData = await namespace.fetchDashboardData();
      hydrateState(dashboardData);
      renderApp();
    } catch (error) {
      console.error(error);
      showToast("Unable to load dashboard data.", "error");
    }
  }

  function hydrateState(dashboardData) {
    let defaultActiveId = "overview";
    let i = 0;

    state.manager = dashboardData.manager;
    state.navItems = dashboardData.navItems;
    state.stats = dashboardData.stats;
    state.rating = dashboardData.rating;
    state.progress = dashboardData.progress;
    state.quickActions = dashboardData.quickActions;
    state.teamMembers = dashboardData.teamMembers;
    state.leaveRequests = dashboardData.leaveRequests;
    state.recentActivity = dashboardData.recentActivity;
    state.activeTasks = dashboardData.activeTasks;

    for (i = 0; i < state.navItems.length; i += 1) {
      if (state.navItems[i].active) {
        defaultActiveId = state.navItems[i].id;
        break;
      }
    }

    state.activeNavId = defaultActiveId;
  }

  function renderApp() {
    renderHeader();
    renderSidebar();
    renderStats();
    renderRatingCard();
    renderProgress();
    renderQuickActions();
    renderTeamMembers();
    renderActivityFeed();
    renderActiveTasks();
    renderLeaveRequests();
    populateAssigneeOptions();
  }

  function renderHeader() {
    if (!state.manager) {
      return;
    }

    dom.managerName.textContent = "Manager Dashboard";
    dom.managerSubtitle.textContent = state.manager.subtitle;
    dom.profileFullName.textContent = state.manager.name;
    dom.profileRole.textContent = state.manager.role;
    dom.profileInitials.textContent = state.manager.initials;
  }

  function renderSidebar() {
    dom.navList.innerHTML = state.navItems
      .map(function (item) {
        const isActive = item.id === state.activeNavId;
        return (
          '<li>' +
          '<button class="nav-link' +
          (isActive ? " is-active" : "") +
          '" type="button" data-nav-id="' +
          escapeHtml(item.id) +
          '" data-target-id="' +
          escapeHtml(item.target) +
          '">' +
          renderIcon(item.icon) +
          "<span>" +
          escapeHtml(item.label) +
          "</span>" +
          "</button>" +
          "</li>"
        );
      })
      .join("");
  }

  function renderStats() {
    const presentCount = state.teamMembers.filter(function (member) {
      return member.status === "Present";
    }).length;
    const pendingRequests = state.leaveRequests.filter(function (request) {
      return request.status === "Pending";
    }).length;
    const todayDeadlines = state.activeTasks.filter(function (task) {
      return task.isDueToday;
    }).length;
    const latestActivity = state.recentActivity.length
      ? "Last update " + state.recentActivity[0].time
      : "No recent events";

    const computedStats = state.stats.map(function (stat) {
      if (stat.id === "team-members") {
        return {
          label: stat.label,
          icon: stat.icon,
          tone: stat.tone,
          value: String(state.teamMembers.length).padStart(2, "0"),
          helper: presentCount + " present today"
        };
      }

      if (stat.id === "active-tasks") {
        return {
          label: stat.label,
          icon: stat.icon,
          tone: stat.tone,
          value: String(state.activeTasks.length).padStart(2, "0"),
          helper: todayDeadlines + " due today"
        };
      }

      if (stat.id === "leave-requests") {
        return {
          label: stat.label,
          icon: stat.icon,
          tone: stat.tone,
          value: String(pendingRequests).padStart(2, "0"),
          helper: "2 approvals queued"
        };
      }

      return {
        label: stat.label,
        icon: stat.icon,
        tone: stat.tone,
        value: String(state.recentActivity.length).padStart(2, "0"),
        helper: latestActivity
      };
    });

    dom.statsGrid.innerHTML = computedStats
      .map(function (stat) {
        return (
          '<article class="stat-card stat-card--' +
          escapeHtml(stat.tone) +
          '">' +
          '<div class="stat-card__icon">' +
          renderIcon(stat.icon) +
          "</div>" +
          '<div class="stat-card__copy">' +
          "<p>" +
          escapeHtml(stat.label) +
          "</p>" +
          "<strong>" +
          escapeHtml(stat.value) +
          "</strong>" +
          "<span>" +
          escapeHtml(stat.helper) +
          "</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderRatingCard() {
    const filledStars = Math.round(state.rating.score);
    const starsMarkup = new Array(5)
      .fill("")
      .map(function (_, index) {
        return (
          '<svg class="' +
          (index < filledStars ? "" : "is-muted") +
          '" viewBox="0 0 24 24">' +
          '<use href="#icon-star"></use>' +
          "</svg>"
        );
      })
      .join("");

    dom.ratingCard.innerHTML =
      '<div class="rating-card">' +
      '<div class="rating-card__top">' +
      '<div class="rating-card__score">' +
      "<strong>" +
      escapeHtml(state.rating.score.toFixed(1)) +
      "/5</strong>" +
      "<span>Manager satisfaction score</span>" +
      "</div>" +
      '<span class="rating-card__badge">' +
      renderIcon("bell") +
      escapeHtml(String(state.rating.badgeCount)) +
      " new" +
      "</span>" +
      "</div>" +
      '<div class="rating-stars" aria-label="Team rating">' +
      starsMarkup +
      "</div>" +
      '<p class="rating-card__note">' +
      escapeHtml(state.rating.note) +
      "</p>" +
      "</div>";
  }

  function renderProgress() {
    dom.progressGrid.innerHTML = state.progress
      .map(function (item) {
        const percentage = Math.round((item.current / item.total) * 100);
        const ringOffset = (1 - percentage / 100) * 276.46;
        return (
          '<article class="progress-card">' +
          '<div class="progress-ring">' +
          '<svg viewBox="0 0 120 120">' +
          '<circle class="progress-ring__track" cx="60" cy="60" r="44"></circle>' +
          '<circle class="progress-ring__value progress-ring__value--' +
          escapeHtml(item.tone) +
          '" cx="60" cy="60" r="44" style="--ring-offset:' +
          ringOffset.toFixed(2) +
          ';"></circle>' +
          "</svg>" +
          '<div class="progress-ring__label">' +
          escapeHtml(String(percentage)) +
          "%</div>" +
          "</div>" +
          "<h3>" +
          escapeHtml(item.label) +
          "</h3>" +
          "<p>" +
          escapeHtml(item.current + " of " + item.total + " tracked") +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderQuickActions() {
    dom.quickActions.innerHTML = state.quickActions
      .map(function (action) {
        return (
          '<button class="quick-action" type="button" data-quick-action="' +
          escapeHtml(action.id) +
          '">' +
          '<span class="quick-action__icon">' +
          renderIcon(action.icon) +
          "</span>" +
          '<span class="quick-action__copy">' +
          "<strong>" +
          escapeHtml(action.label) +
          "</strong>" +
          "<span>" +
          escapeHtml(action.description) +
          "</span>" +
          "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderTeamMembers() {
    dom.teamMembers.innerHTML = renderCollection(
      state.teamMembers,
      function (member) {
        const badgeClass = member.status === "Present" ? "present" : "leave";
        return (
          '<article class="list-item">' +
          '<div class="avatar" style="--avatar-accent:' +
          escapeHtml(member.accent) +
          ';">' +
          escapeHtml(member.initials) +
          "</div>" +
          '<div class="list-item__body">' +
          '<div class="list-item__top">' +
          "<h3>" +
          escapeHtml(member.name) +
          "</h3>" +
          '<span class="status-pill status-pill--' +
          badgeClass +
          '">' +
          escapeHtml(member.status) +
          "</span>" +
          "</div>" +
          "<p>" +
          escapeHtml(member.role) +
          "</p>" +
          '<div class="list-item__footer">' +
          '<div class="list-item__meta">' +
          "<span>" +
          renderIcon("briefcase") +
          escapeHtml(member.id) +
          "</span>" +
          "<span>" +
          renderIcon("clock") +
          escapeHtml(member.shift) +
          "</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</article>"
        );
      },
      "No team members yet.",
      "Add a new member to populate the live roster."
    );
  }

  function renderActivityFeed() {
    dom.activityFeed.innerHTML =
      '<div class="timeline">' +
      renderCollection(
        state.recentActivity,
        function (activity) {
          return (
            '<article class="list-item">' +
            '<div class="list-item__body">' +
            '<div class="list-item__top">' +
            "<h3>" +
            escapeHtml(activity.title) +
            "</h3>" +
            '<span class="status-pill status-pill--success">' +
            escapeHtml(activity.type) +
            "</span>" +
            "</div>" +
            "<p>" +
            escapeHtml(activity.description) +
            "</p>" +
            '<div class="list-item__footer">' +
            '<div class="list-item__meta">' +
            "<span>" +
            renderIcon("clock") +
            escapeHtml(activity.time) +
            "</span>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</article>"
          );
        },
        "No activity yet.",
        "Recent task updates and announcements will appear here."
      ) +
      "</div>";
  }

  function renderActiveTasks() {
    dom.activeTasks.innerHTML = renderCollection(
      state.activeTasks,
      function (task) {
        return (
          '<article class="list-item' +
          (task.isDueToday ? " list-item--task-today" : "") +
          '">' +
          '<div class="list-item__body">' +
          '<div class="list-item__top">' +
          "<h3>" +
          escapeHtml(task.title) +
          "</h3>" +
          '<span class="status-pill ' +
          (task.isDueToday ? "status-pill--today" : "status-pill--warning") +
          '">' +
          escapeHtml(task.priority) +
          "</span>" +
          "</div>" +
          "<p>" +
          escapeHtml("Assignee: " + task.assignee) +
          "</p>" +
          '<div class="list-item__footer">' +
          '<div class="list-item__meta">' +
          "<span>" +
          renderIcon("clock") +
          escapeHtml(task.deadlineLabel) +
          "</span>" +
          "<span>" +
          renderIcon("tasks") +
          escapeHtml(String(task.totalHours) + "h planned") +
          "</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</article>"
        );
      },
      "No active tasks yet.",
      "Create a task to populate the execution queue."
    );
  }

  function renderLeaveRequests() {
    dom.leaveRequests.innerHTML = renderCollection(
      state.leaveRequests,
      function (request) {
        const normalizedStatus = request.status.toLowerCase() === "approved" ? "success" : "warning";
        return (
          '<article class="list-item">' +
          '<div class="list-item__body">' +
          '<div class="list-item__top">' +
          "<h3>" +
          escapeHtml(request.name) +
          "</h3>" +
          '<span class="status-pill status-pill--' +
          normalizedStatus +
          '">' +
          escapeHtml(request.status) +
          "</span>" +
          "</div>" +
          "<p>" +
          escapeHtml(request.type) +
          "</p>" +
          '<div class="list-item__footer">' +
          '<div class="list-item__meta">' +
          "<span>" +
          renderIcon("calendar") +
          escapeHtml(request.duration) +
          "</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</article>"
        );
      },
      "No leave requests pending.",
      "New approval requests will appear here."
    );
  }

  function populateAssigneeOptions() {
    dom.assigneeSelect.innerHTML =
      '<option value="" selected disabled>Select a team member</option>' +
      state.teamMembers
        .map(function (member) {
          return (
            '<option value="' +
            escapeHtml(member.name) +
            '">' +
            escapeHtml(member.name + " - " + member.role) +
            "</option>"
          );
        })
        .join("");
  }

  function handleDocumentClick(event) {
    const navButton = event.target.closest("[data-nav-id]");
    if (navButton) {
      handleNavigation(navButton);
      return;
    }

    const openModalButton = event.target.closest("[data-open-modal]");
    if (openModalButton) {
      const modalId = openModalButton.getAttribute("data-open-modal");
      if (modalId === "reports-modal") {
        renderReportsTable();
      }
      openModal(modalId);
      return;
    }

    const closeModalButton = event.target.closest("[data-close-modal]");
    if (closeModalButton) {
      closeModal(closeModalButton.getAttribute("data-close-modal"));
      return;
    }

    const quickActionButton = event.target.closest("[data-quick-action]");
    if (quickActionButton) {
      handleQuickAction(quickActionButton.getAttribute("data-quick-action"));
      return;
    }

    const headerAction = event.target.closest("[data-header-action]");
    if (headerAction) {
      handleHeaderAction(headerAction.getAttribute("data-header-action"));
      return;
    }

    const profileToggle = event.target.closest("[data-profile-toggle]");
    if (profileToggle) {
      toggleProfileMenu();
      return;
    }

    const profileAction = event.target.closest("[data-profile-action]");
    if (profileAction) {
      handleProfileAction(profileAction.getAttribute("data-profile-action"));
      closeProfileMenu();
      return;
    }

    if (dom.profileMenu && !dom.profileMenu.contains(event.target)) {
      closeProfileMenu();
    }
  }

  function handleNavigation(button) {
    const navId = button.getAttribute("data-nav-id");
    const targetId = button.getAttribute("data-target-id");
    const targetNode = document.getElementById(targetId);

    state.activeNavId = navId;
    renderSidebar();
    closeProfileMenu();
    closeSidebar();

    if (targetNode) {
      targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleQuickAction(actionId) {
    let section;

    if (actionId === "assign-task") {
      openModal("task-modal");
      return;
    }

    if (actionId === "manage-leaves") {
      state.activeNavId = "leaves";
      renderSidebar();
      section = document.getElementById("leave-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      showToast("Leave request queue is ready for approval workflow wiring.", "success");
      return;
    }

    if (actionId === "add-member") {
      openModal("member-modal");
      return;
    }

    renderReportsTable();
    openModal("reports-modal");
  }

  function handleHeaderAction(actionId) {
    if (actionId === "search") {
      showToast("Connect the search icon to your dashboard search flow.", "success");
      return;
    }

    showToast("Settings can be wired to preferences, theming, or auth controls.", "success");
  }

  function handleProfileAction(actionId) {
    let section;

    if (actionId === "team") {
      state.activeNavId = "team";
      renderSidebar();
      section = document.getElementById("team-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    showToast("Account settings entry is ready for your auth integration.", "success");
  }

  function toggleProfileMenu() {
    const isExpanded = dom.profileToggle.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      closeProfileMenu();
      return;
    }

    dom.profileToggle.setAttribute("aria-expanded", "true");
    dom.profileDropdown.hidden = false;
  }

  function closeProfileMenu() {
    dom.profileToggle.setAttribute("aria-expanded", "false");
    dom.profileDropdown.hidden = true;
  }

  async function handleMemberSubmit(event) {
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const errors = {};
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      employeeId: String(formData.get("employeeId") || "").trim(),
      designation: String(formData.get("designation") || "").trim()
    };

    event.preventDefault();

    Object.assign(errors, validateMemberPayload(payload));

    if (Object.keys(errors).length) {
      applyFormErrors(form, errors);
      focusFirstInvalidField(form);
      showToast("Please review the highlighted member fields.", "error");
      return;
    }

    clearFormErrors(form);
    setButtonLoading(submitButton, true, "Saving...");

    try {
      await namespace.api.createUser(payload);

      state.teamMembers.unshift({
        id: payload.employeeId,
        name: payload.fullName,
        role: payload.designation,
        shift: "09:30 - 18:30",
        status: "Present",
        initials: createInitials(payload.fullName),
        accent: accentPalette[state.teamMembers.length % accentPalette.length]
      });

      state.progress = state.progress.map(function (item) {
        if (item.id === "attendance") {
          return {
            id: item.id,
            label: item.label,
            current: item.current + 1,
            total: item.total + 1,
            tone: item.tone
          };
        }

        return item;
      });

      renderStats();
      renderProgress();
      renderTeamMembers();
      populateAssigneeOptions();
      closeModal("member-modal");
      showToast("Member created and roster refreshed.", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Member creation failed.", "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  }

  async function handleTaskSubmit(event) {
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const deadline = String(formData.get("deadline") || "").trim();
    const errors = {};
    const payload = {
      id: "TASK-" + Math.floor(Date.now() / 1000),
      taskName: String(formData.get("taskName") || "").trim(),
      assignee: String(formData.get("assignee") || "").trim(),
      deadline: deadline,
      totalHours: Number(formData.get("totalHours") || 0)
    };

    event.preventDefault();

    Object.assign(errors, validateTaskPayload(payload));

    if (Object.keys(errors).length) {
      applyFormErrors(form, errors);
      focusFirstInvalidField(form);
      showToast("Please review the highlighted task fields.", "error");
      return;
    }

    clearFormErrors(form);
    setButtonLoading(submitButton, true, "Assigning...");

    try {
      await namespace.api.createTask(payload);

      state.activeTasks.unshift({
        id: payload.id,
        title: payload.taskName,
        assignee: payload.assignee,
        deadlineLabel: formatDeadline(deadline),
        totalHours: payload.totalHours,
        priority: isToday(deadline) ? "High" : "Medium",
        isDueToday: isToday(deadline)
      });

      state.progress = state.progress.map(function (item) {
        if (item.id === "tasks-completed") {
          return {
            id: item.id,
            label: item.label,
            current: item.current,
            total: item.total + 1,
            tone: item.tone
          };
        }

        return item;
      });

      renderStats();
      renderProgress();
      renderActiveTasks();
      renderReportsTable();
      closeModal("task-modal");
      showToast("Task created and added to the active queue.", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Task creation failed.", "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  }

  function renderReportsTable() {
    if (!state.activeTasks.length) {
      dom.reportsTable.innerHTML = renderEmptyState(
        "No active tasks yet.",
        "As soon as tasks are created, the report table will render them here."
      );
      return;
    }

    dom.reportsTable.innerHTML =
      '<table class="report-table">' +
      "<thead>" +
      "<tr>" +
      "<th>Task</th>" +
      "<th>Assignee</th>" +
      "<th>Priority</th>" +
      "<th>Deadline</th>" +
      "<th>Hours</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      state.activeTasks
        .map(function (task) {
          return (
            "<tr>" +
            "<td>" +
            escapeHtml(task.title) +
            "</td>" +
            "<td>" +
            escapeHtml(task.assignee) +
            "</td>" +
            "<td>" +
            escapeHtml(task.priority) +
            "</td>" +
            "<td>" +
            escapeHtml(task.deadlineLabel) +
            "</td>" +
            "<td>" +
            escapeHtml(String(task.totalHours) + "h") +
            "</td>" +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>" +
      "</table>";
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const form = modal ? modal.querySelector("form") : null;

    if (!modal) {
      return;
    }

    closeProfileMenu();
    state.lastFocusedElement =
      document.activeElement && typeof document.activeElement.focus === "function"
        ? document.activeElement
        : null;

    if (state.openModalId) {
      closeModal(state.openModalId);
    }

    if (modalId === "task-modal") {
      syncTaskDeadlineMin();
    }

    if (form) {
      clearFormErrors(form);
    }

    state.openModalId = modalId;
    modal.hidden = false;
    dom.modalOverlay.hidden = false;

    requestAnimationFrame(function () {
      modal.classList.add("is-open");
      dom.modalOverlay.classList.add("is-visible");
    });

    modal.setAttribute("aria-hidden", "false");
    dom.body.classList.add("is-locked");

    window.setTimeout(function () {
      const primaryField = modal.querySelector("input, select, textarea");
      const fallbackField = getFocusableElements(modal)[0];
      const firstInteractiveNode = primaryField || fallbackField;

      if (firstInteractiveNode) {
        firstInteractiveNode.focus();
      } else {
        modal.focus();
      }
    }, 10);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const form = modal ? modal.querySelector("form") : null;

    if (!modal) {
      return;
    }

    modal.classList.remove("is-open");
    dom.modalOverlay.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    state.openModalId = null;

    if (form) {
      clearFormErrors(form);
      form.reset();
    }

    window.setTimeout(function () {
      modal.hidden = true;
      if (!state.openModalId) {
        dom.modalOverlay.hidden = true;
      }
      syncBodyLock();

      if (
        !state.openModalId &&
        state.lastFocusedElement &&
        document.contains(state.lastFocusedElement)
      ) {
        state.lastFocusedElement.focus();
        state.lastFocusedElement = null;
      } else if (!state.openModalId) {
        state.lastFocusedElement = null;
      }
    }, 180);
  }

  function openSidebar() {
    if (!isMobileViewport()) {
      return;
    }

    closeProfileMenu();
    state.isSidebarOpen = true;
    dom.sidebar.classList.add("is-open");
    dom.sidebarOverlay.hidden = false;
    dom.sidebarToggle.setAttribute("aria-expanded", "true");

    requestAnimationFrame(function () {
      dom.sidebarOverlay.classList.add("is-visible");
      syncBodyLock();
    });
  }

  function closeSidebar() {
    state.isSidebarOpen = false;
    dom.sidebar.classList.remove("is-open");
    dom.sidebarOverlay.classList.remove("is-visible");
    dom.sidebarToggle.setAttribute("aria-expanded", "false");

    window.setTimeout(function () {
      dom.sidebarOverlay.hidden = true;
      syncBodyLock();
    }, 180);
  }

  function syncBodyLock() {
    if (state.openModalId || state.isSidebarOpen) {
      dom.body.classList.add("is-locked");
    } else {
      dom.body.classList.remove("is-locked");
    }
  }

  function handleKeyDown(event) {
    if (state.openModalId && event.key === "Tab") {
      trapModalFocus(event);
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    if (state.openModalId) {
      closeModal(state.openModalId);
      return;
    }

    if (state.isSidebarOpen) {
      closeSidebar();
      return;
    }

    closeProfileMenu();
  }

  function handleResize() {
    if (!isMobileViewport()) {
      closeSidebar();
    }
  }

  function isMobileViewport() {
    return window.innerWidth <= 960;
  }

  function setButtonLoading(button, isLoading, nextLabel) {
    if (!button) {
      return;
    }

    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent.trim();
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? nextLabel : button.dataset.defaultLabel;
  }

  function handleFieldInteraction(event) {
    if (event.target && event.target.name) {
      clearFieldError(event.target);
    }
  }

  function applyFormErrors(form, errors) {
    let fieldName;
    let input;
    let field;
    let errorNode;

    clearFormErrors(form);

    for (fieldName in errors) {
      if (!Object.prototype.hasOwnProperty.call(errors, fieldName)) {
        continue;
      }

      input = form.elements[fieldName];
      if (!input) {
        continue;
      }

      field = input.closest(".field");
      errorNode = field ? field.querySelector(".field__error") : null;

      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");

      if (errorNode) {
        errorNode.textContent = errors[fieldName];
      }
    }
  }

  function clearFormErrors(form) {
    form.querySelectorAll(".field__error").forEach(function (errorNode) {
      errorNode.textContent = "";
    });

    form.querySelectorAll(".is-invalid").forEach(function (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    });
  }

  function clearFieldError(input) {
    const field = input.closest(".field");
    const errorNode = field ? field.querySelector(".field__error") : null;

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");

    if (errorNode) {
      errorNode.textContent = "";
    }
  }

  function focusFirstInvalidField(form) {
    const invalidField = form.querySelector(".is-invalid");

    if (invalidField) {
      invalidField.focus();
    }
  }

  function validateMemberPayload(payload) {
    const errors = {};
    const duplicateMember = state.teamMembers.some(function (member) {
      return member.id.toLowerCase() === payload.employeeId.toLowerCase();
    });

    if (payload.fullName.length < 2) {
      errors.fullName = "Enter a full name with at least 2 characters.";
    }

    if (payload.employeeId.length < 3) {
      errors.employeeId = "Enter an employee ID with at least 3 characters.";
    } else if (duplicateMember) {
      errors.employeeId = "This employee ID already exists in the roster.";
    }

    if (payload.designation.length < 2) {
      errors.designation = "Enter a designation with at least 2 characters.";
    }

    return errors;
  }

  function validateTaskPayload(payload) {
    const errors = {};
    const deadlineDate = new Date(payload.deadline);
    const assigneeExists = state.teamMembers.some(function (member) {
      return member.name === payload.assignee;
    });

    if (payload.taskName.length < 3) {
      errors.taskName = "Enter a task name with at least 3 characters.";
    }

    if (!payload.assignee) {
      errors.assignee = "Select an assignee from the team list.";
    } else if (!assigneeExists) {
      errors.assignee = "Choose a valid team member from the dropdown.";
    }

    if (!payload.deadline || Number.isNaN(deadlineDate.getTime())) {
      errors.deadline = "Select a valid deadline.";
    } else if (deadlineDate.getTime() < Date.now() - 60000) {
      errors.deadline = "Choose a deadline in the future.";
    }

    if (!Number.isFinite(payload.totalHours) || payload.totalHours < 1 || payload.totalHours > 80) {
      errors.totalHours = "Enter total hours between 1 and 80.";
    }

    return errors;
  }

  function trapModalFocus(event) {
    const modal = document.getElementById(state.openModalId);
    const focusableElements = modal ? getFocusableElements(modal) : [];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function getFocusableElements(container) {
    return Array.prototype.slice
      .call(container.querySelectorAll(focusableSelector))
      .filter(function (element) {
        return !element.hasAttribute("hidden") && element.offsetParent !== null;
      });
  }

  function syncTaskDeadlineMin() {
    const deadlineInput = dom.taskForm ? dom.taskForm.elements.deadline : null;

    if (!deadlineInput) {
      return;
    }

    deadlineInput.min = formatDateTimeLocalValue(new Date());
  }

  function formatDateTimeLocalValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
  }

  function showToast(message, tone) {
    window.clearTimeout(state.toastTimer);
    dom.toast.hidden = false;
    dom.toast.textContent = message;
    dom.toast.className = "toast toast--" + (tone || "success");

    state.toastTimer = window.setTimeout(function () {
      dom.toast.hidden = true;
      dom.toast.className = "toast";
      dom.toast.textContent = "";
    }, 3200);
  }

  function renderCollection(items, itemRenderer, emptyTitle, emptyMessage) {
    if (!items.length) {
      return renderEmptyState(emptyTitle, emptyMessage);
    }

    return items.map(itemRenderer).join("");
  }

  function renderEmptyState(title, message) {
    return (
      '<div class="empty-state">' +
      "<h3>" +
      escapeHtml(title) +
      "</h3>" +
      "<p>" +
      escapeHtml(message) +
      "</p>" +
      "</div>"
    );
  }

  function renderIcon(iconName) {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<use href="#icon-' +
      escapeHtml(iconName) +
      '"></use>' +
      "</svg>"
    );
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createInitials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (chunk) {
        return chunk[0].toUpperCase();
      })
      .join("");
  }

  function isToday(dateValue) {
    const targetDate = new Date(dateValue);
    const now = new Date();

    if (Number.isNaN(targetDate.getTime())) {
      return false;
    }

    return (
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate()
    );
  }

  function formatDeadline(dateValue) {
    const date = new Date(dateValue);
    let timeLabel;
    let dayLabel;

    if (Number.isNaN(date.getTime())) {
      return "Invalid deadline";
    }

    timeLabel = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);

    if (isToday(dateValue)) {
      return "Today - " + timeLabel;
    }

    dayLabel = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric"
    }).format(date);

    return dayLabel + " - " + timeLabel;
  }

  namespace.openModal = openModal;
  namespace.closeModal = closeModal;
})();
