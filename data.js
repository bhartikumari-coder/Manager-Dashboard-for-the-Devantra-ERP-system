(function () {
  const namespace = (window.ManagerDashboard = window.ManagerDashboard || {});

  const dashboardSeed = {
    manager: {
      name: "Priya Sharma",
      role: "Delivery Manager",
      subtitle: "Team visibility for the current delivery window.",
      initials: "PS"
    },
    navItems: [
      { id: "overview", label: "Overview", icon: "dashboard", target: "overview-section", active: true },
      { id: "team", label: "Team Members", icon: "team", target: "team-section", active: false },
      { id: "tasks", label: "Active Tasks", icon: "tasks", target: "tasks-section", active: false },
      { id: "activity", label: "Activity Feed", icon: "activity", target: "activity-section", active: false },
      { id: "leaves", label: "Leave Desk", icon: "calendar", target: "leave-section", active: false }
    ],
    stats: [
      { id: "team-members", label: "Total Team Members", icon: "team", tone: "primary" },
      { id: "active-tasks", label: "Active Tasks", icon: "tasks", tone: "amber" },
      { id: "leave-requests", label: "Pending Leave Requests", icon: "calendar", tone: "rose" },
      { id: "activity-feed", label: "Recent Updates", icon: "activity", tone: "slate" }
    ],
    rating: {
      score: 4.8,
      note: "Performance reviews improved after introducing daily blockers follow-up.",
      badgeCount: 3
    },
    progress: [
      {
        id: "tasks-completed",
        label: "Tasks Completed",
        current: 14,
        total: 18,
        tone: "primary"
      },
      {
        id: "attendance",
        label: "Attendance",
        current: 26,
        total: 28,
        tone: "amber"
      }
    ],
    quickActions: [
      {
        id: "assign-task",
        label: "Assign Task",
        icon: "tasks",
        description: "Create a new delivery task and assign an owner."
      },
      {
        id: "manage-leaves",
        label: "Manage Leaves",
        icon: "calendar",
        description: "Review pending leave requests and approvals."
      },
      {
        id: "add-member",
        label: "Add Member",
        icon: "plus",
        description: "Open the member form and add a new team member."
      },
      {
        id: "view-reports",
        label: "View Reports",
        icon: "chart",
        description: "Open the bonus report view for active tasks."
      }
    ],
    teamMembers: [
      {
        id: "EMP-101",
        name: "Aarav Nair",
        role: "Frontend Engineer",
        shift: "09:30 - 18:30",
        status: "Present",
        initials: "AN",
        accent: "#c8efe3"
      },
      {
        id: "EMP-102",
        name: "Mira Joshi",
        role: "UI Designer",
        shift: "10:00 - 19:00",
        status: "Present",
        initials: "MJ",
        accent: "#fde5bd"
      },
      {
        id: "EMP-103",
        name: "Kabir Sethi",
        role: "QA Analyst",
        shift: "09:00 - 18:00",
        status: "On Leave",
        initials: "KS",
        accent: "#f7d6df"
      },
      {
        id: "EMP-104",
        name: "Ritika Verma",
        role: "Project Coordinator",
        shift: "09:30 - 18:30",
        status: "Present",
        initials: "RV",
        accent: "#d8e7fb"
      },
      {
        id: "EMP-105",
        name: "Ishaan Rao",
        role: "Backend Engineer",
        shift: "11:00 - 20:00",
        status: "Present",
        initials: "IR",
        accent: "#dcefd9"
      },
      {
        id: "EMP-106",
        name: "Naina Kapoor",
        role: "HR Operations",
        shift: "09:30 - 18:00",
        status: "Present",
        initials: "NK",
        accent: "#f1ddfb"
      }
    ],
    leaveRequests: [
      {
        id: "LR-21",
        name: "Kabir Sethi",
        type: "Sick Leave",
        duration: "Today",
        status: "Pending"
      },
      {
        id: "LR-22",
        name: "Aditi Mehra",
        type: "Casual Leave",
        duration: "Mar 26 - Mar 27",
        status: "Approved"
      },
      {
        id: "LR-23",
        name: "Dev Khanna",
        type: "Work From Home",
        duration: "Mar 25",
        status: "Pending"
      }
    ],
    recentActivity: [
      {
        id: "ACT-1",
        title: "Attendance widget QA sweep completed",
        description: "Ritika signed off the mobile edge cases before the evening release window.",
        time: "10 mins ago",
        type: "Update"
      },
      {
        id: "ACT-2",
        title: "Sprint checkpoint moved to 4:00 PM",
        description: "Product and QA aligned on a shorter review slot to unblock handoff faster.",
        time: "35 mins ago",
        type: "Announcement"
      },
      {
        id: "ACT-3",
        title: "New design handoff uploaded",
        description: "Mira attached refreshed leave-panel mocks for tablet breakpoints.",
        time: "1 hour ago",
        type: "Design"
      },
      {
        id: "ACT-4",
        title: "Backend staging refresh complete",
        description: "Ishaan confirmed the new user creation endpoint is available for testing.",
        time: "2 hours ago",
        type: "Backend"
      }
    ],
    activeTasks: [
      {
        id: "TASK-201",
        title: "Attendance widget QA sweep",
        assignee: "Ritika Verma",
        deadlineLabel: "Today - 5:30 PM",
        totalHours: 5,
        priority: "High",
        isDueToday: true
      },
      {
        id: "TASK-202",
        title: "Sidebar mobile overlay polish",
        assignee: "Aarav Nair",
        deadlineLabel: "Mar 25 - 1:00 PM",
        totalHours: 3,
        priority: "Medium",
        isDueToday: false
      },
      {
        id: "TASK-203",
        title: "Leave approval microcopy review",
        assignee: "Mira Joshi",
        deadlineLabel: "Mar 25 - 4:30 PM",
        totalHours: 2,
        priority: "Low",
        isDueToday: false
      },
      {
        id: "TASK-204",
        title: "New member form payload validation",
        assignee: "Ishaan Rao",
        deadlineLabel: "Today - 7:15 PM",
        totalHours: 4,
        priority: "High",
        isDueToday: true
      }
    ]
  };

  namespace.fetchDashboardData = async function fetchDashboardData() {
    await new Promise(function (resolve) {
      window.setTimeout(resolve, 220);
    });

    return JSON.parse(JSON.stringify(dashboardSeed));
  };
})();
