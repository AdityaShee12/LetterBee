import axios from "axios";
import toast from "react-hot-toast";
import { store } from "../app/store";

// BASE CONFIG
const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000,
});

// ======================================
// REQUEST INTERCEPTOR
// ======================================
api.interceptors.request.use(
    (config) => {
        const state = store.getState();

        const accessToken =
            state?.auth?.accessToken;

        if (accessToken) {
            config.headers.Authorization =
                `Bearer ${accessToken}`;
        }

        console.log(
            `🚀 ${config.method?.toUpperCase()} ${config.url}`,
            {
                data: config.data,
                params: config.params,
            }
        );

        return config;
    },
    (error) => {
        console.error(
            "❌ Request Interceptor Error:",
            error
        );

        return Promise.reject(error);
    }
);

// ======================================
// TOKEN REFRESH QUEUE
// ======================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
};

// ======================================
// FORCE LOGOUT HANDLER
// ======================================
let isForceLoggingOut = false;

const forceLogout = (message) => {

    // Prevent multiple logout executions
    if (isForceLoggingOut) return;

    isForceLoggingOut = true;

    // Reject all pending requests
    const sessionError = {
        success: false,
        statusCode: 401,
        message,
        code: "SESSION_REPLACED",
    };

    processQueue(sessionError, null);

    // Show notification only once
    toast.error(message);

    // Redirect to login
    window.location.replace(
        "sign_in?reason=session-replaced"
    );
};

