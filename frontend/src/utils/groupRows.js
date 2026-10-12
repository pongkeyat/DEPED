// Helpers for "type the shared value once, add rows under it" sections
// (School/University, Place of Exam, Company/Office Name).
//
// Data stays a FLAT list. Every row has its own copy of the shared value
// (e.g. school_name) and a `group_id` that ties rows of the same group
// together. `group_id` is only used by the form: strip it before sending.

export const makeGroupId = () =>
  `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

// Rows saved before grouping existed have no group_id: each is its own group.
export const rowGroupId = (row, index) => row?.group_id ?? `legacy-${index}`;

const realId = (groupId) =>
  groupId.startsWith("legacy-") ? makeGroupId() : groupId;

// -> [{ id, value, rows: [{ item, index }] }]  (index = position in the flat list)
export const buildGroups = (list, groupField) => {
  const groups = [];
  const map = new Map();

  list.forEach((row, index) => {
    const id = rowGroupId(row, index);

    if (!map.has(id)) {
      const group = { id, value: row?.[groupField] || "", rows: [] };
      map.set(id, group);
      groups.push(group);
    }

    map.get(id).rows.push({ item: row, index });
  });

  return groups;
};

// Typing the shared value updates every row of that group
export const setGroupValue = (list, groupId, groupField, value) => {
  const id = realId(groupId);

  return list.map((row, i) =>
    rowGroupId(row, i) === groupId
      ? { ...row, group_id: id, [groupField]: value }
      : row
  );
};

// New group (e.g. a different school) with one empty row
export const addGroupRow = (list, makeRow) => [
  ...list,
  makeRow(makeGroupId(), ""),
];

// New row inside an existing group: the shared value is reused, not retyped
export const addRowToGroup = (list, groupId, groupField, makeRow) => {
  const id = realId(groupId);

  const updated = list.map((row, i) =>
    rowGroupId(row, i) === groupId ? { ...row, group_id: id } : row
  );

  let lastIndex = -1;
  updated.forEach((row, i) => {
    if (row.group_id === id) lastIndex = i;
  });

  const sharedValue =
    list.find((row, i) => rowGroupId(row, i) === groupId)?.[groupField] || "";

  updated.splice(lastIndex + 1, 0, makeRow(id, sharedValue));
  return updated;
};

export const removeRowAt = (list, index) => list.filter((_, i) => i !== index);

export const removeGroupById = (list, groupId) =>
  list.filter((row, i) => rowGroupId(row, i) !== groupId);

// Remove the form-only group_id before sending to the API
export const stripGroupIds = (list) =>
  (Array.isArray(list) ? list : []).map(({ group_id, ...rest }) => rest);