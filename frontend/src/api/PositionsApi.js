import axios from "axios";

const GET_POSITIONS = import.meta.env.VITE_POSITIONS_GET;

export const getPositions = async (category = "", limit = 20) => {
    const params = {};

    if (category) {
        params.category = category;
    }

    params.limit = limit;

    const response = await axios.get(GET_POSITIONS, {
        params,
    });

    return response.data;
};