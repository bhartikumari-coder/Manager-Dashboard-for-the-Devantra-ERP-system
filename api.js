(function () {
  const namespace = (window.ManagerDashboard = window.ManagerDashboard || {});
  const runtimeConfig = Object.assign(
    {
      apiBaseUrl: "",
      demoMode: true,
      requestTimeoutMs: 10000
    },
    window.DASHBOARD_CONFIG || {}
  );

  function buildUrl(path) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = String(runtimeConfig.apiBaseUrl || "").replace(/\/$/, "");
    return baseUrl ? baseUrl + path : path;
  }

  async function parseResponse(response) {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      return responseText;
    }
  }

  async function request(path, options) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(function () {
      controller.abort();
    }, Number(runtimeConfig.requestTimeoutMs || 10000));

    try {
      const response = await fetch(
        buildUrl(path),
        Object.assign({}, options, {
          headers: Object.assign(
            { Accept: "application/json" },
            options && options.body ? { "Content-Type": "application/json" } : {},
            options && options.headers ? options.headers : {}
          ),
          signal: controller.signal
        })
      );

      const parsedBody = await parseResponse(response);

      if (!response.ok) {
        const message =
          parsedBody && typeof parsedBody === "object" && parsedBody.message
            ? parsedBody.message
            : "Request failed with status " + response.status + ".";
        throw new Error(message);
      }

      return parsedBody;
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("The request timed out. Please try again.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function mockDelay(payload) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve(Object.assign({ mock: true }, payload));
      }, 280);
    });
  }

  async function createUser(payload) {
    try {
      return await request("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (runtimeConfig.demoMode) {
        return mockDelay({
          id: payload.employeeId,
          fullName: payload.fullName,
          designation: payload.designation
        });
      }

      throw error;
    }
  }

  async function createTask(payload) {
    try {
      return await request("/tasks", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (runtimeConfig.demoMode) {
        return mockDelay({
          id: payload.id,
          taskName: payload.taskName,
          assignee: payload.assignee,
          deadline: payload.deadline,
          totalHours: payload.totalHours
        });
      }

      throw error;
    }
  }

  namespace.api = {
    createUser: createUser,
    createTask: createTask,
    getConfig: function getConfig() {
      return Object.assign({}, runtimeConfig);
    }
  };
})();