// ======================================
// RESPONSE INTERCEPTOR
// ======================================
api.interceptors.response.use(

    // SUCCESS RESPONSE
    (response) => {

        console.log(
            `✅ ${response.config.method?.toUpperCase()} ${response.config.url}`,
            response.data
        );

        return response;
    },

    // ERROR RESPONSE
    async (error) => {

        const originalRequest = error.config;

        const status = error.response?.status;

        const responseData = error.response?.data;

        const errorCode = responseData?.message;
        const errorMessage = responseData?.message ||
            error.message ||
            "Something went wrong!";

        const message =
            responseData?.message ||
            error.message ||
            "Something went wrong!";

        console.error(
            `❌ API Error => ${originalRequest?.url}`,
            {
                status,
                errorMessage, 
                originalRequest,
            }
        );

        // ==================================
        // 1. SESSION REPLACED
        // ==================================

        // IMPORTANT:
        // Handle this BEFORE normal 401 refresh logic.
        if (errorMessage === "SESSION_REPLACED") {

            forceLogout(
                message ||
                "Your account is logged in on another device. Please login again."
            );

            return Promise.reject({
                success: false,
                statusCode: 401,
                message,
                code: "SESSION_REPLACED",
                data: responseData || null,
            });
        }

        // ==================================
        // 2. NORMAL 401 ACCESS TOKEN REFRESH
        // ==================================
        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {

            // If another request is already refreshing
            // wait for the new access token.
            if (isRefreshing) {
                return new Promise(
                    (resolve, reject) => {
                        failedQueue.push({
                            resolve,
                            reject,
                        });
                    }
                )
                    .then((token) => {
                        originalRequest.headers =
                            originalRequest.headers || {};

                        originalRequest.headers.Authorization =
                            `Bearer ${token}`;

                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;

            isRefreshing = true;

            try {
                // Refresh access token
                const response = await axios.post(
                    `${API_URL}/auth/refreshAccessToken`,
                    {},
                    {
                        withCredentials: true,
                    }
                );

                // Check refresh response for session replacement
                if (
                    response.data?.code ===
                    "SESSION_REPLACED"
                ) {
                    forceLogout(
                        response.data.message ||
                        "Your account is logged in on another device. Please login again."
                    );

                    return Promise.reject({
                        success: false,
                        statusCode: 401,
                        message: response.data.message,
                        code: "SESSION_REPLACED",
                    });
                }

                const newAccessToken =
                    response.data?.data?.accessToken;

                if (!newAccessToken) {
                    throw new Error(
                        "New access token not received!"
                    );
                }

                // Resolve all queued requests
                processQueue(
                    null,
                    newAccessToken
                );

                // Retry original request
                originalRequest.headers =
                    originalRequest.headers || {};

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                console.error(
                    "❌ Refresh Token Failed:",
                    refreshError
                );

                // Check SESSION_REPLACED inside refresh error
                const refreshErrorCode =
                    refreshError.response?.data?.code ||
                    refreshError.code;

                const refreshErrorMessage =
                    refreshError.response?.data?.message;

                if (
                    refreshErrorCode ===
                    "SESSION_REPLACED"
                ) {
                    forceLogout(
                        refreshErrorMessage ||
                        "Your account is logged in on another device. Please login again."
                    );
                    return Promise.reject({
                        success: false,
                        statusCode: 401,
                        message: refreshErrorMessage,
                        code: "SESSION_REPLACED",
                    });
                }

                // Reject pending requests
                processQueue(
                    refreshError,
                    null
                );

                toast.error(
                    "Session expired. Please login again."
                );

                window.location.replace("sign_in");

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ==================================
        // 3. NETWORK ERROR
        // ==================================
        if (!error.response) {

            toast.error(
                "Server is not responding!"
            );

            return Promise.reject({
                success: false,
                statusCode: 500,
                message:
                    "Server is not responding!",
            });
        }

        // ==================================
        // 4. OTHER API ERRORS
        // ==================================
        if (status !== 401) {
            toast.error(message);
        }

        return Promise.reject({
            success: false,
            statusCode: status,
            message,
            code: errorCode,
            data: responseData || null,
        });
    }
);

// COMMON API REQUEST HANDLER
const apiRequest = async (
    apiCall
) => {
    try {
        const response =
            await apiCall();
        return {
            success: true,
            statusCode:
                response.status,
            message:
                response.data?.message ||
                "Request successful",
            data:
                response.data?.data ||
                response.data,
        };
    } catch (error) {
        throw {
            success: false,
            statusCode:
                error.statusCode || 500,
            message:
                error.message ||
                "Something went wrong",
            data:
                error.data || null,
        };
    }
};

// AUTH API
export const authAPI = {

    sendOTP: async (data) =>
        apiRequest(() =>
            api.post(
                "auth/sendOTP",
                data
            )
        ),

    sendOTPforPassword: async (data) =>
        apiRequest(() =>
            api.post(
                "auth/sendOTPforPassword",
                data
            )
        ),

    verifyOTPforPassword: async (data) =>
        apiRequest(() =>
            api.post(
                "auth/verifyOTPforPassword",
                data
            )
        ),

    register: async (data) =>
        apiRequest(() =>
            api.post(
                "auth/register",
                data
            )
        ),

    login: async (data) =>
        apiRequest(() =>
            api.post(
                "auth/login",
                data
            )
        ),

    autoLogin: async () =>
        apiRequest(() =>
            api.get(
                "auth/autoLogin",
            )
        ),

    logout: async () =>
        apiRequest(() =>
            api.post(
                "auth/logout", {},
            )
        ),

    refreshAccessToken: async () =>
        apiRequest(() =>
            api.post(
                "/refreshAccessToken"
            )
        ),
};

export const chatAPI = {

    lastSms: async (data) =>
        apiRequest(() =>
            api.get(
                `chat/lastSms?userId=${data}`,
            )
        ),

    previousChat: async (data) =>
        apiRequest(() =>
            api.get(`chat/previousChat`,
                data)
        )
}

export const groupAPI = {

    createGroups: async (formdata) =>
        apiRequest(() =>
            api.post("/groups/createGroup", formdata
            )
        ),

    fetchGroups: async (userId) =>
        apiRequest(() =>
            api.get(`/groups/fetchGroups?userId=${userId}`)),

    lastSms: async (data) =>
        apiRequest(() =>
            api.get(
                `chat/lastSms?userId=${data}`,
            )
        ),

    previousChat: async (data) =>
        apiRequest(() =>
            api.get(`chat/previousChat`,
                data)
        ),
}

export const userAPI = {

    searchUser: async ({ searchText, userId }) =>
        apiRequest(() =>
            api.get(`/user/searchUser?query=${searchText}&userId=${userId}`)
        ),

    searchGroupUser: async (userId) =>
        apiRequest(() =>
            api.get(`/user/searchGroupUser?userId=${userId}`)
        ),

    getMe: async () =>
        apiRequest(() =>
            api.get("/profile/me")
        ),

    resetPassword: async (data) =>
        apiRequest(() =>
            api.post(
                "/profile/passwordChange",
                data
            )
        ),

    profilePicChange: async (data) =>
        apiRequest(() =>
            api.post(
                "/profile/profilePicChange",
                data
            )
        ),

    profileAboutChange: async (data) =>
        apiRequest(() =>
            api.post(
                "/profile/profileAboutChange",
                data
            )
        ),
}

export default api;