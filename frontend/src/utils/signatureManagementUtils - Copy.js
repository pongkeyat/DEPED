const STORAGE_KEY = "deped_hrmpsb_signature_settings_v1";
const DEFAULT_POSITION = "HRMPSB Member";

const getUserId = (user) => user?.id ?? user?.user_id ?? user?.users_id;
const isArchived = (user) =>
  user?.is_archived === true ||
  user?.is_archived === 1 ||
  String(user?.is_archived).toLowerCase() === "true";

export function getUserList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  return [];
}

export function getSavedHrmpsbMembers(users = []) {
  let settings = {};
  try {
    settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    settings = {};
  }

  return users
    .filter(
      (user) =>
        String(user?.role || "").trim().toLowerCase() === "hrmpsb" &&
        !isArchived(user)
    )
    .map((user) => {
      const id = String(getUserId(user) ?? "");
      const saved = settings[id] || {};
      const fullName =
        [user?.first_name, user?.middle_name, user?.last_name, user?.suffix]
          .filter(Boolean)
          .join(" ") ||
        user?.full_name ||
        user?.name ||
        "Unnamed user";
      return {
        ...user,
        id: getUserId(user),
        full_name: fullName,
        position: saved.position || DEFAULT_POSITION,
        order: Number(saved.order ?? 9999),
      };
    })
    .sort((a, b) => a.order - b.order || a.full_name.localeCompare(b.full_name))
    .map((member, index) => ({ ...member, order: index + 1 }));
}
