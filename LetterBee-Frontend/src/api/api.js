import axios from "axios";
import toast from "react-hot-toast";
import { store } from "../app/store";

// BASE CONFIG
const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000,
});

// REQUEST INTERCEPTOR
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

let isRefreshing = false;
let failedQueue = [];
const processQueue = (
    error,
    token = null
) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => {
        console.log(
            `✅ ${response.config.method?.toUpperCase()} ${response.config.url}`,
            response.data
        );
        return response;
    },
    async (error) => {
        const originalRequest =
            error.config;
        const status =
            error.response?.status;
        const message =
            error.response?.data?.message ||
            error.message ||
            "Something went wrong!";
        console.error(
            `❌ API Error => ${originalRequest?.url}`,
            {
                status,
                message,
                data: error.response?.data,
            }
        );
        if (
            status === 401 &&
            !originalRequest._retry
        ) {
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
                        originalRequest.headers.Authorization =
                            `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) =>
                        Promise.reject(err)
                    );
            }
            originalRequest._retry = true;
            isRefreshing = true;
            // try {
            //     const response =
            //         await axios.post(
            //             `${API_URL}/auth/refreshAccessToken`,
            //             {},
            //             {
            //                 withCredentials: true,
            //             }
            //         );
            //     const newAccessToken =
            //         response.data?.data?.accessToken;
            //     store.dispatch(
            //         setAccessToken(
            //             newAccessToken
            //         )
            //     );
            //     processQueue(
            //         null,
            //         newAccessToken
            //     );
            //     originalRequest.headers.Authorization =
            //         `Bearer ${newAccessToken}`;
            //     return api(originalRequest);
            // } catch (refreshError) {
            //     console.error(
            //         "❌ Refresh Token Failed:",
            //         refreshError
            //     );
            //     processQueue(
            //         refreshError,
            //         null
            //     );
            //     store.dispatch(logout());
            //     toast.error(
            //         "Session expired. Please login again."
            //     );
            //     window.location.href =
            //         "/login";
            //     return Promise.reject(
            //         refreshError
            //     );
            // } finally {
            //     isRefreshing = false;
            // }
        }
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
        if (status !== 401) {
            toast.error(message);
        }
        return Promise.reject({
            success: false,
            statusCode: status,
            message,
            data:
                error.response?.data || null,
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

    verifyOTP: async (data) =>
        apiRequest(() =>
            api.post(
                "auth/verifyOTP",
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

    logout: async () =>
        apiRequest(() =>
            api.post(
                "auth/logout"
            )
        ),

    refreshAccessToken: async () =>
        apiRequest(() =>
            api.post(
                "/refreshAccessToken"
            )
        ),

    getMe: async () =>
        apiRequest(() =>
            api.get("/auth/me")
        ),

    forgotPassword: async (email) =>
        apiRequest(() =>
            api.post(
                "/auth/forgot-password",
                { email }
            )
        ),

    resetPassword: async (data) =>
        apiRequest(() =>
            api.post(
                "/auth/reset-password",
                data
            )
        ),

    profilePicChange: async (data) =>
        apiRequest(() =>
            api.post(
                "/auth/profilePicChange",
                data
            )
        ),

    profileAboutChange: async (data) =>
        apiRequest(() =>
            api.post(
                "/auth/profileAboutChange",
                data
            )
        ),
};

export const chatAPI = {
    previousChat: async (data) =>
        apiRequest(() =>
            api.get(
                `chat/chatList?userId=${data}`,
                data
            )
        ),
}

export const userAPI = {
    searchUser: async ({ searchText, userId }) =>
        apiRequest(() =>
        api.get(`/users/searchUser?query=${searchText}&userId=${userId}`)),
}

export default api;