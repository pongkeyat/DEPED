import axios from "axios";

const GET_PANELISTS =
    import.meta.env.VITE_PANELISTS_GET ||
    "http://localhost:5000/api/panelists/getAllPanelists";

export const getPanelists = async () => {
    const res = await axios.get(GET_PANELISTS);

    return res.data;
};