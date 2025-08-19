import axiosBase from "axios";
import cookies from "js-cookie";

const axios = axiosBase.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axios.interceptors.request.use((config) => {
  const token = cookies.get("_nova_session");
  const isApiV2 = config.url?.includes(
    process.env.NEXT_PUBLIC_REST_MAIN_URL ||
    "https://api-v2.nova.trade/api-v1",
  );

  const isIgniteBackend = config.url?.includes(
    "backend-new-staging.nova.trade",
  );

  if (isApiV2 || isIgniteBackend) {
    config.withCredentials = true;
  }
  if (token) {
    config.headers["X-Nova-Session"] = `${token}`;
  }

  return config;
});

let unauthorizedCount = 0;

axios.interceptors.response.use(
  (response) => {
    // reset on success response
    unauthorizedCount = 0;
    return response;
  },
  (error) => {
    const isMainUrl = error.config.url?.includes(
      process.env.NEXT_PUBLIC_REST_MAIN_URL ||
      "https://api-v2.nova.trade/api-v1",
    );
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (
      (status === 401 || message === "Invalid session") &&
      typeof window !== "undefined"
    ) {
      unauthorizedCount += 1;

      if (unauthorizedCount >= 3) {
        // Clear session and redirect
        cookies.remove("_nova_session");
        cookies.remove("_twitter_api_key");
        cookies.remove("_truthsocial_api_key");
        cookies.remove("isNew");
        localStorage.removeItem("loginStep");
        localStorage.removeItem("authToken");
        localStorage.removeItem("quick-buy-settings");

        window.location.href = "/login";
      }
    } else {
      // reset on other error response
      unauthorizedCount = 0;
    }

    return Promise.reject(error);
  },
);

export default axios;
