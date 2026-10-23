import { useState } from "react";
import UsermanagementHeader from "../components/usermanagement/UseramangementHeader";
import UserManagementTable from "../components/usermanagement/UserManagementTable";


export default function UserManagement() {
    const [usersRefreshKey, setUsersRefreshKey] = useState(0);
    const refreshUsers = () => setUsersRefreshKey((key) => key + 1);

    return(
        <div>
            <div className="mb-4">
            <UsermanagementHeader onUserRegistered={refreshUsers}/>
            </div>
            <UserManagementTable
                refreshKey={usersRefreshKey}
                onUsersChanged={refreshUsers}
            />
            
        </div>
    )
}