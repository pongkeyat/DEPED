import axios from "axios";

const GET_POSITIONS = import.meta.env.VITE_POSITIONS_GET;
const CREATE_POSITION = import.meta.env.VITE_POSITIONS_CREATE;
const UPDATE_POSITION = import.meta.env.VITE_POSITIONS_UPDATE;
const ARCHIVE_POSITION = import.meta.env.VITE_POSITIONS_ARCHIVE;

// ======================================================
// GET ALL POSITIONS
// ======================================================
export const getPositions = async (
    category = "",
    limit = 20,
    page = 1,
    search = "",
    status = ""
) => {
    const params = {
        limit,
        page,
    };

    if (category) params.category = category;
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await axios.get(GET_POSITIONS, {
        params,
    });

    return response.data;
};

// ======================================================
// CREATE POSITION
// ======================================================
export const createPosition = async (positionData) => {
    const response = await axios.post(
        CREATE_POSITION,
        positionData
    );

    return response.data;
};

// ======================================================
// UPDATE POSITION
// ======================================================
export const updatePosition = async (
    position_id,
    positionData
) => {
    const response = await axios.put(
        `${UPDATE_POSITION}/${encodeURIComponent(position_id)}`,
        positionData
    );

    return response.data;
};

// ======================================================
// ARCHIVE POSITION
// ======================================================
export const archivePosition = async (position_id) => {
    const response = await axios.patch(
        `${ARCHIVE_POSITION}/${encodeURIComponent(position_id)}/archive`
    );

    return response.data;
};