
import axios from "axios";

// ======================================================
// PLACE OF ASSIGNMENT API
// ======================================================

const PLACE_OF_ASSIGNMENTS_GET =
  import.meta.env.VITE_PLACE_OF_ASSIGNMETS_GET ||
  "http://localhost:5000/api/places-of-assignment";

const PLACE_OF_ASSIGNMENTS_POST =
  import.meta.env.VITE_PLACE_OF_ASSIGNMETS_POST ||
  "http://localhost:5000/api/places-of-assignment";

const PLACE_OF_ASSIGNMENTS_EDIT =
  import.meta.env.VITE_PLACE_OF_ASSIGNMETS_EDIT ||
  "http://localhost:5000/api/places-of-assignment/:place_id";

const PLACE_OF_ASSIGNMENTS_ARCHIVE =
  import.meta.env.VITE_PLACE_OF_ASSIGNMETS_ARCHIVE ||
  "http://localhost:5000/api/places-of-assignment/:place_id/archive";

const PLACE_OF_ASSIGNMENTS_RESTORE =
  import.meta.env.VITE_PLACE_OF_ASSIGNMETS_RESTORE ||
  "http://localhost:5000/api/places-of-assignment/:place_id/restore";

// ======================================================
// OFFICE UNITS API
// ======================================================

const OFFICE_UNITS_GET =
  import.meta.env.VITE_OFFICE_UNITS_GET ||
  "http://localhost:5000/api/office-units";

const OFFICE_UNITS_POST =
  import.meta.env.VITE_OFFICE_UNITS_POST ||
  "http://localhost:5000/api/office-units";

const OFFICE_UNITS_EDIT =
  import.meta.env.VITE_OFFICE_UNITS_EDIT ||
  "http://localhost:5000/api/office-units/:office_unit_id";

const OFFICE_UNITS_ARCHIVE =
  import.meta.env.VITE_OFFICE_UNITS_ARCHIVE ||
  "http://localhost:5000/api/office-units/:office_unit_id/archive";

const OFFICE_UNITS_RESTORE =
  import.meta.env.VITE_OFFICE_UNITS_RESTORE ||
  "http://localhost:5000/api/office-units/:office_unit_id/restore";

// ======================================================
// HELPERS
// ======================================================

const getUrlWithId = (urlTemplate, id, placeholder) => {
  if (id === undefined || id === null || id === "") {
    throw new Error("A valid record ID is required.");
  }

  return urlTemplate.replace(
    placeholder,
    encodeURIComponent(String(id)),
  );
};

const unwrapRecords = (response) =>
  response?.data?.data ?? response?.data ?? [];

// ======================================================
// PLACE OF ASSIGNMENT FUNCTIONS
// ======================================================

export const getPlacesOfAssignment = async (
  includeArchived = false,
) => {
  const response = await axios.get(PLACE_OF_ASSIGNMENTS_GET, {
    params: { includeArchived },
  });

  return unwrapRecords(response);
};

export const createPlaceOfAssignment = async (name) => {
  const response = await axios.post(PLACE_OF_ASSIGNMENTS_POST, {
    place_name: name,
  });

  return response.data;
};

export const updatePlaceOfAssignment = async (placeId, name) => {
  const url = getUrlWithId(
    PLACE_OF_ASSIGNMENTS_EDIT,
    placeId,
    ":place_id",
  );

  const response = await axios.put(url, { place_name: name });

  return response.data;
};

export const archivePlaceOfAssignment = async (placeId) => {
  const url = getUrlWithId(
    PLACE_OF_ASSIGNMENTS_ARCHIVE,
    placeId,
    ":place_id",
  );

  const response = await axios.patch(url);

  return response.data;
};

export const restorePlaceOfAssignment = async (placeId) => {
  const url = getUrlWithId(
    PLACE_OF_ASSIGNMENTS_RESTORE,
    placeId,
    ":place_id",
  );

  const response = await axios.patch(url);

  return response.data;
};

// ======================================================
// OFFICE UNIT FUNCTIONS
// ======================================================

export const getOfficeUnits = async (includeArchived = false) => {
  const response = await axios.get(OFFICE_UNITS_GET, {
    params: { includeArchived },
  });

  return unwrapRecords(response);
};

export const createOfficeUnit = async (name) => {
  const response = await axios.post(OFFICE_UNITS_POST, {
    office_unit_name: name,
  });

  return response.data;
};

export const updateOfficeUnit = async (officeUnitId, name) => {
  const url = getUrlWithId(
    OFFICE_UNITS_EDIT,
    officeUnitId,
    ":office_unit_id",
  );

  const response = await axios.put(url, { office_unit_name: name });

  return response.data;
};

export const archiveOfficeUnit = async (officeUnitId) => {
  const url = getUrlWithId(
    OFFICE_UNITS_ARCHIVE,
    officeUnitId,
    ":office_unit_id",
  );

  const response = await axios.patch(url);

  return response.data;
};

export const restoreOfficeUnit = async (officeUnitId) => {
  const url = getUrlWithId(
    OFFICE_UNITS_RESTORE,
    officeUnitId,
    ":office_unit_id",
  );

  const response = await axios.patch(url);

  return response.data;
};

const apiByType = {
  places: {
    get: getPlacesOfAssignment,
    create: createPlaceOfAssignment,
    update: updatePlaceOfAssignment,
    archive: archivePlaceOfAssignment,
    restore: restorePlaceOfAssignment,
  },
  offices: {
    get: getOfficeUnits,
    create: createOfficeUnit,
    update: updateOfficeUnit,
    archive: archiveOfficeUnit,
    restore: restoreOfficeUnit,
  },
};

const getApi = (type) => {
  const api = apiByType[type];
  if (!api) throw new Error(`Unknown assignment master type: ${type}`);
  return api;
};

export const getAssignmentMasterRecords = (type, includeArchived = false) =>
  getApi(type).get(includeArchived);

export const createAssignmentMasterRecord = (type, name) =>
  getApi(type).create(name);

export const updateAssignmentMasterRecord = (type, id, name) =>
  getApi(type).update(id, name);

export const archiveAssignmentMasterRecord = (type, id) =>
  getApi(type).archive(id);

export const restoreAssignmentMasterRecord = (type, id) =>
  getApi(type).restore(id);
