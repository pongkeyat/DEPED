import axios from 'axios';

axios.defaults.withCredentials = true;

const LOGIN_API = import.meta.env.VITE_LOGIN_API;
const PROFILE_API = import.meta.env.VITE_PROFILE_API;
const LOGOUT_API = import.meta.env.VITE_LOGOUT_API;
const REGISTER_API = import.meta.env.VITE_REGISTER_API;
const UPDATE_PASSWORD_API = import.meta.env.VITE_UPDATE_PASSWORD;
const GET_USERS_API = import.meta.env.VITE_GET_ALL_USERS;
const UPDATE_USER_API = import.meta.env.VITE_UPDATE_USER;
const ARCHIVE_USER_API = import.meta.env.VITE_ARCHIVE_USER;
const FORGOT_PASSWORD_API = import.meta.env.VITE_FORGOT_PASSWORD;
const RESET_PASSWORD_API = import.meta.env.VITE_RESET_PASSWORD;

// LOGIN
export const loginUser = async (form) => {
    const res = await axios.post(LOGIN_API, form, { withCredentials: true });
    return res.data;
};

// REGISTER USER
export const registerUser = async (form) => {
    const res = await axios.post(REGISTER_API, form, { withCredentials: true });
    return res.data;
};

// GET CURRENT USER PROFILE
export const getProfile = async (token) => {
    const res = await axios.get(PROFILE_API, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
    });
    return res.data;
};

// LOGOUT
export const logoutUser = async (token) => {
    const res = await axios.post(LOGOUT_API, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
    });
    return res.data;
};

// UPDATE PASSWORD
export const updatePasswordApi = async (data, token) => {
    const res = await axios.put(UPDATE_PASSWORD_API, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
    }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
    });
    return res.data;
};

// GET ALL USERS
// GET ALL USERS
export const getAllUsers = async (token) => {
    const res = await axios.get(GET_USERS_API, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
    });
    return res.data;
};

// UPDATE USER
export const updateUser = async (id, userData, token) => {
    const updateUrl =
        `${UPDATE_USER_API.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;
    const res = await axios.put(updateUrl, userData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
    });
    return res.data;
};

// ARCHIVE USER
export const archiveUser = async (id, token) => {
    const res = await axios.patch(ARCHIVE_USER_API, {
        id
    }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
    });
    return res.data;
};



export const forgotPasswordApi = async (email) => {
    const res = await axios.post(
        FORGOT_PASSWORD_API,
        { email },
        { withCredentials: true }
    );

    return res.data;
};

// RESET PASSWORD
export const resetPasswordApi = async (token, newPassword) => {
    const res = await axios.post(
        RESET_PASSWORD_API,
        {
            token,
            newPassword
        },
        { withCredentials: true }
    );

    return res.data;
};